const prisma = require('../config/db');
const { AIEvaluationService } = require('./aiEvaluationService');

class SubmissionService {
  /**
   * Create code submission record and initiate background AI evaluation
   */
  static async createSubmission({ sessionId, candidateId, questionId, code, language, executionResult }) {
    if (!sessionId || !code) {
      throw new Error('sessionId and code are required for submission');
    }

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { assessment: true, candidate: true }
    });

    if (!session) {
      throw new Error('Assessment session not found');
    }

    const targetCandidateId = candidateId || session.candidateId;
    const targetQuestionId = questionId || session.currentQuestionId;

    if (!targetQuestionId) {
      throw new Error('questionId is required for submission');
    }

    const submission = await prisma.submission.create({
      data: {
        sessionId,
        assessmentId: session.assessmentId,
        candidateId: targetCandidateId,
        questionId: targetQuestionId,
        code,
        language: language || session.language || 'javascript',
        executionTime: executionResult?.executionTimeMs ? parseFloat(executionResult.executionTimeMs) : null,
        status: 'SUBMITTED'
      },
      include: {
        question: { select: { id: true, title: true } },
        aiEvaluation: true
      }
    });

    // Also store CodeExecution record attached to submission
    if (executionResult) {
      await prisma.codeExecution.create({
        data: {
          submissionId: submission.id,
          sessionId,
          questionId: targetQuestionId,
          candidateId: targetCandidateId,
          language: submission.language,
          status: executionResult.status || (executionResult.exitCode === 0 ? 'SUCCESS' : 'ERROR'),
          output: executionResult.stdout || null,
          error: executionResult.stderr || null,
          executionTime: executionResult.executionTimeMs ? parseFloat(executionResult.executionTimeMs) : null
        }
      }).catch((err) => console.warn('Could not store CodeExecution details:', err.message));
    }

    const io = global.io;
    if (io) {
      const payload = {
        submissionId: submission.id,
        sessionId,
        candidateId: targetCandidateId,
        questionTitle: submission.question?.title || 'Code Solution',
        language: submission.language,
        submittedAt: submission.createdAt,
        status: 'SUBMITTED'
      };

      io.to(`session_${sessionId}`).emit('submission:created', payload);
      if (session.assessmentId) {
        io.to(`assessment_${session.assessmentId}`).emit('submission:created', payload);
      }
    }

    setImmediate(() => {
      AIEvaluationService.evaluateSubmission(submission.id).catch((err) => {
        console.error(`Background AI evaluation failed for ${submission.id}:`, err);
      });
    });

    return submission;
  }

  static async getSubmissionsForSession(sessionId) {
    return prisma.submission.findMany({
      where: { sessionId: parseInt(sessionId, 10) },
      include: {
        question: { select: { id: true, title: true } },
        aiEvaluation: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getSubmissionsForAssessment(assessmentId) {
    return prisma.submission.findMany({
      where: {
        session: { assessmentId: parseInt(assessmentId, 10) }
      },
      include: {
        question: { select: { id: true, title: true } },
        aiEvaluation: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async retryEvaluation(submissionId) {
    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(submissionId, 10) }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    return AIEvaluationService.evaluateSubmission(submission.id);
  }
}

module.exports = { SubmissionService };
