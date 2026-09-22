const express = require('express');
const { getInterviewerDashboard, getCandidateDashboard } = require('../controllers/dashboardController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/interviewer/stats', authenticate, requireRole('INTERVIEWER'), getInterviewerDashboard);
router.get('/candidate/assessments', authenticate, requireRole('CANDIDATE'), getCandidateDashboard);

module.exports = router;
