import userService from '../services/user/user.service.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * UserController - Handles user-related requests
 */
class UserController {
  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.id);
      res.status(200).json({
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(req.user.id, currentPassword, newPassword);
      res.status(200).json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteAccount(req, res, next) {
    try {
      await userService.deleteAccount(req.user.id);
      res.status(200).json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updatePreferences(req, res, next) {
    try {
      const user = await userService.updatePreferences(req.user.id, req.body.preferences);
      res.status(200).json({
        message: 'Preferences updated successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController(); 