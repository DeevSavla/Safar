import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import emailService from './email-service';
import User from '../models/User';

// In-memory OTP storage - in production, use Redis or another db
const otpStore = new Map();

/**
 * Auth Service - Handles authentication operations
 */
class AuthService {
  /**
   * Generate a random 6-digit OTP
   * @returns {string} 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate and send OTP to user's email
   * @param {string} email - User's email
   */
  async generateAndSendOTP(email) {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate OTP
    const otp = this.generateOTP();
    
    // Store OTP with expiration (10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    otpStore.set(email, {
      otp,
      expiresAt
    });

    // Send OTP via email
    await emailService.sendOTPEmail(email, otp);
    
    return { success: true };
  }

  /**
   * Verify OTP and login user
   * @param {string} email - User's email
   * @param {string} inputOTP - OTP entered by user
   * @returns {Object} User and token
   */
  async verifyOTPAndLogin(email, inputOTP) {
    // Check if OTP exists for email
    const otpData = otpStore.get(email);
    if (!otpData) {
      throw new Error('OTP expired or not requested');
    }

    // Check if OTP has expired
    if (new Date() > otpData.expiresAt) {
      otpStore.delete(email);
      throw new Error('OTP has expired');
    }

    // Verify OTP
    if (inputOTP !== otpData.otp) {
      throw new Error('Invalid OTP');
    }

    // OTP is valid, find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Clear OTP after successful verification
    otpStore.delete(email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user and token
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    };
  }

  /**
   * Login user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Object} User and token
   */
  async login(email, password) {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user and token
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    };
  }
}

export default new AuthService(); 