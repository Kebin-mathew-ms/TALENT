const prisma = require('../config/db');
const { hashPassword } = require('../utils/password');

const getCandidates = async ({ page = 1, limit = 10, search = '' }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const where = {
    role: 'CANDIDATE',
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { skills: { contains: search } },
      ],
    }),
  };

  const [total, candidates] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        education: true,
        skills: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            candidateAssessment: true,
          },
        },
      },
    }),
  ]);

  return {
    candidates,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

const getCandidateById = async (id) => {
  const candidateId = parseInt(id, 10);
  const candidate = await prisma.user.findFirst({
    where: { id: candidateId, role: 'CANDIDATE' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      education: true,
      skills: true,
      createdAt: true,
      updatedAt: true,
      candidateAssessment: {
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
              duration: true,
              startTime: true,
              endTime: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!candidate) {
    const error = new Error('Candidate not found');
    error.statusCode = 404;
    throw error;
  }

  // Map assessment history
  const history = candidate.candidateAssessment.map((ca) => ({
    assessmentId: ca.assessment.id,
    title: ca.assessment.title,
    duration: ca.assessment.duration,
    status: ca.status,
    assessmentStatus: ca.assessment.status,
    joinedAt: ca.joinedAt,
    completedAt: ca.completedAt,
    score: null, // AI Evaluation functionality belongs to later phases
    reportAvailable: false,
  }));

  const { candidateAssessment: _, ...safeCandidate } = candidate;

  return {
    candidate: safeCandidate,
    history,
  };
};

const createCandidate = async ({ name, email, password, phone, education, skills }) => {
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const candidate = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'CANDIDATE',
      phone: phone || null,
      education: education || null,
      skills: skills || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      education: true,
      skills: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return candidate;
};

const updateCandidate = async (id, { name, email, phone, education, skills }) => {
  const candidateId = parseInt(id, 10);
  const existing = await prisma.user.findFirst({
    where: { id: candidateId, role: 'CANDIDATE' },
  });

  if (!existing) {
    const error = new Error('Candidate not found');
    error.statusCode = 404;
    throw error;
  }

  if (email && email.toLowerCase().trim() !== existing.email) {
    const emailConflict = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (emailConflict) {
      const error = new Error('Another user account is already using this email');
      error.statusCode = 400;
      throw error;
    }
  }

  const updatedCandidate = await prisma.user.update({
    where: { id: candidateId },
    data: {
      ...(name && { name: name.trim() }),
      ...(email && { email: email.toLowerCase().trim() }),
      ...(phone !== undefined && { phone }),
      ...(education !== undefined && { education }),
      ...(skills !== undefined && { skills }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      education: true,
      skills: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedCandidate;
};

const deleteCandidate = async (id) => {
  const candidateId = parseInt(id, 10);
  const existing = await prisma.user.findFirst({
    where: { id: candidateId, role: 'CANDIDATE' },
  });

  if (!existing) {
    const error = new Error('Candidate not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.user.delete({
    where: { id: candidateId },
  });

  return { message: 'Candidate deleted successfully' };
};

module.exports = {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
};
