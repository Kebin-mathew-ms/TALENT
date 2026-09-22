const express = require('express');
const {
  getReports,
  getReportById,
  generateReport,
  downloadReportPDF,
  bulkDownloadReports
} = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getReports);
router.get('/assessment/:assessmentId/download-all', authenticate, requireRole('INTERVIEWER'), bulkDownloadReports);
router.post('/generate/:sessionId', authenticate, requireRole('INTERVIEWER'), generateReport);
router.get('/:id', authenticate, getReportById);
router.get('/:id/pdf', authenticate, downloadReportPDF);

module.exports = router;
