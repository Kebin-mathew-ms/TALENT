import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket && this.socket.connected) return this.socket;

    const socketUrl = window.location.origin;

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Assessment Level Rooms
  joinAssessmentRoom(assessmentId) {
    if (this.socket) {
      this.socket.emit('assessment:join', { assessmentId });
    }
  }

  leaveAssessmentRoom(assessmentId) {
    if (this.socket) {
      this.socket.emit('assessment:leave', { assessmentId });
    }
  }

  // Isolated Candidate Session Rooms
  joinSessionRoom(sessionId) {
    if (this.socket) {
      this.socket.emit('session:join', { sessionId });
    }
  }

  leaveSessionRoom(sessionId) {
    if (this.socket) {
      this.socket.emit('session:leave', { sessionId });
    }
  }

  // Code Synchronization Emitters
  emitCodeChanged({ sessionId, code, language, questionId }) {
    if (this.socket) {
      this.socket.emit('session:code-changed', { sessionId, code, language, questionId });
    }
  }

  emitQuestionChanged({ sessionId, questionId }) {
    if (this.socket) {
      this.socket.emit('session:question-changed', { sessionId, questionId });
    }
  }

  emitTyping({ sessionId, isTyping }) {
    if (this.socket) {
      this.socket.emit('candidate:typing', { sessionId, isTyping });
    }
  }

  // WebRTC Signaling Emitters
  emitWebRTCOffer({ sessionId, offer }) {
    if (this.socket) {
      this.socket.emit('webrtc:offer', { sessionId, offer });
    }
  }

  emitWebRTCAnswer({ sessionId, answer }) {
    if (this.socket) {
      this.socket.emit('webrtc:answer', { sessionId, answer });
    }
  }

  emitWebRTCIceCandidate({ sessionId, candidate }) {
    if (this.socket) {
      this.socket.emit('webrtc:ice-candidate', { sessionId, candidate });
    }
  }

  // Event Listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
