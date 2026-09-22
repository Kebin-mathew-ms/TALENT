const prisma = require('../config/db');
const assessmentService = require('../services/assessmentService');

const startAssessment = async (req, res, next) => {
  try {
    const assessmentId = parseInt(req.params.id, 10);
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (assessment.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this assessment' });
    }

    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'LIVE',
        startTime: assessment.startTime || new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Assessment is now LIVE',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const endAssessment = async (req, res, next) => {
  try {
    const assessmentId = parseInt(req.params.id, 10);
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (assessment.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this assessment' });
    }

    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
      },
    });

    // Also mark active sessions as COMPLETED
    await prisma.assessmentSession.updateMany({
      where: { assessmentId, status: 'ACTIVE' },
      data: { status: 'COMPLETED', endedAt: new Date() },
    });

    // Automatically generate reports for all candidate sessions of this assessment
    try {
      const { ReportService } = require('../services/reportService');
      const sessions = await prisma.assessmentSession.findMany({ where: { assessmentId } });
      for (const s of sessions) {
        try {
          await ReportService.generateReport(s.id);
        } catch (e) {
          console.warn(`Report generation for session ${s.id} failed:`, e.message);
        }
      }
    } catch (e) {
      console.warn('Auto report generation on endAssessment failed:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Assessment has ended',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const getOrCreateCandidateSession = async (req, res, next) => {
  try {
    const assessmentId = parseInt(req.params.id, 10);
    const candidateId = req.user.id;

    // Verify candidate is assigned
    const candidateAssigned = await prisma.assessmentCandidate.findUnique({
      where: {
        assessmentId_candidateId: { assessmentId, candidateId },
      },
      include: { assessment: true },
    });

    if (!candidateAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not assigned to this assessment',
      });
    }

    if (candidateAssigned.assessment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Assessment has been cancelled',
      });
    }

    // Atomic session retrieval / creation to prevent race conditions & duplicate sessions
    let session = await prisma.assessmentSession.findUnique({
      where: {
        assessmentId_candidateId: { assessmentId, candidateId },
      },
    });

    if (!session) {
      session = await prisma.assessmentSession.create({
        data: {
          assessmentId,
          candidateId,
          status: 'ACTIVE',
          startedAt: new Date(),
        },
      });
    } else if (session.status === 'WAITING') {
      session = await prisma.assessmentSession.update({
        where: { id: session.id },
        data: {
          status: 'ACTIVE',
          startedAt: session.startedAt || new Date(),
        },
      });
    }

    // Update candidate status
    await prisma.assessmentCandidate.update({
      where: { assessmentId_candidateId: { assessmentId, candidateId } },
      data: { status: 'IN_PROGRESS', joinedAt: candidateAssigned.joinedAt || new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Candidate session ready',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

const getSessionDetails = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        assessment: {
          include: {
            questions: {
              orderBy: { displayOrder: 'asc' },
              include: { question: true },
            },
            creator: { select: { id: true, name: true, email: true } },
          },
        },
        candidate: {
          select: { id: true, name: true, email: true, phone: true, skills: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Authorization
    if (req.user.role === 'INTERVIEWER') {
      if (session.assessment.createdBy !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    } else if (req.user.role === 'CANDIDATE') {
      if (session.candidateId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    // Server-authoritative timer values
    const now = new Date();
    const startTime = session.assessment.startTime ? new Date(session.assessment.startTime) : session.createdAt;
    const durationMins = session.assessment.duration || 60;
    const endTime = session.assessment.endTime || new Date(startTime.getTime() + durationMins * 60 * 1000);
    const remainingSeconds = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

    res.status(200).json({
      success: true,
      data: {
        session,
        timer: {
          serverTime: now.toISOString(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes: durationMins,
          remainingSeconds,
          isExpired: remainingSeconds <= 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const saveSessionState = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const { currentCode, currentQuestionId, language } = req.body;

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (req.user.role === 'CANDIDATE' && session.candidateId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (session.status === 'COMPLETED' || session.status === 'SUBMITTED') {
      return res.status(400).json({ success: false, message: 'Session is completed and read-only' });
    }

    const updated = await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        ...(currentCode !== undefined && { currentCode }),
        ...(currentQuestionId !== undefined && { currentQuestionId: parseInt(currentQuestionId, 10) }),
        ...(language && { language }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Session state saved successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const completeSession = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const { finalCode } = req.body;

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (req.user.role === 'CANDIDATE' && session.candidateId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updated = await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'SUBMITTED',
        endedAt: new Date(),
        ...(finalCode && { currentCode: finalCode }),
      },
    });

    // Update candidate status
    await prisma.assessmentCandidate.update({
      where: {
        assessmentId_candidateId: {
          assessmentId: session.assessmentId,
          candidateId: session.candidateId,
        },
      },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Auto-generate report upon candidate submission
    try {
      const { ReportService } = require('../services/reportService');
      await ReportService.generateReport(sessionId);
    } catch (e) {
      console.warn(`Report auto-generation for candidate submission ${sessionId} failed:`, e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully. Your submission will be evaluated in subsequent phases.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startAssessment,
  endAssessment,
  getOrCreateCandidateSession,
  getSessionDetails,
  saveSessionState,
  completeSession,
};
