import express from 'express';
import userController from '../controllers/user.controller.js';
import {authenticate} from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/me', userController.getProfile);

// Update user profile
router.patch(
  '/me',
  userController.updateProfile
);

// Change user password
router.post(
  '/change-password',
  userController.changePassword
);

// Delete user account
router.delete('/me', userController.deleteAccount);

// Update user preferences
router.patch(
  '/preferences',
  userController.updatePreferences
);

export default router; 