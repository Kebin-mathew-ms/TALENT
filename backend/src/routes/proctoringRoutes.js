const express = require('express');
const {
  recordIncident,
  getIncidentsForSession,
  getIncidentsForAssessment
} = require('../controllers/proctoringController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/incidents', authenticate, recordIncident);
router.get('/incidents/session/:sessionId', authenticate, getIncidentsForSession);
router.get('/incidents/assessment/:assessmentId', authenticate, getIncidentsForAssessment);

module.exports = router;
