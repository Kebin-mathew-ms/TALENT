const prisma = require('../config/db');
const EVENTS = require('./socketEvents');

const registerAssessmentHandlers = (io, socket) => {
  // Join Assessment Room (Interviewer monitoring or Candidate status announcement)
  socket.on(EVENTS.ASSESSMENT_JOIN, async ({ assessmentId }) => {
    try {
      const assId = parseInt(assessmentId, 10);
      if (isNaN(assId)) return;

      const assessment = await prisma.assessment.findUnique({
        where: { id: assId },
        include: {
          candidates: true,
        },
      });

      if (!assessment) {
        return socket.emit('error', { message: 'Assessment not found' });
      }

      // Authorization Check
      if (socket.user.role === 'INTERVIEWER') {
        if (assessment.createdBy !== socket.user.id) {
          return socket.emit('error', { message: 'Unauthorized access to assessment room' });
        }
      } else if (socket.user.role === 'CANDIDATE') {
        const isAssigned = assessment.candidates.some((c) => c.candidateId === socket.user.id);
        if (!isAssigned) {
          return socket.emit('error', { message: 'You are not assigned to this assessment' });
        }
      }

      const roomName = `assessment_${assId}`;
      socket.join(roomName);

      // Notify room of candidate activity if candidate joined
      if (socket.user.role === 'CANDIDATE') {
        io.to(roomName).emit(EVENTS.CANDIDATE_JOINED, {
          candidateId: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
          status: 'CONNECTED',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error joining assessment room:', error);
    }
  });

  socket.on(EVENTS.ASSESSMENT_LEAVE, ({ assessmentId }) => {
    const assId = parseInt(assessmentId, 10);
    if (!isNaN(assId)) {
      const roomName = `assessment_${assId}`;
      socket.leave(roomName);

      if (socket.user.role === 'CANDIDATE') {
        io.to(roomName).emit(EVENTS.CANDIDATE_LEFT, {
          candidateId: socket.user.id,
          name: socket.user.name,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });
};

module.exports = registerAssessmentHandlers;
