const socketAuthMiddleware = require('./socketAuth');
const registerAssessmentHandlers = require('./assessmentSocket');
const registerSessionHandlers = require('./sessionSocket');

const initSockets = (io) => {
  // Apply JWT Auth Middleware to socket connections
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`🔌 Authenticated socket connected: ${socket.id} (User: ${socket.user.name}, Role: ${socket.user.role})`);

    // Register event modules
    registerAssessmentHandlers(io, socket);
    registerSessionHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });
};

module.exports = { initSockets };
