const prisma = require('../config/db');

const getInterviewerStats = async (interviewerId) => {
  const [
    totalAssessments,
    scheduledAssessments,
    liveAssessments,
    completedAssessments,
    totalCandidates,
    recentAssessments,
  ] = await Promise.all([
    prisma.assessment.count({ where: { createdBy: interviewerId } }),
    prisma.assessment.count({ where: { createdBy: interviewerId, status: 'SCHEDULED' } }),
    prisma.assessment.count({ where: { createdBy: interviewerId, status: 'LIVE' } }),
    prisma.assessment.count({ where: { createdBy: interviewerId, status: 'COMPLETED' } }),
    prisma.user.count({ where: { role: 'CANDIDATE' } }),
    prisma.assessment.findMany({
      where: { createdBy: interviewerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
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

  return {
    metrics: {
      totalAssessments,
      scheduledAssessments,
      liveAssessments,
      completedAssessments,
      totalCandidates,
    },
    recentAssessments,
  };
};

const getCandidateAssessments = async (candidateId) => {
  const candidateAssessments = await prisma.assessmentCandidate.findMany({
    where: { candidateId },
    include: {
      assessment: {
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Check if session exists for each assessment
  const sessions = await prisma.assessmentSession.findMany({
    where: { candidateId },
  });

  const sessionMap = new Map(sessions.map((s) => [s.assessmentId, s]));

  const formattedAssessments = candidateAssessments.map((ca) => ({
    id: ca.assessment.id,
    title: ca.assessment.title,
    description: ca.assessment.description,
    duration: ca.assessment.duration,
    startTime: ca.assessment.startTime,
    endTime: ca.assessment.endTime,
    assessmentStatus: ca.assessment.status,
    candidateStatus: ca.status,
    questionCount: ca.assessment._count.questions,
    interviewer: ca.assessment.creator.name,
    sessionId: sessionMap.get(ca.assessment.id)?.id || null,
    sessionStatus: sessionMap.get(ca.assessment.id)?.status || 'WAITING',
    joinedAt: ca.joinedAt,
    completedAt: ca.completedAt,
  }));

  return formattedAssessments;
};

module.exports = {
  getInterviewerStats,
  getCandidateAssessments,
};
