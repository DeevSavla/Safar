import { Itinerary } from '../../models/itinerary.model.js';
import { Day } from '../../models/day.model.js';
import { Activity } from '../../models/activity.model.js';
import { ApiError } from '../../middleware/errorHandler.js';

// Sample template data
const TEMPLATES = {
  weekend: {
    title: 'Weekend Getaway',
    description: 'A quick weekend trip to explore a new city',
    days: 2,
    activities: [
      {
        day: 0,
        title: 'Hotel Check-in',
        type: 'accommodation',
        timeRange: { startHour: 15, startMinute: 0, endHour: 16, endMinute: 0 }
      },
      {
        day: 0,
        title: 'City Exploration',
        type: 'attraction',
        timeRange: { startHour: 16, startMinute: 30, endHour: 18, endMinute: 30 }
      },
      {
        day: 0,
        title: 'Dinner',
        type: 'food',
        timeRange: { startHour: 19, startMinute: 0, endHour: 21, endMinute: 0 }
      },
      {
        day: 1,
        title: 'Breakfast',
        type: 'food',
        timeRange: { startHour: 8, startMinute: 0, endHour: 9, endMinute: 0 }
      },
      {
        day: 1,
        title: 'Museum Visit',
        type: 'attraction',
        timeRange: { startHour: 10, startMinute: 0, endHour: 12, endMinute: 30 }
      },
      {
        day: 1,
        title: 'Lunch',
        type: 'food',
        timeRange: { startHour: 13, startMinute: 0, endHour: 14, endMinute: 30 }
      },
      {
        day: 1,
        title: 'Shopping',
        type: 'attraction',
        timeRange: { startHour: 15, startMinute: 0, endHour: 17, endMinute: 0 }
      },
      {
        day: 1,
        title: 'Return Home',
        type: 'transport',
        timeRange: { startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 }
      }
    ]
  },
  weeklong: {
    title: 'Week-long Vacation',
    description: 'A comprehensive one-week trip to explore a destination',
    days: 7,
    activities: [
      {
        day: 0,
        title: 'Arrival & Hotel Check-in',
        type: 'accommodation',
        timeRange: { startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 }
      },
      {
        day: 0,
        title: 'Neighborhood Exploration',
        type: 'attraction',
        timeRange: { startHour: 16, startMinute: 30, endHour: 18, endMinute: 30 }
      },
      {
        day: 0,
        title: 'Welcome Dinner',
        type: 'food',
        timeRange: { startHour: 19, startMinute: 0, endHour: 21, endMinute: 0 }
      },
      // Day 1 activities
      {
        day: 1,
        title: 'Breakfast',
        type: 'food',
        timeRange: { startHour: 8, startMinute: 0, endHour: 9, endMinute: 0 }
      },
      {
        day: 1,
        title: 'City Tour',
        type: 'attraction',
        timeRange: { startHour: 10, startMinute: 0, endHour: 13, endMinute: 0 }
      },
      // More activities for days 2-6 would be defined similarly
      {
        day: 6,
        title: 'Breakfast',
        type: 'food',
        timeRange: { startHour: 8, startMinute: 0, endHour: 9, endMinute: 0 }
      },
      {
        day: 6,
        title: 'Souvenir Shopping',
        type: 'attraction',
        timeRange: { startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 }
      },
      {
        day: 6,
        title: 'Departure',
        type: 'transport',
        timeRange: { startHour: 15, startMinute: 0, endHour: 17, endMinute: 0 }
      }
    ]
  }
};

class TemplateService {
  /**
   * Get available templates
   * @returns {Array} - List of available templates
   */
  getAvailableTemplates() {
    return Object.keys(TEMPLATES).map(key => ({
      id: key,
      title: TEMPLATES[key].title,
      description: TEMPLATES[key].description,
      days: TEMPLATES[key].days
    }));
  }
  
  /**
   * Get template details
   * @param {string} templateId - Template ID
   * @returns {Object} - Template details
   */
  getTemplateDetails(templateId) {
    const template = TEMPLATES[templateId];
    
    if (!template) {
      throw ApiError.notFound('Template not found');
    }
    
    return template;
  }
  
  /**
   * Create an itinerary from a template
   * @param {string} userId - User ID
   * @param {Object} params - Parameters for the template
   * @param {string} params.templateId - ID of the template to use
   * @param {string} params.destination - Destination name
   * @param {Object} params.location - Destination coordinates
   * @param {string} params.startDate - Start date of the itinerary
   * @returns {Promise<Object>} - Created itinerary
   */
  async createFromTemplate(userId, params) {
    try {
      const { templateId, destination, location, startDate } = params;
      
      // Get the template
      const template = TEMPLATES[templateId];
      
      if (!template) {
        throw ApiError.notFound('Template not found');
      }
      
      // Create the itinerary
      const itinerary = new Itinerary({
        title: `${template.title} - ${destination}`,
        description: template.description,
        owner: userId,
        destination: {
          name: destination,
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude]
          },
          country: params.country || 'Not specified'
        },
        dateRange: {
          start: new Date(startDate),
          end: new Date(new Date(startDate).setDate(new Date(startDate).getDate() + template.days - 1))
        },
        days: [],
        budget: {
          currency: params.currency || 'USD',
          total: params.budget || 0,
          spent: 0
        }
      });
      
      await itinerary.save();
      
      // Create days and activities
      const startDateObj = new Date(startDate);
      const days = [];
      
      for (let i = 0; i < template.days; i++) {
        const dayDate = new Date(startDateObj);
        dayDate.setDate(dayDate.getDate() + i);
        
        // Create the day
        const day = new Day({
          date: dayDate,
          itinerary: itinerary._id,
          activities: []
        });
        
        await day.save();
        days.push(day);
        
        // Add day to itinerary
        itinerary.days.push(day._id);
      }
      
      await itinerary.save();
      
      // Create activities for each day
      for (const activityTemplate of template.activities) {
        const day = days[activityTemplate.day];
        
        if (!day) continue;
        
        const dayDate = new Date(day.date);
        
        // Create time ranges based on the template and day date
        const start = new Date(dayDate);
        start.setHours(activityTemplate.timeRange.startHour, activityTemplate.timeRange.startMinute, 0, 0);
        
        const end = new Date(dayDate);
        end.setHours(activityTemplate.timeRange.endHour, activityTemplate.timeRange.endMinute, 0, 0);
        
        // Create the activity
        const activity = new Activity({
          title: activityTemplate.title,
          type: activityTemplate.type,
          day: day._id,
          location: {
            name: 'To be determined',
            coordinates: {
              type: 'Point',
              coordinates: [0, 0] // Will be updated later
            }
          },
          timeRange: {
            start,
            end
          },
          cost: {
            amount: 0,
            currency: params.currency || 'USD'
          }
        });
        
        await activity.save();
        
        // Add activity to day
        day.activities.push(activity._id);
        await day.save();
      }
      
      // Return the created itinerary with populated days and activities
      return Itinerary.findById(itinerary._id)
        .populate({
          path: 'days',
          populate: {
            path: 'activities'
          }
        });
    } catch (error) {
      throw error;
    }
  }
}

export default new TemplateService(); 