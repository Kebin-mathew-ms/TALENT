const express = require('express');
const {
  listCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} = require('../controllers/candidateController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// All candidate management routes are protected for Interviewers only
router.use(authenticate, requireRole('INTERVIEWER'));

router.get('/', listCandidates);
router.get('/:id', getCandidate);
router.post('/', createCandidate);
router.put('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

module.exports = router;
