const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, education, skills } = req.body;
    const result = await authService.registerCandidate({
      name,
      email,
      password,
      phone,
      education,
      skills,
    });

    res.status(201).json({
      success: true,
      message: 'Candidate registered successfully',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // Stateless JWT authentication logout acknowledgment
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
