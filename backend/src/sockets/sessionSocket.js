const prisma = require('../config/db');
const EVENTS = require('./socketEvents');

const registerSessionHandlers = (io, socket) => {
  // Join Isolated Session Room
  socket.on(EVENTS.SESSION_JOIN, async ({ sessionId }) => {
    try {
      const sId = parseInt(sessionId, 10);
      if (isNaN(sId)) return;

      const session = await prisma.assessmentSession.findUnique({
        where: { id: sId },
        include: {
          assessment: { select: { createdBy: true, id: true, title: true } },
          candidate: { select: { id: true, name: true, email: true } },
        },
      });

      if (!session) {
        return socket.emit('error', { message: 'Session not found' });
      }

      // Authorization Guard
      if (socket.user.role === 'INTERVIEWER') {
        if (session.assessment.createdBy !== socket.user.id) {
          return socket.emit('error', { message: 'Unauthorized access to candidate session' });
        }
      } else if (socket.user.role === 'CANDIDATE') {
        if (session.candidateId !== socket.user.id) {
          return socket.emit('error', { message: 'Forbidden: You cannot access another candidate session' });
        }
      }

      const roomName = `session_${sId}`;
      socket.join(roomName);
      console.log(`🚪 Socket ${socket.user.name} (${socket.user.role}) joined ${roomName}`);

      // Send latest stored session state to joining client
      socket.emit(EVENTS.SESSION_STATE, {
        sessionId: session.id,
        assessmentId: session.assessmentId,
        candidateId: session.candidateId,
        status: session.status,
        currentQuestionId: session.currentQuestionId,
        currentCode: session.currentCode || '',
        language: session.language || 'javascript',
      });

      // Announce WebRTC peer readiness
      socket.to(roomName).emit(EVENTS.WEBRTC_PEER_READY, {
        peerId: socket.id,
        user: socket.user,
        sessionId: sId,
      });
    } catch (error) {
      console.error('Error joining session room:', error);
    }
  });

  // Code Synchronization (Isolated strictly to session_<sessionId>)
  socket.on(EVENTS.CODE_CHANGED, ({ sessionId, code, language, questionId }) => {
    const sId = parseInt(sessionId, 10);
    if (isNaN(sId)) return;

    const roomName = `session_${sId}`;
    console.log(`📡 Relaying code-changed in ${roomName} from ${socket.user.name} (${socket.id})`);
    // Broadcast ONLY to observers in session_<sessionId>
    socket.to(roomName).emit(EVENTS.CODE_CHANGED, {
      sessionId: sId,
      candidateId: socket.user.id,
      code,
      language,
      questionId,
      timestamp: new Date().toISOString(),
    });
  });

  // Question Navigation Synchronizer
  socket.on(EVENTS.QUESTION_CHANGED, async ({ sessionId, questionId }) => {
    const sId = parseInt(sessionId, 10);
    const qId = parseInt(questionId, 10);
    if (isNaN(sId) || isNaN(qId)) return;

    const roomName = `session_${sId}`;
    socket.to(roomName).emit(EVENTS.QUESTION_CHANGED, {
      sessionId: sId,
      candidateId: socket.user.id,
      questionId: qId,
    });

    // Update database currentQuestionId
    try {
      await prisma.assessmentSession.update({
        where: { id: sId },
        data: { currentQuestionId: qId },
      });
    } catch (e) {
      console.error('Failed to update session currentQuestionId:', e);
    }
  });

  // Candidate Typing Indicator
  socket.on(EVENTS.CANDIDATE_TYPING, ({ sessionId, isTyping }) => {
    const sId = parseInt(sessionId, 10);
    if (!isNaN(sId)) {
      socket.to(`session_${sId}`).emit(EVENTS.CANDIDATE_TYPING, {
        candidateId: socket.user.id,
        isTyping,
      });
    }
  });

  // WebRTC Signaling Handlers (Relayed through session_<sessionId>)
  socket.on(EVENTS.WEBRTC_OFFER, ({ sessionId, offer }) => {
    const sId = parseInt(sessionId, 10);
    if (!isNaN(sId)) {
      socket.to(`session_${sId}`).emit(EVENTS.WEBRTC_OFFER, {
        senderSocketId: socket.id,
        offer,
        sessionId: sId,
      });
    }
  });

  socket.on(EVENTS.WEBRTC_ANSWER, ({ sessionId, answer }) => {
    const sId = parseInt(sessionId, 10);
    if (!isNaN(sId)) {
      socket.to(`session_${sId}`).emit(EVENTS.WEBRTC_ANSWER, {
        senderSocketId: socket.id,
        answer,
        sessionId: sId,
      });
    }
  });

  socket.on(EVENTS.WEBRTC_ICE_CANDIDATE, ({ sessionId, candidate }) => {
    const sId = parseInt(sessionId, 10);
    if (!isNaN(sId)) {
      socket.to(`session_${sId}`).emit(EVENTS.WEBRTC_ICE_CANDIDATE, {
        senderSocketId: socket.id,
        candidate,
        sessionId: sId,
      });
    }
  });

  // Handle Disconnect
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room.startsWith('session_')) {
        const sId = room.replace('session_', '');
        socket.to(room).emit(EVENTS.WEBRTC_PEER_LEFT, {
          peerId: socket.id,
          sessionId: sId,
        });
      }
    }
  });
};

module.exports = registerSessionHandlers;
