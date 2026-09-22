const prisma = require('../config/db');

class FeedbackService {
  /**
   * Upsert interviewer qualitative feedback
   */
  static async saveFeedback({ sessionId, assessmentId, candidateId, interviewerId, technicalKnowledge, problemSolving, communication, codeQuality, overallPerformance, comments }) {
    if (!sessionId) {
      throw new Error('sessionId is required for feedback');
    }

    const sId = parseInt(sessionId, 10);

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sId }
    });

    if (!session) {
      throw new Error('Assessment session not found');
    }

    const tech = Math.min(100, Math.max(0, parseFloat(technicalKnowledge || 0)));
    const prob = Math.min(100, Math.max(0, parseFloat(problemSolving || 0)));
    const comm = Math.min(100, Math.max(0, parseFloat(communication || 0)));
    const qual = Math.min(100, Math.max(0, parseFloat(codeQuality || 0)));
    const perf = Math.min(100, Math.max(0, parseFloat(overallPerformance || Math.round((tech + prob + comm + qual) / 4))));

    const feedback = await prisma.feedback.upsert({
      where: { sessionId: sId },
      update: {
        technicalKnowledge: tech,
        problemSolving: prob,
        communication: comm,
        codeQuality: qual,
        overallPerformance: perf,
        comments: comments || null,
        interviewerId
      },
      create: {
        sessionId: sId,
        assessmentId: assessmentId ? parseInt(assessmentId, 10) : session.assessmentId,
        candidateId: candidateId ? parseInt(candidateId, 10) : session.candidateId,
        interviewerId,
        technicalKnowledge: tech,
        problemSolving: prob,
        communication: comm,
        codeQuality: qual,
        overallPerformance: perf,
        comments: comments || null
      }
    });

    // Trigger report regeneration with updated feedback
    const { ReportService } = require('./reportService');
    setImmediate(() => {
      ReportService.generateReport(sId).catch((err) => {
        console.warn('Could not regenerate report after feedback update:', err.message);
      });
    });

    return feedback;
  }

  /**
   * Get feedback for candidate & assessment
   */
  static async getFeedback(candidateId, assessmentId) {
    const cId = parseInt(candidateId, 10);
    const aId = parseInt(assessmentId, 10);

    return prisma.feedback.findFirst({
      where: {
        candidateId: cId,
        assessmentId: aId
      }
    });
  }
}

module.exports = { FeedbackService };
