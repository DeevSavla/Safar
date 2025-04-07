import costService from '../services/itinerary/cost.service.js';
import { ApiResponse } from '../middleware/apiResponse.js';

/**
 * CostController - Handles cost-related API endpoints
 */
class CostController {
  /**
   * Calculate total costs for an itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async calculateItineraryCost(req, res, next) {
    try {
      const itineraryId = req.params.itineraryId;
      
      const cost = await costService.calculateItineraryCost(itineraryId);
      
      ApiResponse.success(res, 200, 'Itinerary costs calculated successfully', { cost });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Calculate daily costs for an itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async calculateDailyCosts(req, res, next) {
    try {
      const itineraryId = req.params.itineraryId;
      
      const dailyCosts = await costService.calculateDailyCosts(itineraryId);
      
      ApiResponse.success(res, 200, 'Daily costs calculated successfully', { dailyCosts });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get budget status for an itinerary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getBudgetStatus(req, res, next) {
    try {
      const itineraryId = req.params.itineraryId;
      
      const budgetStatus = await costService.getBudgetStatus(itineraryId);
      
      ApiResponse.success(res, 200, 'Budget status retrieved successfully', { budgetStatus });
    } catch (error) {
      next(error);
    }
  }
}

export default new CostController(); 