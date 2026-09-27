const prisma = require('../config/db');
const EVENTS = require('./socketEvents');

const chatStore = {};

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

  // Live Meeting Chat Handler (Broadcast to all in assessment room)
  socket.on(EVENTS.CHAT_MESSAGE, ({ assessmentId, text }) => {
    const assId = parseInt(assessmentId, 10);
    if (isNaN(assId) || !text || !text.trim()) return;

    const roomName = `assessment_${assId}`;
    if (!chatStore[assId]) chatStore[assId] = [];

    const msgPayload = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      assessmentId: assId,
      text: text.trim(),
      sender: {
        id: socket.user.id,
        name: socket.user.name,
        role: socket.user.role,
        email: socket.user.email,
      },
      timestamp: new Date().toISOString(),
    };

    chatStore[assId].push(msgPayload);
    if (chatStore[assId].length > 100) chatStore[assId].shift(); // Keep latest 100

    io.to(roomName).emit(EVENTS.CHAT_MESSAGE, msgPayload);
  });

  // Fetch Chat History
  socket.on(EVENTS.CHAT_HISTORY, ({ assessmentId }) => {
    const assId = parseInt(assessmentId, 10);
    if (!isNaN(assId)) {
      socket.emit(EVENTS.CHAT_HISTORY, {
        assessmentId: assId,
        messages: chatStore[assId] || [],
      });
    }
  });

  // Admin Video/Audio Broadcast Toggle Signal & WebRTC Signaling
  socket.on(EVENTS.MEETING_ADMIN_STREAM, ({ assessmentId, isBroadcasting }) => {
    const assId = parseInt(assessmentId, 10);
    if (!isNaN(assId) && socket.user.role === 'INTERVIEWER') {
      const roomName = `assessment_${assId}`;
      io.to(roomName).emit(EVENTS.MEETING_ADMIN_STREAM, {
        assessmentId: assId,
        adminId: socket.user.id,
        adminName: socket.user.name,
        isBroadcasting,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on('admin:offer', ({ assessmentId, offer }) => {
    const assId = parseInt(assessmentId, 10);
    if (!isNaN(assId)) {
      socket.to(`assessment_${assId}`).emit('admin:offer', { offer, senderSocketId: socket.id });
    }
  });

  socket.on('admin:answer', ({ assessmentId, answer, targetSocketId }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit('admin:answer', { answer, senderSocketId: socket.id });
    } else {
      const assId = parseInt(assessmentId, 10);
      if (!isNaN(assId)) socket.to(`assessment_${assId}`).emit('admin:answer', { answer, senderSocketId: socket.id });
    }
  });

  socket.on('admin:ice-candidate', ({ assessmentId, candidate, targetSocketId }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit('admin:ice-candidate', { candidate, senderSocketId: socket.id });
    } else {
      const assId = parseInt(assessmentId, 10);
      if (!isNaN(assId)) socket.to(`assessment_${assId}`).emit('admin:ice-candidate', { candidate, senderSocketId: socket.id });
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
