import { Day, Activity, Itinerary } from '../../models/index.js';
import mongoose from 'mongoose';
import { ApiError } from '../../middleware/errorHandler.js';

/**
 * DayService - Handles operations for days in an itinerary
 */
class DayService {
  /**
   * Get a day by ID
   * @param {String} dayId - Day ID (can be MongoDB ID or UUID)
   * @param {String} userId - User ID
   * @returns {Object} Day with activities
   */
  async getDayById(dayId, userId) {
    // Check if dayId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(dayId)
      ? { _id: dayId }
      : { uuid: dayId };

    // Find day with populated activities
    const day = await Day.findOne(query)
      .populate({
        path: 'activities',
        options: { sort: { 'timeRange.start': 1 } }
      });

    if (!day) {
      throw ApiError.notFound('Day not found');
    }

    // Get the itinerary to check permissions
    const itinerary = await Itinerary.findById(day.itinerary);
    
    if (!itinerary) {
      throw ApiError.notFound('Associated itinerary not found');
    }

    // Check if user is owner or collaborator
    const isOwner = itinerary.owner.toString() === userId;
    const isCollaborator = itinerary.collaborators.some(
      c => c.user.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      throw ApiError.forbidden('Access denied');
    }

    return day;
  }

  /**
   * Update a day
   * @param {String} dayId - Day ID (can be MongoDB ID or UUID)
   * @param {Object} updateData - Data to update
   * @param {String} userId - User ID
   * @returns {Object} Updated day
   */
  async updateDay(dayId, updateData, userId) {
    // Check if dayId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(dayId)
      ? { _id: dayId }
      : { uuid: dayId };

    // Find day
    const day = await Day.findOne(query);
    
    if (!day) {
      throw ApiError.notFound('Day not found');
    }

    // Get the itinerary to check permissions
    const itinerary = await Itinerary.findById(day.itinerary);
    
    if (!itinerary) {
      throw ApiError.notFound('Associated itinerary not found');
    }

    // Check if user is owner or editor collaborator
    const isOwner = itinerary.owner.toString() === userId;
    const isEditorCollaborator = itinerary.collaborators.some(
      c => c.user.toString() === userId && c.role === 'editor'
    );

    if (!isOwner && !isEditorCollaborator) {
      throw ApiError.forbidden('Access denied');
    }

    // Allow updating only specific fields
    const allowedUpdates = [
      'notes',
      'weatherInfo',
      'completed'
    ];

    // Filter update data
    const updates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    if (Object.keys(updates).length === 0) {
      throw ApiError.badRequest('No valid update fields provided');
    }

    // Special handling for date field - validate it's within itinerary date range
    if (updateData.date) {
      const dateObj = new Date(updateData.date);
      
      if (isNaN(dateObj.getTime())) {
        throw ApiError.badRequest('Invalid date format');
      }
      
      const startDate = new Date(itinerary.dateRange.start);
      const endDate = new Date(itinerary.dateRange.end);
      
      if (dateObj < startDate || dateObj > endDate) {
        throw ApiError.badRequest('Date must be within itinerary date range');
      }
      
      updates.date = dateObj;
    }

    // Update day
    const updatedDay = await Day.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('activities');

    return updatedDay;
  }

  /**
   * Add activity to a day
   * @param {String} dayId - Day ID (can be MongoDB ID or UUID)
   * @param {Object} activityData - Activity data
   * @param {String} userId - User ID
   * @returns {Object} Updated day with new activity
   */
  async addActivity(dayId, activityData, userId) {
    // Check if dayId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(dayId)
      ? { _id: dayId }
      : { uuid: dayId };

    // Find day
    const day = await Day.findOne(query);
    
    if (!day) {
      throw ApiError.notFound('Day not found');
    }

    // Get the itinerary to check permissions
    const itinerary = await Itinerary.findById(day.itinerary);
    
    if (!itinerary) {
      throw ApiError.notFound('Associated itinerary not found');
    }

    // Check if user is owner or editor collaborator
    const isOwner = itinerary.owner.toString() === userId;
    const isEditorCollaborator = itinerary.collaborators.some(
      c => c.user.toString() === userId && c.role === 'editor'
    );

    if (!isOwner && !isEditorCollaborator) {
      throw ApiError.forbidden('Access denied');
    }

    // Validate required fields
    if (!activityData.title || !activityData.type) {
      throw ApiError.badRequest('Title and type are required for activities');
    }

    // Create new activity
    const activity = new Activity({
      title: activityData.title,
      type: activityData.type,
      day: day._id,
      description: activityData.description,
      location: activityData.location,
      timeRange: activityData.timeRange,
      cost: activityData.cost || { amount: 0, currency: itinerary.budget.currency },
      reservationInfo: activityData.reservationInfo,
      completed: activityData.completed || false
    });

    await activity.save();

    // Add activity to day
    day.activities.push(activity._id);
    await day.save();

    // If budget is provided, update itinerary budget
    if (activityData.cost && activityData.cost.amount > 0) {
      itinerary.budget.spent += activityData.cost.amount;
      await itinerary.save();
    }

    // Refresh day with populated activities
    const updatedDay = await Day.findById(day._id).populate({
      path: 'activities',
      options: { sort: { 'timeRange.start': 1 } }
    });

    return updatedDay;
  }

  /**
   * Update activity
   * @param {String} activityId - Activity ID (can be MongoDB ID or UUID)
   * @param {Object} updateData - Data to update
   * @param {String} userId - User ID
   * @returns {Object} Updated activity
   */
  async updateActivity(activityId, updateData, userId) {
    // Check if activityId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(activityId)
      ? { _id: activityId }
      : { uuid: activityId };

    // Find activity
    const activity = await Activity.findOne(query);
    
    if (!activity) {
      throw ApiError.notFound('Activity not found');
    }

    // Find associated day and itinerary
    const day = await Day.findById(activity.day);
    if (!day) {
      throw ApiError.notFound('Associated day not found');
    }

    const itinerary = await Itinerary.findById(day.itinerary);
    if (!itinerary) {
      throw ApiError.notFound('Associated itinerary not found');
    }

    // Check if user is owner or editor collaborator
    const isOwner = itinerary.owner.toString() === userId;
    const isEditorCollaborator = itinerary.collaborators.some(
      c => c.user.toString() === userId && c.role === 'editor'
    );

    if (!isOwner && !isEditorCollaborator) {
      throw ApiError.forbidden('Access denied');
    }

    // Allow updating only specific fields
    const allowedUpdates = [
      'title',
      'description',
      'type',
      'location',
      'timeRange',
      'cost',
      'reservationInfo',
      'completed'
    ];

    // Filter update data
    const updates = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    if (Object.keys(updates).length === 0) {
      throw ApiError.badRequest('No valid update fields provided');
    }

    // Handle budget updates if cost is changed
    if (updateData.cost && updateData.cost.amount !== activity.cost.amount) {
      // Calculate difference in cost
      const costDifference = updateData.cost.amount - activity.cost.amount;
      
      // Update itinerary budget
      itinerary.budget.spent += costDifference;
      await itinerary.save();
    }

    // Update activity
    const updatedActivity = await Activity.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return updatedActivity;
  }

  /**
   * Delete activity
   * @param {String} activityId - Activity ID (can be MongoDB ID or UUID)
   * @param {String} userId - User ID
   * @returns {Boolean} Success status
   */
  async deleteActivity(activityId, userId) {
    // Check if activityId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(activityId)
      ? { _id: activityId }
      : { uuid: activityId };

    // Find activity
    const activity = await Activity.findOne(query);
    
    if (!activity) {
      throw ApiError.notFound('Activity not found');
    }

    // Find associated day and itinerary
    const day = await Day.findById(activity.day);
    if (!day) {
      throw ApiError.notFound('Associated day not found');
    }

    const itinerary = await Itinerary.findById(day.itinerary);
    if (!itinerary) {
      throw ApiError.notFound('Associated itinerary not found');
    }

    // Check if user is owner or editor collaborator
    const isOwner = itinerary.owner.toString() === userId;
    const isEditorCollaborator = itinerary.collaborators.some(
      c => c.user.toString() === userId && c.role === 'editor'
    );

    if (!isOwner && !isEditorCollaborator) {
      throw ApiError.forbidden('Access denied');
    }

    // If activity has cost, update itinerary budget
    if (activity.cost && activity.cost.amount > 0) {
      itinerary.budget.spent -= activity.cost.amount;
      await itinerary.save();
    }

    // Remove activity from day
    day.activities = day.activities.filter(
      a => a.toString() !== activity._id.toString()
    );
    await day.save();

    // Delete activity
    await Activity.deleteOne({ _id: activity._id });

    return true;
  }

  /**
   * Reorder activities for a day
   * @param {String} dayId - Day ID (can be MongoDB ID or UUID)
   * @param {Array} activityIds - Ordered array of activity IDs
   * @param {String} userId - User ID
   * @returns {Object} Updated day with reordered activities
   */
  async reorderActivities(dayId, activityIds, userId) {
    // Check if dayId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(dayId)
      ? { _id: dayId }
      : { uuid: dayId };

    // Find day
    const day = await Day.findOne(query).populate('activities');
    
    if (!day) {
      throw ApiError.notFound('Day not found');
    }

    // Get the itinerary to check permissions
    const itinerary = await Itinerary.findById(day.itinerary);
    
    if (!itinerary) {
      throw ApiError.notFound('Associated itinerary not found');
    }

    // Check if user is owner or editor collaborator
    const isOwner = itinerary.owner.toString() === userId;
    const isEditorCollaborator = itinerary.collaborators.some(
      c => c.user.toString() === userId && c.role === 'editor'
    );

    if (!isOwner && !isEditorCollaborator) {
      throw ApiError.forbidden('Access denied');
    }

    // Validate that all activities belong to this day
    const currentActivityIds = day.activities.map(a => a._id.toString());
    const allBelongToDay = activityIds.every(id => currentActivityIds.includes(id));
    
    if (!allBelongToDay) {
      throw ApiError.badRequest('Some activities do not belong to this day');
    }

    // Check if all current activities are in the new order
    if (activityIds.length !== currentActivityIds.length) {
      throw ApiError.badRequest('All activities must be included in the new order');
    }

    // Update the day's activities with the new order
    day.activities = activityIds;
    await day.save();

    // Return the updated day with populated activities
    const updatedDay = await Day.findById(day._id).populate({
      path: 'activities',
      options: { sort: { 'timeRange.start': 1 } }
    });

    return updatedDay;
  }

  /**
   * Renumber days in chronological order
   * @param {String} itineraryId - Itinerary ID
   * @param {String} userId - User ID
   * @returns {Array} Updated days
   */
  async renumberDaysChronologically(itineraryId, userId) {
    // Get the itinerary and verify access
    const itinerary = await Itinerary.findById(itineraryId);
    
    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }
    
    // Check if user is owner or editor collaborator
    const isOwner = itinerary.owner.toString() === userId;
    const isEditorCollaborator = itinerary.collaborators.some(
      c => c.user.toString() === userId && c.role === 'editor'
    );
    
    if (!isOwner && !isEditorCollaborator) {
      throw ApiError.forbidden('Access denied');
    }
    
    // Get all days for this itinerary
    const days = await Day.find({ itinerary: itineraryId })
      .sort({ date: 1 }) // Sort by date ascending
      .populate('activities');
    
    // Update day numbers sequentially
    const updatedDays = [];
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      day.dayNumber = i + 1; // Set day number (1-based index)
      await day.save();
      updatedDays.push(day);
    }
    
    // Update the itinerary's days array to reflect the new order
    itinerary.days = updatedDays.map(day => day._id);
    await itinerary.save();
    
    return updatedDays;
  }

  /**
   * Clear all activities for a day
   * @param {String} dayId - Day ID (can be MongoDB ID or UUID)
   * @param {String} userId - User ID
   * @returns {Object} Updated day
   */
  async clearDayActivities(dayId, userId) {
    // Check if dayId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(dayId)
      ? { _id: dayId }
      : { uuid: dayId };

    // Find day
    const day = await Day.findOne(query);
    
    if (!day) {
      throw ApiError.notFound('Day not found');
    }

    // Get the itinerary to check permissions
    const itinerary = await Itinerary.findById(day.itinerary);
    
    if (!itinerary) {
      throw ApiError.notFound('Associated itinerary not found');
    }

    // Check if user is owner or editor collaborator
    const isOwner = itinerary.owner.toString() === userId;
    const isEditorCollaborator = itinerary.collaborators.some(
      c => c.user.toString() === userId && c.role === 'editor'
    );

    if (!isOwner && !isEditorCollaborator) {
      throw ApiError.forbidden('Access denied');
    }

    // Get all activity IDs for this day
    const activityIds = day.activities;
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete all activities for this day
      if (activityIds.length > 0) {
        await Activity.deleteMany({ _id: { $in: activityIds } }, { session });
      }
      
      // Clear the day's activities array
      day.activities = [];
      await day.save({ session });
      
      // Add a note to the day indicating it's a free day
      day.notes = day.notes ? `${day.notes}\nThis is a free day for relaxation or exploration.` : 
                             'This is a free day for relaxation or exploration.';
      await day.save({ session });
      
      // Commit the transaction
      await session.commitTransaction();
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
    
    // Return the updated day
    const updatedDay = await Day.findById(day._id);
    return updatedDay;
  }

  /**
   * Create a new activity for a day
   * @param {String} dayId - Day ID
   * @param {Object} activityData - Activity data
   * @param {String} userId - User ID
   * @returns {Object} Created activity
   */
  async createActivity(dayId, activityData, userId) {
    // Check if dayId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(dayId)
      ? { _id: dayId }
      : { uuid: dayId };

    // Find day
    const day = await Day.findOne(query);
    
    if (!day) {
      throw ApiError.notFound('Day not found');
    }

    // Get the itinerary to check permissions
    const itinerary = await Itinerary.findById(day.itinerary);
    
    if (!itinerary) {
      throw ApiError.notFound('Associated itinerary not found');
    }

    // Check if user is owner or editor collaborator
    const isOwner = itinerary.owner.toString() === userId;
    const isEditorCollaborator = itinerary.collaborators.some(
      c => c.user.toString() === userId && c.role === 'editor'
    );

    if (!isOwner && !isEditorCollaborator) {
      throw ApiError.forbidden('Access denied');
    }

    // Create activity
    const activity = new Activity({
      title: activityData.title,
      description: activityData.description || '',
      timeRange: activityData.timeRange || { start: '12:00', end: '13:00' },
      location: activityData.location,
      type: activityData.type || 'activity',
      cost: activityData.cost,
      day: day._id
    });

    await activity.save();

    // Add activity to day
    day.activities.push(activity._id);
    await day.save();

    return activity;
  }
}

export default new DayService(); 