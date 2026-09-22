const express = require('express');
const {
  listAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  checkAccess,
} = require('../controllers/assessmentController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Candidate access validation route (Candidate only)
router.get('/:id/access', authenticate, requireRole('CANDIDATE'), checkAccess);

// Shared/General Assessment details route (Interviewer or Candidate assigned to it)
router.get('/:id', authenticate, getAssessment);

// Interviewer-only management routes
router.get('/', authenticate, requireRole('INTERVIEWER'), listAssessments);
router.post('/', authenticate, requireRole('INTERVIEWER'), createAssessment);
router.put('/:id', authenticate, requireRole('INTERVIEWER'), updateAssessment);
router.delete('/:id', authenticate, requireRole('INTERVIEWER'), deleteAssessment);

module.exports = router;
