const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logger } = require('../config/database');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

// Register new user (for admin dashboard)
const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password_hash: password,
      first_name,
      last_name,
      role: role || 'customer',
      is_verified: role === 'admin' // Auto-verify admin users
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    await user.update({ refresh_token: refreshToken });

    logger.info(`New user registered: ${user.id} (${user.email})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    await user.update({
      refresh_token: refreshToken,
      last_login: new Date()
    });

    logger.info(`User logged in: ${user.id} (${user.email})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Telegram authentication
const telegramAuth = async (req, res, next) => {
  try {
    const { telegram_id, first_name, last_name, username, photo_url } = req.body;

    let user = await User.findOne({ where: { telegram_id: telegram_id.toString() } });

    if (!user) {
      // Create new user from Telegram
      user = await User.create({
        telegram_id: telegram_id.toString(),
        first_name,
        last_name: last_name || '',
        role: 'customer',
        avatar_url: photo_url,
        is_verified: true // Auto-verify Telegram users
      });

      logger.info(`New Telegram user registered: ${user.id} (TG: ${telegram_id})`);
    } else {
      // Update user info
      await user.update({
        first_name,
        last_name: last_name || user.last_name,
        avatar_url: photo_url || user.avatar_url,
        last_login: new Date()
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    await user.update({ refresh_token: refreshToken });

    res.json({
      success: true,
      message: 'Telegram authentication successful',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const tokens = generateTokens(user.id);
    
    await user.update({ refresh_token: tokens.refreshToken });

    res.json({
      success: true,
      message: 'Token refreshed',
      data: tokens
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    next(error);
  }
};

// Get current user
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'refresh_token'] }
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    await req.user.update({ refresh_token: null });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  telegramAuth,
  refreshToken,
  getCurrentUser,
  logout
};