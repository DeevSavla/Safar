import {User} from '../../models/user.model.js';
import { ApiError } from '../../middleware/errorHandler.js';

/**
 * UserService - Handles user-related operations
 */
class UserService {
  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @returns {Object} User object
   */
  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user object
   */
  async updateProfile(userId, updateData) {
    // Prevent updating sensitive fields
    const allowedUpdates = ['name', 'profileImage', 'preferences'];
    const updates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    if (Object.keys(updates).length === 0) {
      throw ApiError.badRequest('No valid update fields provided');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Boolean} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return true;
  }

  /**
   * Delete user account
   * @param {String} userId - User ID
   * @returns {Boolean} Success status
   */
  async deleteAccount(userId) {
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      throw ApiError.notFound('User not found');
    }
    return true;
  }

  /**
   * Update user preferences
   * @param {String} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Object} Updated user object
   */
  async updatePreferences(userId, preferences) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }
}

export default new UserService(); 