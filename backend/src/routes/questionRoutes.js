const express = require('express');
const {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Question bank management routes are protected for Interviewers only
router.use(authenticate, requireRole('INTERVIEWER'));

router.get('/', listQuestions);
router.get('/:id', getQuestion);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
