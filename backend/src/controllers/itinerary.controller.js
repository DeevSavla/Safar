import itineraryService from '../services/itinerary/itinerary.service.js';
import dayService from '../services/itinerary/day.service.js';
import { ApiResponse } from '../middleware/apiResponse.js';
import { ApiError } from '../middleware/errorHandler.js';
import { Itinerary } from '../models/index.js';
import axios from 'axios';
import { cleanAndParseItineraryResponse } from '../utils/ai-helpers.js';
import { generateBasicSuggestions } from '../utils/suggestion-generator.js';

/**
 * ItineraryController - Handles itinerary-related API endpoints
 */
class ItineraryController {
  /**
   * Create a new itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async createItinerary(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryData = req.body;
      
      const itinerary = await itineraryService.createItinerary(userId, itineraryData);
      
      ApiResponse.success(res, 201, 'Itinerary created successfully', { itinerary });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get all itineraries for a user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getItineraries(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await itineraryService.getItineraries(userId, req.query);
      
      ApiResponse.success(res, 200, 'Itineraries retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get itinerary by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getItineraryById(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      
      const itinerary = await itineraryService.getItineraryById(itineraryId, userId);
      
      ApiResponse.success(res, 200, 'Itinerary retrieved successfully', { itinerary });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async updateItinerary(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const updateData = req.body;
      
      const itinerary = await itineraryService.updateItinerary(itineraryId, updateData, userId);
      
      ApiResponse.success(res, 200, 'Itinerary updated successfully', { itinerary });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async deleteItinerary(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      
      await itineraryService.deleteItinerary(itineraryId, userId);
      
      ApiResponse.success(res, 200, 'Itinerary deleted successfully');
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Add collaborator to itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async addCollaborator(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const { email, role } = req.body;
      
      if (!email || !role) {
        throw ApiError.badRequest('Email and role are required');
      }
      
      const itinerary = await itineraryService.addCollaborator(itineraryId, email, role, userId);
      
      ApiResponse.success(res, 200, 'Collaborator added successfully', { itinerary });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Remove collaborator from itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async removeCollaborator(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const collaboratorId = req.params.collaboratorId;
      
      const itinerary = await itineraryService.removeCollaborator(itineraryId, collaboratorId, userId);
      
      ApiResponse.success(res, 200, 'Collaborator removed successfully', { itinerary });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get day by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getDayById(req, res, next) {
    try {
      const userId = req.user.id;
      const dayId = req.params.dayId;
      
      const day = await dayService.getDayById(dayId, userId);
      
      ApiResponse.success(res, 200, 'Day retrieved successfully', { day });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update day
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async updateDay(req, res, next) {
    try {
      const userId = req.user.id;
      const dayId = req.params.dayId;
      const updateData = req.body;
      
      const day = await dayService.updateDay(dayId, updateData, userId);
      
      ApiResponse.success(res, 200, 'Day updated successfully', { day });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Add activity to day
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async addActivity(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const dayId = req.params.dayId;
      const activityData = req.body;
      
      // Validate required fields
      if (!activityData.title) {
        throw ApiError.badRequest('Activity title is required');
      }
      
      // Create the activity
      const activity = await dayService.createActivity(dayId, activityData, userId);
      
      ApiResponse.success(res, 201, 'Activity added successfully', { activity });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update activity
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async updateActivity(req, res, next) {
    try {
      const userId = req.user.id;
      const activityId = req.params.activityId;
      const updateData = req.body;
      
      const activity = await dayService.updateActivity(activityId, updateData, userId);
      
      ApiResponse.success(res, 200, 'Activity updated successfully', { activity });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete activity
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async deleteActivity(req, res, next) {
    try {
      const userId = req.user.id;
      const activityId = req.params.activityId;
      
      await dayService.deleteActivity(activityId, userId);
      
      ApiResponse.success(res, 200, 'Activity deleted successfully');
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Reorder activities for a day
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async reorderActivities(req, res, next) {
    try {
      const userId = req.user.id;
      const dayId = req.params.dayId;
      const { activityIds } = req.body;
      
      if (!activityIds || !Array.isArray(activityIds)) {
        throw ApiError.badRequest('Activity IDs array is required');
      }
      
      const day = await dayService.reorderActivities(dayId, activityIds, userId);
      
      ApiResponse.success(res, 200, 'Activities reordered successfully', { day });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all public itineraries with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPublicItineraries(req, res) {
    try {
      // Debug authentication information
      console.log('Auth debug info:');
      console.log('- Request user:', req.user);
      console.log('- Request headers:', req.headers);
      console.log('- Request cookies:', req.cookies);
      
      // At this point, the user is authenticated thanks to the middleware
      // If we got here, req.user should exist
      if (!req.user || !req.user.id) {
        console.log('Authentication failed: No user or user.id in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = '' } = req.query;
      
      const query = {};
      if (search) {
        query.search = search;
      }
      
      const result = await itineraryService.getPublicItineraries({
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        ...query
      });
      
      return res.status(200).json({
        success: true,
        message: 'Public itineraries retrieved successfully',
        data: result.itineraries,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit: result.limit
        }
      });
    } catch (error) {
      console.error('Error retrieving public itineraries:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve public itineraries'
      });
    }
  }

  /**
   * Request to join an itinerary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async requestToJoin(req, res) {
    try {
      const { itineraryId } = req.params;
      const userId = req.user.id;
      
      await itineraryService.requestToJoinItinerary(itineraryId, userId);
      
      return res.status(200).json({
        success: true,
        message: 'Join request sent successfully'
      });
    } catch (error) {
      console.error('Error requesting to join itinerary:', error);
      
      if (error.message.includes('already')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('private') || error.message.includes('joinable')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send join request'
      });
    }
  }

  /**
   * Process (approve/reject) a join request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processJoinRequest(req, res) {
    try {
      const { itineraryId, requesterId } = req.params;
      const { action } = req.body; // 'approve' or 'reject'
      const ownerId = req.user.id;
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be either "approve" or "reject"'
        });
      }
      
      await itineraryService.processJoinRequest(itineraryId, requesterId, action, ownerId);
      
      return res.status(200).json({
        success: true,
        message: `Join request ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      });
    } catch (error) {
      console.error('Error processing join request:', error);
      
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to process join request'
      });
    }
  }

  /**
   * Get join requests for an itinerary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getJoinRequests(req, res) {
    try {
      const { itineraryId } = req.params;
      const ownerId = req.user.id;
      
      // Get join requests from the service
      const joinRequests = await itineraryService.getJoinRequests(itineraryId, ownerId);
      
      // Get the itinerary to check its publiclyJoinable status
      const itinerary = await Itinerary.findById(itineraryId);
      
      return res.status(200).json({
        success: true,
        message: 'Join requests retrieved successfully',
        data: {
          joinRequests,
          publiclyJoinable: itinerary ? itinerary.publiclyJoinable : false
        }
      });
    } catch (error) {
      console.error('Error retrieving join requests:', error);
      
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve join requests'
      });
    }
  }

  /**
   * Toggle public join setting for an itinerary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async togglePublicJoinSetting(req, res) {
    try {
      const { itineraryId } = req.params;
      const { publiclyJoinable } = req.body;
      const ownerId = req.user.id;
      
      if (typeof publiclyJoinable !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'publiclyJoinable must be a boolean value'
        });
      }
      
      const updatedItinerary = await itineraryService.togglePublicJoinSetting(
        itineraryId,
        publiclyJoinable,
        ownerId
      );
      
      return res.status(200).json({
        success: true,
        message: `Public join setting ${publiclyJoinable ? 'enabled' : 'disabled'} successfully`,
        data: updatedItinerary
      });
    } catch (error) {
      console.error('Error toggling public join setting:', error);
      
      if (error.message.includes('private itinerary')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle public join setting'
      });
    }
  }

  /**
   * Process AI generated itinerary data and create days
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async processAiItinerary(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const aiItineraryData = req.body.itineraryData;
      
      if (!aiItineraryData) {
        throw ApiError.badRequest('Itinerary data is required');
      }
      
      const result = await itineraryService.processAiGeneratedItinerary(itineraryId, aiItineraryData, userId);
      
      ApiResponse.success(res, 200, 'AI itinerary processed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Edit itinerary with AI
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async editItineraryWithAI(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const { message } = req.body;
      
      if (!message) {
        throw ApiError.badRequest('Message is required');
      }
      
      // Get the current itinerary
      const itinerary = await itineraryService.getItineraryById(itineraryId, userId);
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Generate a session ID for the AI conversation
      const session_id = `itinerary_${itineraryId}_${Date.now()}`;
      
      // Call the AI service
      const aiResponse = await axios.post('http://localhost:8000/api/ai/edit-itinerary', {
        session_id,
        current_itinerary: itinerary,
        message
      });
      
      // Parse and clean the AI response
      try {
        const parsedResponse = cleanAndParseItineraryResponse(aiResponse.data);
        
        // Update the itinerary with the AI response
        const updatedItinerary = await itineraryService.updateItinerary(
          itineraryId, 
          parsedResponse.itinerary, 
          userId
        );
        
        ApiResponse.success(res, 200, 'Itinerary updated successfully with AI', { 
          itinerary: updatedItinerary,
          ai_message: parsedResponse.message 
        });
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw ApiError.badRequest('Failed to parse AI response');
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Renumber days in chronological order
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async renumberDays(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      
      const days = await dayService.renumberDaysChronologically(itineraryId, userId);
      
      ApiResponse.success(res, 200, 'Days renumbered successfully', { days });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update itinerary budget
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async updateBudget(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      const { total, currency } = req.body;
      
      if (!total && !currency) {
        throw ApiError.badRequest('At least one budget field (total or currency) is required');
      }
      
      // Get the current itinerary
      const itinerary = await itineraryService.getItineraryById(itineraryId, userId);
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Create budget update data
      const budgetUpdate = {};
      if (total !== undefined) budgetUpdate['budget.total'] = total;
      if (currency) budgetUpdate['budget.currency'] = currency;
      
      // Update the itinerary budget
      const updatedItinerary = await itineraryService.updateItineraryFields(
        itineraryId, 
        budgetUpdate, 
        userId
      );
      
      ApiResponse.success(res, 200, 'Budget updated successfully', { 
        itinerary: updatedItinerary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear all activities for a day
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async clearDayActivities(req, res, next) {
    try {
      const userId = req.user.id;
      const dayId = req.params.dayId;
      
      await dayService.clearDayActivities(dayId, userId);
      
      ApiResponse.success(res, 200, 'Day activities cleared successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get itinerary suggestions
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getItinerarySuggestions(req, res, next) {
    try {
      const userId = req.user.id;
      const itineraryId = req.params.id;
      
      // Get the full itinerary with populated days and activities
      const itinerary = await itineraryService.getItineraryById(itineraryId, userId, {
        populateDays: true,
        populateActivities: true
      });
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Check if we already have suggestions
      let suggestions = itinerary.additionalSuggestions;
      
      // If no suggestions exist or force refresh is requested, get new ones from AI
      if (!suggestions || Object.keys(suggestions || {}).length === 0 || req.query.refresh === 'true') {
        try {
          console.log('Generating new suggestions from AI service...');
          
          // Generate a session ID for the AI conversation
          const session_id = `itinerary_suggestions_${itineraryId}_${Date.now()}`;
          
          // Call the AI service to generate suggestions
          const aiResponse = await axios.post('http://localhost:8000/api/ai/generate-suggestions', {
            session_id,
            itinerary: itinerary
          });
          
          if (aiResponse.data && aiResponse.data.suggestions) {
            suggestions = aiResponse.data.suggestions;
            
            // Store the suggestions in the itinerary for future use
            itinerary.additionalSuggestions = suggestions;
            await itinerary.save();
            
            console.log('New suggestions generated and saved to itinerary');
          }
        } catch (aiError) {
          console.error('Error generating suggestions from AI:', aiError);
          
          // If AI call fails, use fallback suggestion generator
          console.log('Using fallback suggestion generator...');
          suggestions = generateBasicSuggestions(itinerary);
          
          // Store the fallback suggestions in the itinerary
          itinerary.additionalSuggestions = suggestions;
          await itinerary.save();
          
          console.log('Fallback suggestions generated and saved to itinerary');
        }
      }
      
      ApiResponse.success(res, 200, 'Suggestions retrieved successfully', { suggestions: suggestions || {} });
    } catch (error) {
      next(error);
    }
  }
}

export default new ItineraryController(); 