const questionService = require('../services/questionService');

const listQuestions = async (req, res, next) => {
  try {
    const { page, limit, search, category, difficulty, language } = req.query;
    const result = await questionService.getQuestions({
      page,
      limit,
      search,
      category,
      difficulty,
      language,
    });

    res.status(200).json({
      success: true,
      message: 'Questions retrieved successfully',
      data: result.questions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await questionService.getQuestionById(id);
    res.status(200).json({
      success: true,
      message: 'Question retrieved successfully',
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, language, expectedOutput, timeLimit } = req.body;
    const question = await questionService.createQuestion(
      { title, description, category, difficulty, language, expectedOutput, timeLimit },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, difficulty, language, expectedOutput, timeLimit } = req.body;
    const question = await questionService.updateQuestion(
      id,
      { title, description, category, difficulty, language, expectedOutput, timeLimit },
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await questionService.deleteQuestion(id, req.user.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
