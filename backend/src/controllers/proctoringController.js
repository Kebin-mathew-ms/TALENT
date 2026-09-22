const { ProctoringService } = require('../services/proctoringService');

const recordIncident = async (req, res) => {
  try {
    const { sessionId, eventType, details } = req.body;
    const candidateId = req.user?.role === 'CANDIDATE' ? req.user.id : req.body.candidateId;

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'sessionId and eventType are required' });
    }

    const incident = await ProctoringService.recordIncident({
      sessionId,
      candidateId,
      eventType,
      details
    });

    return res.status(201).json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Proctoring incident error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to record proctoring incident'
    });
  }
};

const getIncidentsForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const incidents = await ProctoringService.getIncidentsForSession(sessionId);
    return res.json({
      success: true,
      data: incidents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getIncidentsForAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const incidents = await ProctoringService.getIncidentsForAssessment(assessmentId);
    return res.json({
      success: true,
      data: incidents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  recordIncident,
  getIncidentsForSession,
  getIncidentsForAssessment
};
