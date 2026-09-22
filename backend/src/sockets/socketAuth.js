const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/db');

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization &&
        socket.handshake.headers.authorization.split(' ')[1]);

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return next(new Error('Invalid token payload'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return next(new Error('User account not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('🔌 Socket authentication failed:', error.message);
    next(new Error('Authentication failed'));
  }
};

module.exports = socketAuthMiddleware;
