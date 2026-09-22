const { SubmissionService } = require('../services/submissionService');

const createSubmission = async (req, res) => {
  try {
    const { sessionId, questionId, code, language, executionResult } = req.body;
    const candidateId = req.user?.role === 'CANDIDATE' ? req.user.id : req.body.candidateId;

    if (!sessionId || !code) {
      return res.status(400).json({ error: 'sessionId and code are required' });
    }

    const submission = await SubmissionService.createSubmission({
      sessionId,
      candidateId,
      questionId,
      code,
      language: language || 'javascript',
      executionResult
    });

    return res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit code'
    });
  }
};

const getSubmissionsForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const submissions = await SubmissionService.getSubmissionsForSession(sessionId);
    return res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSubmissionsForAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const submissions = await SubmissionService.getSubmissionsForAssessment(assessmentId);
    return res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const retryAIEvaluation = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const result = await SubmissionService.retryEvaluation(submissionId);
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createSubmission,
  getSubmissionsForSession,
  getSubmissionsForAssessment,
  retryAIEvaluation
};
