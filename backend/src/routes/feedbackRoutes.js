const express = require('express');
const { saveFeedback, getFeedback } = require('../controllers/feedbackController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, requireRole('INTERVIEWER'), saveFeedback);
router.put('/:id', authenticate, requireRole('INTERVIEWER'), saveFeedback);
router.get('/:candidateId/:assessmentId', authenticate, getFeedback);

module.exports = router;
