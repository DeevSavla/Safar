import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {User} from '../../models/user.model.js';
import { ApiError } from '../../middleware/errorHandler.js';
import emailService from './email.service.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * AuthService - Handles authentication operations
 */
class AuthService {
  /**
   * Generate JWT token for a user
   * @param {Object} user - User object
   * @returns {String} JWT token
   */
  generateToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} User object and token
   */
  async register(userData) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw ApiError.badRequest('Email already in use');
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Login a user
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Object} User object and token
   */
  async login(email, password) {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Generate and send OTP for login
   * @param {String} email - User email
   * @returns {Boolean} Success status
   */
  async generateAndSendOTP(email) {
    // Find user by email
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiry (10 minutes)
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    
    await user.save();
    
    // Send OTP email
    return emailService.sendOTPEmail(email, otp);
  }

  /**
   * Verify OTP and login user
   * @param {String} email - User email
   * @param {String} otp - The OTP code to verify
   * @returns {Object} User object and token
   */
  async verifyOTPAndLogin(email, otp) {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    // Check if OTP exists and is valid
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      throw ApiError.badRequest('No OTP was requested');
    }
    
    // Check if OTP has expired
    if (user.otp.expiresAt < new Date()) {
      throw ApiError.badRequest('OTP has expired');
    }
    
    // Check if OTP matches
    if (user.otp.code !== otp) {
      throw ApiError.unauthorized('Invalid OTP');
    }
    
    // Clear OTP after successful verification
    user.otp = null;
    await user.save();
    
    // Generate token
    const token = this.generateToken(user);
    
    return { user, token };
  }

  /**
   * Generate password reset token
   * @param {String} email - User email
   * @returns {Object} Reset token and its expiry
   */
  async generatePasswordResetToken(email) {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set expiry
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    return {
      resetToken,
      email: user.email,
      expires: user.resetPasswordExpires
    };
  }

  /**
   * Reset password using token
   * @param {String} token - Reset token
   * @param {String} newPassword - New password
   * @returns {Boolean} Success status
   */
  async resetPassword(token, newPassword) {
    // Hash token to match stored hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check expiry
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired token');
    }

    // Set new password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return true;
  }
}

export default new AuthService(); 