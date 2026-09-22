const { FeedbackService } = require('../services/feedbackService');

const saveFeedback = async (req, res) => {
  try {
    const { sessionId, assessmentId, candidateId, technicalKnowledge, problemSolving, communication, codeQuality, overallPerformance, comments } = req.body;
    const interviewerId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const feedback = await FeedbackService.saveFeedback({
      sessionId,
      assessmentId,
      candidateId,
      interviewerId,
      technicalKnowledge,
      problemSolving,
      communication,
      codeQuality,
      overallPerformance,
      comments
    });

    return res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getFeedback = async (req, res) => {
  try {
    const { candidateId, assessmentId } = req.params;
    const feedback = await FeedbackService.getFeedback(candidateId, assessmentId);
    return res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  saveFeedback,
  getFeedback
};
