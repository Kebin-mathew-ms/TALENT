const dashboardService = require('../services/dashboardService');

const getInterviewerDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getInterviewerStats(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Interviewer dashboard metrics loaded',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCandidateDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getCandidateAssessments(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Candidate assessments loaded',
      data: {
        assessments: data,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInterviewerDashboard,
  getCandidateDashboard,
};
