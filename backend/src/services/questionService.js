const prisma = require('../config/db');

const getQuestions = async ({
  page = 1,
  limit = 10,
  search = '',
  category,
  difficulty,
  language,
}) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const where = {
    isDeleted: false,
    ...(category && { category }),
    ...(difficulty && { difficulty }),
    ...(language && { language }),
    ...(search && {
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
      ],
    }),
  };

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
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
            assessmentQuestions: true,
          },
        },
      },
    }),
  ]);

  return {
    questions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

const getQuestionById = async (id) => {
  const questionId = parseInt(id, 10);
  const question = await prisma.question.findFirst({
    where: { id: questionId, isDeleted: false },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!question) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    throw error;
  }

  return question;
};

const createQuestion = async (
  { title, description, category, difficulty, language, expectedOutput, timeLimit },
  createdBy
) => {
  if (!title || !description) {
    const error = new Error('Question title and description are required');
    error.statusCode = 400;
    throw error;
  }

  const question = await prisma.question.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      category: category || 'JAVASCRIPT',
      difficulty: difficulty || 'MEDIUM',
      language: language || 'javascript',
      expectedOutput: expectedOutput || null,
      timeLimit: parseInt(timeLimit, 10) || 30,
      createdBy,
    },
  });

  return question;
};

const updateQuestion = async (
  id,
  { title, description, category, difficulty, language, expectedOutput, timeLimit },
  userId
) => {
  const questionId = parseInt(id, 10);
  const existing = await prisma.question.findFirst({
    where: { id: questionId, isDeleted: false },
  });

  if (!existing) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...(title && { title: title.trim() }),
      ...(description && { description: description.trim() }),
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(language && { language }),
      ...(expectedOutput !== undefined && { expectedOutput }),
      ...(timeLimit !== undefined && { timeLimit: parseInt(timeLimit, 10) || 30 }),
    },
  });

  return updated;
};

const deleteQuestion = async (id, userId) => {
  const questionId = parseInt(id, 10);
  const existing = await prisma.question.findFirst({
    where: { id: questionId, isDeleted: false },
    include: {
      _count: {
        select: {
          assessmentQuestions: true,
        },
      },
    },
  });

  if (!existing) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    throw error;
  }

  // If referenced in assessments, soft delete to preserve historical integrity
  if (existing._count.assessmentQuestions > 0) {
    await prisma.question.update({
      where: { id: questionId },
      data: { isDeleted: true },
    });
    return { message: 'Question soft-deleted because it is used by existing assessments' };
  } else {
    await prisma.question.delete({
      where: { id: questionId },
    });
    return { message: 'Question deleted successfully' };
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
