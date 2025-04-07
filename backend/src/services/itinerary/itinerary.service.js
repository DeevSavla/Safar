import { Itinerary, Day, Activity } from '../../models/index.js';
import { ApiError } from '../../middleware/errorHandler.js';
import mongoose from 'mongoose';
import emailService from '../user/email.service.js';

/**
 * ItineraryService - Handles itinerary-related operations
 */
class ItineraryService {
  /**
   * Create a new itinerary
   * @param {String} userId - User ID
   * @param {Object} itineraryData - Itinerary creation data
   * @returns {Object} Created itinerary
   */
  async createItinerary(userId, itineraryData) {
    try {
      // Create itinerary with default values if fields are missing
      const itinerary = new Itinerary({
        title: itineraryData.title || 'Untitled Itinerary',
        description: itineraryData.description || '',
        owner: userId,
        destination: itineraryData.destination || { name: 'Unknown' },
        dateRange: {
          start: itineraryData.dateRange ? new Date(itineraryData.dateRange.start) : new Date(),
          end: itineraryData.dateRange ? new Date(itineraryData.dateRange.end) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        transportation: itineraryData.transportation || { mode: 'mixed' },
        budget: itineraryData.budget || { currency: 'USD', total: 0, spent: 0 },
        source: itineraryData.source || '',
        sourceLocation: itineraryData.sourceLocation || 'Borivali',
        numberOfPeople: itineraryData.numberOfPeople || 1
      });

      // Add route locations if provided
      if (itineraryData.routeLocations && Array.isArray(itineraryData.routeLocations)) {
        itinerary.routeLocations = itineraryData.routeLocations;
      }

      await itinerary.save();

      // Generate days for the itinerary if requested
      if (itineraryData.generateDays !== false) {
        await this.generateDaysForItinerary(itinerary);
      }

      return itinerary;
    } catch (error) {
      // Just pass through the error without validation
      throw error;
    }
  }

  /**
   * Generate days for an itinerary based on date range
   * @param {Object} itinerary - Itinerary object
   * @returns {Array} Created days
   */
  async generateDaysForItinerary(itinerary) {
    const days = [];
    const startDate = new Date(itinerary.dateRange.start);
    const endDate = new Date(itinerary.dateRange.end);
    
    // Loop through each day in the date range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const day = new Day({
        date: new Date(date),
        itinerary: itinerary._id
      });
      
      await day.save();
      days.push(day);
    }

    // Update itinerary with day references
    itinerary.days = days.map(day => day._id);
    await itinerary.save();
    
    return days;
  }

  /**
   * Get all itineraries for a user
   * @param {String} userId - User ID
   * @param {Object} query - Query parameters (sort, filter)
   * @returns {Array} Itineraries
   */
  async getItineraries(userId, query = {}) {
    const { sort = 'createdAt', order = 'desc', limit = 20, page = 1 } = query;
    
    // Build query to include both owned itineraries and those where user is a collaborator
    const filter = {
      $or: [
        { owner: userId },
        { 'collaborators.user': userId }
      ]
    };
    
    // Add additional filters if provided
    if (query.search) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: query.search, $options: 'i' } },
            { 'destination.name': { $regex: query.search, $options: 'i' } }
          ]
        }
      ];
    }
    
    if (query.startDate) {
      const dateFilter = { 'dateRange.start': { $gte: new Date(query.startDate) } };
      if (filter.$and) {
        filter.$and.push(dateFilter);
      } else {
        filter.$and = [dateFilter];
      }
    }
    
    if (query.endDate) {
      const dateFilter = { 'dateRange.end': { $lte: new Date(query.endDate) } };
      if (filter.$and) {
        filter.$and.push(dateFilter);
      } else {
        filter.$and = [dateFilter];
      }
    }
    
    // Create sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const itineraries = await Itinerary.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');
    
    // Get total count for pagination
    const total = await Itinerary.countDocuments(filter);
    
    return {
      itineraries,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get itinerary by ID
   * @param {String} itineraryId - Itinerary ID (can be MongoDB ID or UUID)
   * @param {String} userId - User ID
   * @returns {Object} Itinerary
   */
  async getItineraryById(itineraryId, userId) {
    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email')
      .populate({
        path: 'days',
        options: { sort: { date: 1 } }
      });

    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }

    // Check if user is owner or collaborator
    const isOwner = itinerary.owner._id.toString() === userId;
    const isCollaborator = itinerary.collaborators.some(
      c => c.user._id.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      throw ApiError.forbidden('Access denied');
    }

    return itinerary;
  }

  /**
   * Update itinerary
   * @param {String} itineraryId - Itinerary ID (can be MongoDB ID or UUID)
   * @param {Object} updateData - Data to update
   * @param {String} userId - User ID
   * @returns {Object} Updated itinerary
   */
  async updateItinerary(itineraryId, updateData, userId) {
    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query);
    
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

    // Allow updating only specific fields
    const allowedUpdates = [
      'title',
      'description',
      'destination',
      'dateRange',
      'transportation',
      'budget',
      'routeLocations'
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

    // Apply version control
    updates.version = itinerary.version + 1;

    // Update itinerary
    const updatedItinerary = await Itinerary.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    return updatedItinerary;
  }

  /**
   * Delete itinerary
   * @param {String} itineraryId - Itinerary ID (can be MongoDB ID or UUID)
   * @param {String} userId - User ID
   * @returns {Boolean} Success status
   */
  async deleteItinerary(itineraryId, userId) {
    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query);
    
    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }

    // Check if user is owner
    if (itinerary.owner.toString() !== userId) {
      throw ApiError.forbidden('Only the owner can delete an itinerary');
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete all activities for the itinerary's days
      const dayIds = itinerary.days;
      await Activity.deleteMany({ day: { $in: dayIds } }, { session });
      
      // Delete all days for the itinerary
      await Day.deleteMany({ itinerary: itinerary._id }, { session });
      
      // Delete the itinerary
      await Itinerary.deleteOne({ _id: itinerary._id }, { session });
      
      // Commit transaction
      await session.commitTransaction();
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End session
      session.endSession();
    }

    return true;
  }

  /**
   * Add collaborator to itinerary
   * @param {String} itineraryId - Itinerary ID (can be MongoDB ID or UUID)
   * @param {String} collaboratorEmail - Collaborator email
   * @param {String} role - Collaborator role (editor or viewer)
   * @param {String} userId - User ID (owner)
   * @returns {Object} Updated itinerary
   */
  async addCollaborator(itineraryId, collaboratorEmail, role, userId) {
    // Validate role
    if (!['editor', 'viewer'].includes(role)) {
      throw ApiError.badRequest('Invalid role. Must be editor or viewer');
    }

    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query)
      .populate('owner', 'name email');
    
    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }

    // Check if user is owner
    if (itinerary.owner._id.toString() !== userId) {
      throw ApiError.forbidden('Only the owner can add collaborators');
    }

    // Find collaborator user
    const User = mongoose.model('User');
    const collaborator = await User.findOne({ email: collaboratorEmail });
    
    if (!collaborator) {
      throw ApiError.notFound('User not found. They must have an account to be added to the itinerary.');
    }

    // Check if user is already a collaborator
    const isCollaborator = itinerary.collaborators.some(
      c => c.user && c.user.toString() === collaborator._id.toString()
    );

    if (isCollaborator) {
      throw ApiError.badRequest('User is already a collaborator');
    }

    // Add collaborator
    itinerary.collaborators.push({
      user: collaborator._id,
      role
    });

    await itinerary.save();

    // Get the updated itinerary with populated fields
    const updatedItinerary = await Itinerary.findById(itinerary._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    // Send email invitation
    try {
      await emailService.sendGroupItineraryInvitation(
        collaboratorEmail,
        {
          inviterName: itinerary.owner.name || itinerary.owner.email,
          itineraryTitle: itinerary.title,
          itineraryId: itinerary.uuid || itinerary._id,
          role: role
        }
      );
      console.log(`Invitation email sent to ${collaboratorEmail}`);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue even if email fails
    }

    return updatedItinerary;
  }

  /**
   * Remove collaborator from itinerary
   * @param {String} itineraryId - Itinerary ID (can be MongoDB ID or UUID)
   * @param {String} collaboratorId - Collaborator user ID
   * @param {String} userId - User ID (owner)
   * @returns {Object} Updated itinerary
   */
  async removeCollaborator(itineraryId, collaboratorId, userId) {
    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query);
    
    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }

    // Check if user is owner
    if (itinerary.owner.toString() !== userId) {
      throw ApiError.forbidden('Only the owner can remove collaborators');
    }

    // Remove collaborator
    itinerary.collaborators = itinerary.collaborators.filter(
      c => c.user.toString() !== collaboratorId
    );

    await itinerary.save();

    // Populate and return
    return await Itinerary.findById(itinerary._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');
  }

  /**
   * Get all public itineraries
   * @param {Object} query - Query parameters (sort, filter)
   * @returns {Array} Itineraries
   */
  async getPublicItineraries(query = {}) {
    const { sort = 'createdAt', order = 'desc', limit = 20, page = 1 } = query;
    
    // Build query - only get public itineraries
    const filter = { isPrivate: false };
    
    // Add additional filters if provided
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { 'destination.name': { $regex: query.search, $options: 'i' } }
      ];
    }
    
    if (query.startDate) {
      filter['dateRange.start'] = { $gte: new Date(query.startDate) };
    }
    
    if (query.endDate) {
      filter['dateRange.end'] = { $lte: new Date(query.endDate) };
    }
    
    // Create sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const itineraries = await Itinerary.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('owner', 'name email');
    
    // Get total count for pagination
    const total = await Itinerary.countDocuments(filter);
    
    return {
      itineraries,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Request to join a public itinerary
   * @param {String} itineraryId - Itinerary ID (can be MongoDB ID or UUID)
   * @param {String} userId - User ID requesting to join
   * @returns {Object} Join request status
   */
  async requestToJoinItinerary(itineraryId, userId) {
    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query)
      .populate('owner', 'name email');
    
    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }
    
    // Check if user is the owner - owners shouldn't request to join their own itineraries
    if (itinerary.owner._id.toString() === userId) {
      throw ApiError.badRequest('You are the owner of this itinerary and already have access');
    }

    // Check if itinerary is private
    if (itinerary.isPrivate) {
      throw ApiError.forbidden('This itinerary is private and cannot be joined');
    }

    // Check if itinerary is publicly joinable
    if (!itinerary.publiclyJoinable) {
      throw ApiError.forbidden('This itinerary is not open for join requests');
    }

    // Check if user is already a collaborator
    const isCollaborator = itinerary.collaborators.some(
      c => c.user && c.user.toString() === userId
    );

    if (isCollaborator) {
      throw ApiError.badRequest('You are already a collaborator on this itinerary');
    }

    // Check if user already has a pending request
    const hasPendingRequest = itinerary.joinRequests.some(
      req => req.user.toString() === userId && req.status === 'pending'
    );

    if (hasPendingRequest) {
      throw ApiError.badRequest('You already have a pending request to join this itinerary');
    }

    // Add join request
    itinerary.joinRequests.push({
      user: userId,
      status: 'pending',
      requestedAt: new Date()
    });

    await itinerary.save();

    // Find user
    const User = mongoose.model('User');
    const requester = await User.findById(userId);

    // Send email notification to owner
    try {
      await emailService.sendJoinRequestNotification(
        itinerary.owner.email,
        {
          ownerName: itinerary.owner.name || itinerary.owner.email,
          requesterName: requester.name || requester.email,
          requesterEmail: requester.email,
          itineraryTitle: itinerary.title,
          itineraryId: itinerary.uuid || itinerary._id,
          requestDate: new Date().toISOString()
        }
      );
      console.log(`Join request notification sent to ${itinerary.owner.email}`);
    } catch (emailError) {
      console.error('Failed to send join request notification:', emailError);
      // Continue even if email fails
    }

    return {
      status: 'pending',
      message: 'Your request to join this itinerary has been submitted and is pending approval'
    };
  }

  /**
   * Process a join request (approve or reject)
   * @param {String} itineraryId - Itinerary ID
   * @param {String} requesterId - User ID of the requester
   * @param {String} action - 'approve' or 'reject'
   * @param {String} ownerId - Owner ID processing the request
   * @returns {Object} Updated itinerary
   */
  async processJoinRequest(itineraryId, requesterId, action, ownerId) {
    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      throw ApiError.badRequest('Invalid action. Must be approve or reject');
    }

    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query);
    
    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }

    // Check if user is owner
    if (itinerary.owner.toString() !== ownerId) {
      throw ApiError.forbidden('Only the owner can process join requests');
    }

    // Find the join request
    const requestIndex = itinerary.joinRequests.findIndex(
      req => req.user.toString() === requesterId && req.status === 'pending'
    );

    if (requestIndex === -1) {
      throw ApiError.notFound('No pending join request found for this user');
    }

    // Update the join request status
    itinerary.joinRequests[requestIndex].status = action === 'approve' ? 'approved' : 'rejected';

    // If approved, add the user as a collaborator with viewer role
    if (action === 'approve') {
      // Check if user is already a collaborator (shouldn't happen but just in case)
      const isCollaborator = itinerary.collaborators.some(
        c => c.user && c.user.toString() === requesterId
      );

      if (!isCollaborator) {
        itinerary.collaborators.push({
          user: requesterId,
          role: 'viewer'  // All join requests get viewer role by default
        });
      }
    }

    await itinerary.save();

    // Find user for email notification
    const User = mongoose.model('User');
    const requester = await User.findById(requesterId);

    // Send email notification to requester about decision
    try {
      if (action === 'approve') {
        await emailService.sendJoinRequestApproval(
          requester.email,
          {
            userName: requester.name || requester.email,
            itineraryTitle: itinerary.title,
            itineraryId: itinerary.uuid || itinerary._id
          }
        );
      } else {
        await emailService.sendJoinRequestRejection(
          requester.email,
          {
            userName: requester.name || requester.email,
            itineraryTitle: itinerary.title
          }
        );
      }
      console.log(`Join request ${action} notification sent to ${requester.email}`);
    } catch (emailError) {
      console.error(`Failed to send join request ${action} notification:`, emailError);
      // Continue even if email fails
    }

    // Populate and return the updated itinerary
    return await Itinerary.findById(itinerary._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email')
      .populate('joinRequests.user', 'name email');
  }

  /**
   * Get all join requests for an itinerary
   * @param {String} itineraryId - Itinerary ID
   * @param {String} ownerId - Owner ID
   * @returns {Array} Join requests
   */
  async getJoinRequests(itineraryId, ownerId) {
    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query)
      .populate('joinRequests.user', 'name email');
    
    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }

    // Check if user is owner
    if (itinerary.owner.toString() !== ownerId) {
      throw ApiError.forbidden('Only the owner can view join requests');
    }

    return itinerary.joinRequests;
  }

  /**
   * Toggle public join setting for an itinerary
   * @param {String} itineraryId - Itinerary ID
   * @param {Boolean} publiclyJoinable - Whether the itinerary is open for join requests
   * @param {String} ownerId - Owner ID
   * @returns {Object} Updated itinerary
   */
  async togglePublicJoinSetting(itineraryId, publiclyJoinable, ownerId) {
    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query);
    
    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }

    // Check if user is owner
    if (itinerary.owner.toString() !== ownerId) {
      throw ApiError.forbidden('Only the owner can change join settings');
    }

    // Update the setting
    itinerary.publiclyJoinable = publiclyJoinable;

    // If the itinerary is private, ensure publicly joinable is false
    if (itinerary.isPrivate) {
      itinerary.publiclyJoinable = false;
    }

    await itinerary.save();

    // Populate and return the updated itinerary
    return await Itinerary.findById(itinerary._id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');
  }

  /**
   * Process AI generated itinerary data and create days and activities
   * @param {String} itineraryId - Itinerary ID
   * @param {Object} aiData - AI generated itinerary data
   * @param {String} userId - User ID
   * @returns {Object} Updated itinerary with created days
   */
  async processAiGeneratedItinerary(itineraryId, aiData, userId) {
    // Find itinerary
    const itinerary = await Itinerary.findById(itineraryId);
    
    if (!itinerary) {
      throw ApiError.notFound('Itinerary not found');
    }
    
    // Check if user is owner or editor collaborator
    const isOwner = String(itinerary.owner) === String(userId);
    const isEditorCollaborator = itinerary.collaborators.some(
      c => String(c.user) === String(userId) && c.role === 'editor'
    );
    
    console.log('Process AI Itinerary - Authentication Check:');
    console.log('User ID from token:', userId, 'type:', typeof userId);
    console.log('Itinerary owner ID:', itinerary.owner, 'type:', typeof itinerary.owner);
    console.log('String comparison result:', String(itinerary.owner) === String(userId));
    console.log('Is editor:', isEditorCollaborator);

    if (!isOwner && !isEditorCollaborator) {
      throw ApiError.forbidden('Access denied - User must be the owner or an editor');
    }
    
    // Validate AI data
    if (!aiData.itinerary || !aiData.itinerary.day_wise_plan || !Array.isArray(aiData.itinerary.day_wise_plan)) {
      throw ApiError.badRequest('Invalid AI itinerary data format');
    }
    
    // Delete existing days if any
    if (itinerary.days && itinerary.days.length > 0) {
      // Delete associated activities
      for (const dayId of itinerary.days) {
        const day = await Day.findById(dayId);
        if (day && day.activities.length > 0) {
          await Activity.deleteMany({ _id: { $in: day.activities } });
        }
      }
      
      // Delete days
      await Day.deleteMany({ _id: { $in: itinerary.days } });
      
      // Clear days array
      itinerary.days = [];
    }
    
    // Create days from AI data
    const createdDays = [];
    
    for (const dayData of aiData.itinerary.day_wise_plan) {
      try {
        // Parse date if available
        let dayDate = null;
        if (dayData.date) {
          // Try to parse the date (format might vary)
          try {
            dayDate = new Date(dayData.date);
            if (isNaN(dayDate.getTime())) {
              // Try other format (DD-MM-YYYY)
              const parts = dayData.date.split('-');
              if (parts.length === 3) {
                dayDate = new Date(parts[2], parts[1] - 1, parts[0]);
              }
            }
          } catch (error) {
            console.error(`Error parsing date: ${dayData.date}`, error);
          }
        }
        
        // Create day
        const day = new Day({
          date: dayDate,
          itinerary: itinerary._id,
          notes: dayData.destination || `Day ${dayData.day}`
        });
        
        await day.save();
        
        // Parse estimated cost if available
        let costAmount = 0;
        let costCurrency = 'USD';
        
        if (dayData.estimated_cost) {
          // Parse the estimated cost string (e.g., "INR 7000-13000")
          try {
            const costString = dayData.estimated_cost;
            // Extract currency and amount
            const regex = /([A-Za-z]+)\s*(\d+)(?:-(\d+))?/;
            const match = costString.match(regex);
            
            if (match) {
              costCurrency = match[1] || 'USD';
              // If there's a range, take the average or the first value
              if (match[3]) {
                const min = parseInt(match[2]);
                const max = parseInt(match[3]);
                costAmount = Math.floor((min + max) / 2);
              } else {
                costAmount = parseInt(match[2]);
              }
            }
          } catch (error) {
            console.error(`Error parsing estimated cost: ${dayData.estimated_cost}`, error);
          }
        }
        
        // Add activities
        if (dayData.activities && Array.isArray(dayData.activities)) {
          for (const activityTitle of dayData.activities) {
            const activity = new Activity({
              title: activityTitle,
              type: 'other', // Default type
              day: day._id,
              cost: {
                amount: costAmount / dayData.activities.length, // Distribute cost among activities
                currency: costCurrency
              }
            });
            
            await activity.save();
            day.activities.push(activity._id);
          }
        }
        
        // Add accommodation as activity if available
        if (dayData.accomodations && Array.isArray(dayData.accomodations) && dayData.accomodations.length > 0) {
          for (const accommodation of dayData.accomodations) {
            let accomCost = { amount: 0, currency: costCurrency };
            
            // Try to parse the price range if available
            if (accommodation.price_range) {
              try {
                const priceRegex = /([A-Za-z]+)\s*(\d+)(?:-(\d+))?/;
                const priceMatch = accommodation.price_range.match(priceRegex);
                
                if (priceMatch) {
                  accomCost.currency = priceMatch[1] || costCurrency;
                  if (priceMatch[3]) {
                    const min = parseInt(priceMatch[2]);
                    const max = parseInt(priceMatch[3]);
                    accomCost.amount = Math.floor((min + max) / 2);
                  } else {
                    accomCost.amount = parseInt(priceMatch[2]);
                  }
                }
              } catch (error) {
                console.error(`Error parsing accommodation price: ${accommodation.price_range}`, error);
              }
            }
            
            const activity = new Activity({
              title: `Stay at ${accommodation.name}`,
              type: 'accommodation',
              day: day._id,
              notes: `Price Range: ${accommodation.price_range || 'N/A'}`,
              cost: accomCost
            });
            
            await activity.save();
            day.activities.push(activity._id);
          }
        }
        
        // Add restaurants as activities if available
        if (dayData.restaurants && Array.isArray(dayData.restaurants) && dayData.restaurants.length > 0) {
          for (const restaurant of dayData.restaurants) {
            let foodCost = { amount: 0, currency: costCurrency };
            
            // Try to parse the price range if available
            if (restaurant.price_range) {
              try {
                const priceRegex = /([A-Za-z]+)\s*(\d+)(?:-(\d+))?/;
                const priceMatch = restaurant.price_range.match(priceRegex);
                
                if (priceMatch) {
                  foodCost.currency = priceMatch[1] || costCurrency;
                  if (priceMatch[3]) {
                    const min = parseInt(priceMatch[2]);
                    const max = parseInt(priceMatch[3]);
                    foodCost.amount = Math.floor((min + max) / 2);
                  } else {
                    foodCost.amount = parseInt(priceMatch[2]);
                  }
                }
              } catch (error) {
                console.error(`Error parsing restaurant price: ${restaurant.price_range}`, error);
              }
            }
            
            const activity = new Activity({
              title: `Eat at ${restaurant.name}`,
              type: 'food',
              day: day._id,
              notes: `Cuisine: ${restaurant.cuisine || 'N/A'}, Price Range: ${restaurant.price_range || 'N/A'}`,
              cost: foodCost
            });
            
            await activity.save();
            day.activities.push(activity._id);
          }
        }
        
        // Add events as activities if available
        if (dayData.events && Array.isArray(dayData.events) && dayData.events.length > 0) {
          for (const eventTitle of dayData.events) {
            const activity = new Activity({
              title: eventTitle,
              type: 'other',
              day: day._id,
              cost: {
                amount: costAmount / (dayData.events.length + (dayData.activities ? dayData.activities.length : 0)),
                currency: costCurrency
              }
            });
            
            await activity.save();
            day.activities.push(activity._id);
          }
        }
        
        // Add transportation as activities if available
        if (dayData.transportation && Array.isArray(dayData.transportation) && dayData.transportation.length > 0) {
          for (const transport of dayData.transportation) {
            // Handle transportation route 1
            if (transport.transportation_route1 && Array.isArray(transport.transportation_route1)) {
              for (const leg of transport.transportation_route1) {
                let transportCost = { amount: 0, currency: costCurrency };
                
                // Try to parse the estimated cost if available
                if (leg.estimated_cost1) {
                  try {
                    const costRegex = /([A-Za-z]+)\s*(\d+)(?:-(\d+))?/;
                    const costMatch = leg.estimated_cost1.match(costRegex);
                    
                    if (costMatch) {
                      transportCost.currency = costMatch[1] || costCurrency;
                      if (costMatch[3]) {
                        const min = parseInt(costMatch[2]);
                        const max = parseInt(costMatch[3]);
                        transportCost.amount = Math.floor((min + max) / 2);
                      } else {
                        transportCost.amount = parseInt(costMatch[2]);
                      }
                    }
                  } catch (error) {
                    console.error(`Error parsing transportation cost: ${leg.estimated_cost1}`, error);
                  }
                }
                
                const activity = new Activity({
                  title: leg.transportation_mode1 || 'Transportation',
                  type: 'transport',
                  day: day._id,
                  notes: `Duration: ${leg.transportation_duration1 || 'N/A'}, Distance: ${leg.transportation_distance1 || 'N/A'}`,
                  cost: transportCost
                });
                
                await activity.save();
                day.activities.push(activity._id);
              }
            }
            
            // Handle transportation route 2 if present
            if (transport.transportation_route2 && Array.isArray(transport.transportation_route2)) {
              for (const leg of transport.transportation_route2) {
                let transportCost = { amount: 0, currency: costCurrency };
                
                // Try to parse the estimated cost if available
                if (leg.estimated_cost1) {
                  try {
                    const costRegex = /([A-Za-z]+)\s*(\d+)(?:-(\d+))?/;
                    const costMatch = leg.estimated_cost1.match(costRegex);
                    
                    if (costMatch) {
                      transportCost.currency = costMatch[1] || costCurrency;
                      if (costMatch[3]) {
                        const min = parseInt(costMatch[2]);
                        const max = parseInt(costMatch[3]);
                        transportCost.amount = Math.floor((min + max) / 2);
                      } else {
                        transportCost.amount = parseInt(costMatch[2]);
                      }
                    }
                  } catch (error) {
                    console.error(`Error parsing transportation cost: ${leg.estimated_cost1}`, error);
                  }
                }
                
                const activity = new Activity({
                  title: leg.transportation_mode1 || 'Alternative Transportation',
                  type: 'transport',
                  day: day._id,
                  notes: `Duration: ${leg.transportation_duration1 || 'N/A'}, Distance: ${leg.transportation_distance1 || 'N/A'}`,
                  cost: transportCost
                });
                
                await activity.save();
                day.activities.push(activity._id);
              }
            }
          }
        }
        
        // Save day with activities
        await day.save();
        
        // Add day to itinerary
        itinerary.days.push(day._id);
        createdDays.push(day);
      } catch (error) {
        console.error(`Error processing day ${dayData.day}:`, error);
        // Continue with next day
      }
    }
    
    // Store additional suggestions if available
    if (aiData.itinerary.additional_suggestions) {
      console.log('Storing additional suggestions from AI response');
      itinerary.additionalSuggestions = aiData.itinerary.additional_suggestions;
    }
    
    // Save updated itinerary
    await itinerary.save();
    
    // Return updated itinerary with populated days
    const updatedItinerary = await Itinerary.findById(itineraryId)
      .populate({
        path: 'days',
        populate: {
          path: 'activities',
          options: { sort: { 'timeRange.start': 1 } }
        }
      });
    
    return {
      itinerary: updatedItinerary,
      createdDays: createdDays.length
    };
  }

  /**
   * Update specific fields of an itinerary
   * @param {String} itineraryId - Itinerary ID (can be MongoDB ID or UUID)
   * @param {Object} updateFields - Fields to update (can include dot notation)
   * @param {String} userId - User ID
   * @returns {Object} Updated itinerary
   */
  async updateItineraryFields(itineraryId, updateFields, userId) {
    // Check if itineraryId is a UUID or MongoDB ID
    const query = mongoose.isValidObjectId(itineraryId)
      ? { _id: itineraryId }
      : { uuid: itineraryId };

    // Find itinerary
    const itinerary = await Itinerary.findOne(query);
    
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

    // Apply version control
    updateFields.version = itinerary.version + 1;

    // Update itinerary
    const updatedItinerary = await Itinerary.findOneAndUpdate(
      query,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');

    return updatedItinerary;
  }
}

export default new ItineraryService(); 