import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';
import config from '../config/index.js';
import { User } from '../models/index.js';

/**
 * Authenticate a user using JWT
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Authentication token not provided');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check if token was issued before password was last changed
    if (user.passwordChangedAt) {
      const passwordChangedTime = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < passwordChangedTime) {
        throw ApiError.unauthorized('Password changed recently. Please log in again');
      }
    }

    // Set user in request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }
    next(error);
  }
};

/**
 * Check if user has required roles
 * @param {...String} roles - Required roles
 * @returns {Function} Middleware function
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if authentication middleware has run first
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Generate refresh token for user
 * @param {Object} user - User object
 * @returns {String} Refresh token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}; 