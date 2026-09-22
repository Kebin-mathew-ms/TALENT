const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

const registerCandidate = async ({ name, email, password, phone, education, skills }) => {
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const newCandidate = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'CANDIDATE',
      phone: phone || null,
      education: education || null,
      skills: skills || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      education: true,
      skills: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const token = generateToken({
    userId: newCandidate.id,
    role: newCandidate.role,
  });

  return {
    user: newCandidate,
    token,
  };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
};

const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      education: true,
      skills: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

module.exports = {
  registerCandidate,
  loginUser,
  getCurrentUser,
};
