import { Itinerary } from '../../models/itinerary.model.js';
import { Day } from '../../models/day.model.js';
import { Activity } from '../../models/activity.model.js';
import { ApiError } from '../../middleware/errorHandler.js';

class CostService {
  /**
   * Calculate total cost for an itinerary
   * @param {string} itineraryId - ID of the itinerary
   * @returns {Promise<Object>} - Cost breakdown
   */
  async calculateItineraryCost(itineraryId) {
    try {
      // Get the itinerary
      const itinerary = await Itinerary.findById(itineraryId);
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Get all days for the itinerary
      const days = await Day.find({ itinerary: itineraryId });
      
      // Initialize cost categories
      const categories = {
        accommodation: 0,
        food: 0,
        transport: 0,
        attraction: 0,
        other: 0
      };
      
      let totalCost = 0;
      
      // Gather all activity IDs from all days
      const activityIds = days.reduce((ids, day) => {
        return [...ids, ...day.activities];
      }, []);
      
      // Get all activities
      const activities = await Activity.find({ _id: { $in: activityIds } });
      
      // Calculate costs by category
      activities.forEach(activity => {
        const cost = activity.cost.amount || 0;
        
        // Add to the appropriate category
        if (categories[activity.type] !== undefined) {
          categories[activity.type] += cost;
        } else {
          categories.other += cost;
        }
        
        totalCost += cost;
      });
      
      // Update the itinerary with the calculated costs
      itinerary.budget.spent = totalCost;
      itinerary.budget.categories = categories;
      await itinerary.save();
      
      return {
        total: totalCost,
        categories,
        currency: itinerary.budget.currency
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate daily cost for an itinerary
   * @param {string} itineraryId - ID of the itinerary
   * @returns {Promise<Array>} - Daily cost breakdown
   */
  async calculateDailyCosts(itineraryId) {
    try {
      // Get all days for the itinerary with populated activities
      const days = await Day.find({ itinerary: itineraryId })
        .populate('activities')
        .sort('date');
      
      if (!days.length) {
        throw ApiError.notFound('No days found for this itinerary');
      }
      
      const dailyCosts = [];
      
      // Calculate cost for each day
      for (const day of days) {
        let dailyTotal = 0;
        const dailyCategories = {
          accommodation: 0,
          food: 0,
          transport: 0,
          attraction: 0,
          other: 0
        };
        
        // Add costs by category
        for (const activity of day.activities) {
          const cost = activity.cost?.amount || 0;
          
          if (dailyCategories[activity.type] !== undefined) {
            dailyCategories[activity.type] += cost;
          } else {
            dailyCategories.other += cost;
          }
          
          dailyTotal += cost;
        }
        
        dailyCosts.push({
          date: day.date,
          dayNumber: days.indexOf(day) + 1,
          total: dailyTotal,
          categories: dailyCategories
        });
      }
      
      return dailyCosts;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate budget status for an itinerary
   * @param {string} itineraryId - ID of the itinerary
   * @returns {Promise<Object>} - Budget status
   */
  async getBudgetStatus(itineraryId) {
    try {
      const itinerary = await Itinerary.findById(itineraryId);
      
      if (!itinerary) {
        throw ApiError.notFound('Itinerary not found');
      }
      
      // Calculate current costs
      const costs = await this.calculateItineraryCost(itineraryId);
      
      const totalBudget = itinerary.budget.total || 0;
      const totalSpent = costs.total;
      const remaining = totalBudget - totalSpent;
      const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      
      return {
        budget: totalBudget,
        spent: totalSpent,
        remaining,
        percentUsed,
        isOverBudget: remaining < 0,
        currency: itinerary.budget.currency,
        categories: costs.categories
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new CostService(); 