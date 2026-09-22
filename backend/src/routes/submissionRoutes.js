const express = require('express');
const {
  createSubmission,
  getSubmissionsForSession,
  getSubmissionsForAssessment,
  retryAIEvaluation
} = require('../controllers/submissionController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, createSubmission);
router.get('/session/:sessionId', authenticate, getSubmissionsForSession);
router.get('/assessment/:assessmentId', authenticate, getSubmissionsForAssessment);
router.post('/evaluations/:submissionId/retry', authenticate, retryAIEvaluation);

module.exports = router;
