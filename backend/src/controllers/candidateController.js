const candidateService = require('../services/candidateService');

const listCandidates = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await candidateService.getCandidates({ page, limit, search });
    res.status(200).json({
      success: true,
      message: 'Candidates retrieved successfully',
      data: result.candidates,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await candidateService.getCandidateById(id);
    res.status(200).json({
      success: true,
      message: 'Candidate details retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const createCandidate = async (req, res, next) => {
  try {
    const { name, email, password, phone, education, skills } = req.body;
    const candidate = await candidateService.createCandidate({
      name,
      email,
      password,
      phone,
      education,
      skills,
    });

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

const updateCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, education, skills } = req.body;
    const candidate = await candidateService.updateCandidate(id, {
      name,
      email,
      phone,
      education,
      skills,
    });

    res.status(200).json({
      success: true,
      message: 'Candidate updated successfully',
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await candidateService.deleteCandidate(id);
    res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
};
