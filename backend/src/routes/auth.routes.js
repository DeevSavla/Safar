import express from 'express';
import authController from '../controllers/auth.controller.js';
import {authenticate} from '../middleware/auth.js';

const router = express.Router();

// Register a new user
router.post(
  '/register',
  authController.register
);

// Log in a user
router.post(
  '/login',
  authController.login
);

// Request OTP for login
router.post(
  '/request-otp',
  authController.requestLoginOTP
);

// Verify OTP and login
router.post(
  '/verify-otp',
  authController.verifyLoginOTP
);

// Request password reset
router.post(
  '/forgot-password',
  authController.forgotPassword
);

// Reset password with token
router.post(
  '/reset-password',
  authController.resetPassword
);

// Refresh access token
router.post(
  '/refresh',
  authenticate,
  authController.refreshToken
);

export default router; 