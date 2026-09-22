const assessmentService = require('../services/assessmentService');

const listAssessments = async (req, res, next) => {
  try {
    const { page, limit, search, status } = req.query;
    const result = await assessmentService.getAssessments({
      page,
      limit,
      search,
      status,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: 'Assessments retrieved successfully',
      data: result.assessments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assessment = await assessmentService.getAssessmentById(
      id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Assessment details retrieved successfully',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

const createAssessment = async (req, res, next) => {
  try {
    const { title, description, duration, startTime, endTime, candidateIds, questionIds } = req.body;
    const assessment = await assessmentService.createAssessment(
      { title, description, duration, startTime, endTime, candidateIds, questionIds },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

const updateAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, duration, startTime, endTime, candidateIds, questionIds } = req.body;
    const assessment = await assessmentService.updateAssessment(
      id,
      { title, description, duration, startTime, endTime, candidateIds, questionIds },
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await assessmentService.deleteAssessment(id, req.user.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const checkAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accessInfo = await assessmentService.checkAssessmentAccess(id, req.user.id);
    res.status(200).json({
      success: true,
      data: accessInfo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  checkAccess,
};
