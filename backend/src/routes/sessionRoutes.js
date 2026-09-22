const express = require('express');
const {
  startAssessment,
  endAssessment,
  getOrCreateCandidateSession,
  getSessionDetails,
  saveSessionState,
  completeSession,
} = require('../controllers/sessionController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Assessment level controls (Interviewer)
router.post('/assessments/:id/start', authenticate, requireRole('INTERVIEWER'), startAssessment);
router.post('/assessments/:id/end', authenticate, requireRole('INTERVIEWER'), endAssessment);

// Candidate session creation / retrieval (Candidate)
router.post('/assessments/:id/session', authenticate, requireRole('CANDIDATE'), getOrCreateCandidateSession);

// Session state & submission routes (Authenticated)
router.get('/sessions/:id', authenticate, getSessionDetails);
router.patch('/sessions/:id/state', authenticate, saveSessionState);
router.post('/sessions/:id/complete', authenticate, completeSession);

module.exports = router;
