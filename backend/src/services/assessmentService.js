const prisma = require('../config/db');

const calculateAssessmentStatus = (assessment) => {
  if (assessment.status === 'CANCELLED' || assessment.status === 'DRAFT') {
    return assessment.status;
  }

  const now = new Date();
  if (assessment.startTime && assessment.endTime) {
    const start = new Date(assessment.startTime);
    const end = new Date(assessment.endTime);
    if (now >= start && now <= end) {
      return 'LIVE';
    } else if (now > end) {
      return 'COMPLETED';
    } else {
      return 'SCHEDULED';
    }
  }

  return assessment.status;
};

const getAssessments = async ({ page = 1, limit = 10, search = '', status, userId }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const where = {
    createdBy: userId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ],
    }),
  };

  const [total, assessments] = await Promise.all([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            candidates: true,
            questions: true,
            sessions: true,
          },
        },
      },
    }),
  ]);

  const formatted = assessments.map((a) => ({
    ...a,
    dynamicStatus: calculateAssessmentStatus(a),
  }));

  return {
    assessments: formatted,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

const getAssessmentById = async (id, userId, userRole) => {
  const assessmentId = parseInt(id, 10);
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      candidates: {
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              education: true,
              skills: true,
            },
          },
        },
      },
      questions: {
        orderBy: { displayOrder: 'asc' },
        include: {
          question: true,
        },
      },
      sessions: {
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  // Permission Checks
  if (userRole === 'INTERVIEWER') {
    if (assessment.createdBy !== userId) {
      const error = new Error('Forbidden: You do not have permission to view this assessment');
      error.statusCode = 403;
      throw error;
    }
  } else if (userRole === 'CANDIDATE') {
    const isAssigned = assessment.candidates.some((c) => c.candidateId === userId);
    if (!isAssigned) {
      const error = new Error('Forbidden: You are not assigned to this assessment');
      error.statusCode = 403;
      throw error;
    }
  }

  const dynamicStatus = calculateAssessmentStatus(assessment);

  return {
    ...assessment,
    dynamicStatus,
  };
};

const createAssessment = async (
  { title, description, duration, startTime, endTime, candidateIds = [], questionIds = [] },
  createdBy
) => {
  if (!title) {
    const error = new Error('Assessment title is required');
    error.statusCode = 400;
    throw error;
  }

  // Deduplicate IDs
  const uniqueCandidateIds = [...new Set(candidateIds.map((id) => parseInt(id, 10)))];
  const uniqueQuestionIds = [...new Set(questionIds.map((id) => parseInt(id, 10)))];

  // Execute inside atomic Prisma Transaction
  const newAssessment = await prisma.$transaction(async (tx) => {
    // 1. Verify candidate IDs exist
    if (uniqueCandidateIds.length > 0) {
      const validCandidates = await tx.user.findMany({
        where: { id: { in: uniqueCandidateIds }, role: 'CANDIDATE' },
        select: { id: true },
      });
      if (validCandidates.length !== uniqueCandidateIds.length) {
        throw new Error('One or more selected candidate IDs are invalid');
      }
    }

    // 2. Verify question IDs exist
    if (uniqueQuestionIds.length > 0) {
      const validQuestions = await tx.question.findMany({
        where: { id: { in: uniqueQuestionIds }, isDeleted: false },
        select: { id: true },
      });
      if (validQuestions.length !== uniqueQuestionIds.length) {
        throw new Error('One or more selected question IDs are invalid');
      }
    }

    const durationMins = parseInt(duration, 10) || 60;
    const start = startTime ? new Date(startTime) : null;
    let end = endTime ? new Date(endTime) : null;

    if (start && !end) {
      end = new Date(start.getTime() + durationMins * 60 * 1000);
    }

    const initialStatus = start ? (new Date() >= start && new Date() <= end ? 'LIVE' : 'SCHEDULED') : 'DRAFT';

    // 3. Create Assessment
    const assessment = await tx.assessment.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        duration: durationMins,
        startTime: start,
        endTime: end,
        status: initialStatus,
        createdBy,
      },
    });

    // 4. Create AssessmentCandidates
    if (uniqueCandidateIds.length > 0) {
      await tx.assessmentCandidate.createMany({
        data: uniqueCandidateIds.map((cId) => ({
          assessmentId: assessment.id,
          candidateId: cId,
          status: 'INVITED',
        })),
      });

      // 5. Initialize Candidate AssessmentSessions
      await Promise.all(
        uniqueCandidateIds.map((cId) =>
          tx.assessmentSession.create({
            data: {
              assessmentId: assessment.id,
              candidateId: cId,
              status: 'WAITING',
            },
          })
        )
      );
    }

    // 6. Create AssessmentQuestions with preserved ordering
    if (uniqueQuestionIds.length > 0) {
      await tx.assessmentQuestion.createMany({
        data: uniqueQuestionIds.map((qId, index) => ({
          assessmentId: assessment.id,
          questionId: qId,
          displayOrder: index + 1,
        })),
      });
    }

    return assessment;
  });

  return newAssessment;
};

const updateAssessment = async (
  id,
  { title, description, duration, startTime, endTime, candidateIds, questionIds },
  userId
) => {
  const assessmentId = parseInt(id, 10);
  const existing = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });

  if (!existing) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  if (existing.createdBy !== userId) {
    const error = new Error('Forbidden: You can only edit assessments you created');
    error.statusCode = 403;
    throw error;
  }

  if (existing.status === 'LIVE' || existing.status === 'COMPLETED') {
    const error = new Error(`Cannot modify assessment when status is ${existing.status}`);
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const durationMins = duration ? parseInt(duration, 10) : existing.duration;
    const start = startTime !== undefined ? (startTime ? new Date(startTime) : null) : existing.startTime;
    let end = endTime !== undefined ? (endTime ? new Date(endTime) : null) : existing.endTime;

    if (start && (!end || startTime)) {
      end = new Date(start.getTime() + durationMins * 60 * 1000);
    }

    const updatedAssessment = await tx.assessment.update({
      where: { id: assessmentId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        duration: durationMins,
        startTime: start,
        endTime: end,
      },
    });

    if (candidateIds && Array.isArray(candidateIds)) {
      const uniqueCandidates = [...new Set(candidateIds.map((id) => parseInt(id, 10)))];

      // Reset candidates
      await tx.assessmentCandidate.deleteMany({ where: { assessmentId } });
      await tx.assessmentCandidate.createMany({
        data: uniqueCandidates.map((cId) => ({
          assessmentId,
          candidateId: cId,
          status: 'INVITED',
        })),
      });

      // Ensure sessions exist
      for (const cId of uniqueCandidates) {
        await tx.assessmentSession.upsert({
          where: {
            assessmentId_candidateId: { assessmentId, candidateId: cId },
          },
          create: { assessmentId, candidateId: cId, status: 'WAITING' },
          update: {},
        });
      }
    }

    if (questionIds && Array.isArray(questionIds)) {
      const uniqueQuestions = [...new Set(questionIds.map((id) => parseInt(id, 10)))];
      await tx.assessmentQuestion.deleteMany({ where: { assessmentId } });
      await tx.assessmentQuestion.createMany({
        data: uniqueQuestions.map((qId, index) => ({
          assessmentId,
          questionId: qId,
          displayOrder: index + 1,
        })),
      });
    }

    return updatedAssessment;
  });

  return updated;
};

const deleteAssessment = async (id, userId) => {
  const assessmentId = parseInt(id, 10);
  const existing = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });

  if (!existing) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  if (existing.createdBy !== userId) {
    const error = new Error('Forbidden: You can only delete assessments you created');
    error.statusCode = 403;
    throw error;
  }

  await prisma.assessment.delete({
    where: { id: assessmentId },
  });

  return { message: 'Assessment deleted successfully' };
};

const checkAssessmentAccess = async (assessmentId, candidateId) => {
  const assId = parseInt(assessmentId, 10);
  const candId = parseInt(candidateId, 10);

  const assessment = await prisma.assessment.findUnique({
    where: { id: assId },
    include: {
      candidates: {
        where: { candidateId: candId },
      },
    },
  });

  if (!assessment) {
    return {
      canJoin: false,
      reason: 'Assessment not found',
    };
  }

  if (assessment.candidates.length === 0) {
    return {
      canJoin: false,
      reason: 'You are not assigned to this assessment',
    };
  }

  if (assessment.status === 'CANCELLED') {
    return {
      canJoin: false,
      reason: 'This assessment has been cancelled',
    };
  }

  const now = new Date();
  if (assessment.startTime && now < new Date(assessment.startTime)) {
    return {
      assessmentId: assId,
      status: 'SCHEDULED',
      canJoin: false,
      reason: 'Assessment has not started yet',
      startTime: assessment.startTime,
    };
  }

  if (assessment.endTime && now > new Date(assessment.endTime)) {
    return {
      assessmentId: assId,
      status: 'COMPLETED',
      canJoin: false,
      reason: 'Assessment time window has ended',
    };
  }

  return {
    assessmentId: assId,
    status: 'LIVE',
    canJoin: true,
    reason: 'Assessment is currently active and ready to join',
  };
};

module.exports = {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  checkAssessmentAccess,
};
