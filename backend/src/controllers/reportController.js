const { ReportService } = require('../services/reportService');
const fs = require('fs');

const getReports = async (req, res) => {
  try {
    const { page, limit, search, status, assessmentId, candidateId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await ReportService.getReports({
      page,
      limit,
      search,
      status,
      assessmentId,
      candidateId,
      userId,
      userRole
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await ReportService.getReportById(id, userId, userRole);
    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    const status = error.message.includes('Unauthorized') ? 403 : 404;
    return res.status(status).json({
      success: false,
      error: error.message
    });
  }
};

const generateReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const report = await ReportService.generateReport(sessionId);
    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const downloadReportPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await ReportService.getReportById(id, userId, userRole);

    if (!report.filePath || !fs.existsSync(report.filePath)) {
      // Regenerate PDF if missing
      await ReportService.generateReport(report.sessionId);
    }

    if (!fs.existsSync(report.filePath)) {
      return res.status(404).json({ error: 'PDF file not available' });
    }

    return res.download(report.filePath, report.fileName || `TalentFlow_Report_${id}.pdf`);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const bulkDownloadReports = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    await ReportService.createBulkReportsZip(assessmentId, res);
  } catch (error) {
    console.error('Bulk ZIP export error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getReports,
  getReportById,
  generateReport,
  downloadReportPDF,
  bulkDownloadReports
};
