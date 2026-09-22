const prisma = require('../config/db');

class ProctoringService {
  /**
   * Record a proctoring incident and calculate warning count
   */
  static async recordIncident({ sessionId, candidateId, eventType, details }) {
    if (!sessionId || !eventType) {
      throw new Error('sessionId and eventType are required for proctoring incident');
    }

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { candidate: true, assessment: true }
    });

    if (!session) {
      throw new Error('Assessment session not found');
    }

    const targetCandidateId = candidateId || session.candidateId;

    const previousCount = await prisma.proctoringIncident.count({
      where: { sessionId }
    });

    const warningNumber = previousCount + 1;
    const severity = warningNumber >= 3 ? 'HIGH' : (warningNumber === 2 ? 'MEDIUM' : 'LOW');

    const incident = await prisma.proctoringIncident.create({
      data: {
        sessionId,
        assessmentId: session.assessmentId,
        candidateId: targetCandidateId,
        eventType,
        severity,
        warningNumber,
        description: typeof details === 'object' ? JSON.stringify(details) : (details || '')
      }
    });

    const io = global.io;
    if (io) {
      const alertPayload = {
        incidentId: incident.id,
        sessionId,
        candidateId: targetCandidateId,
        candidateName: session.candidate?.name || 'Candidate',
        candidateEmail: session.candidate?.email || '',
        eventType,
        severity,
        warningNumber,
        description: incident.description,
        timestamp: incident.timestamp
      };

      io.to(`session_${sessionId}`).emit('proctoring:alert', alertPayload);
      if (session.assessmentId) {
        io.to(`assessment_${session.assessmentId}`).emit('proctoring:alert', alertPayload);
      }
    }

    return incident;
  }

  static async getIncidentsForSession(sessionId) {
    return prisma.proctoringIncident.findMany({
      where: { sessionId: parseInt(sessionId, 10) },
      orderBy: { timestamp: 'desc' }
    });
  }

  static async getIncidentsForAssessment(assessmentId) {
    return prisma.proctoringIncident.findMany({
      where: { assessmentId: parseInt(assessmentId, 10) },
      orderBy: { timestamp: 'desc' }
    });
  }
}

module.exports = { ProctoringService };
