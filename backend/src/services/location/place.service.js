import { Place } from '../../models/place.model.js';
import { ApiError } from '../../middleware/errorHandler.js';

class PlaceService {
  /**
   * Search for places by query
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {number} [params.limit=10] - Maximum number of results
   * @param {number} [params.page=1] - Page number
   * @returns {Promise<Object>} - Search results with pagination info
   */
  async searchPlaces(params) {
    try {
      const { query, limit = 10, page = 1 } = params;
      
      if (!query || query.trim().length < 2) {
        throw ApiError.badRequest('Search query must be at least 2 characters');
      }
      
      const skip = (page - 1) * limit;
      
      // Create a text search query
      const searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { 'address': { $regex: query, $options: 'i' } },
          { 'city': { $regex: query, $options: 'i' } },
          { 'country': { $regex: query, $options: 'i' } }
        ]
      };
      
      // Execute query with pagination
      const places = await Place.find(searchQuery)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // Get total count for pagination
      const total = await Place.countDocuments(searchQuery);
      
      return {
        places,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get place by ID
   * @param {string} placeId - Place ID
   * @returns {Promise<Object>} - Place details
   */
  async getPlaceById(placeId) {
    try {
      const place = await Place.findOne({ uuid: placeId }).lean();
      
      if (!place) {
        throw ApiError.notFound('Place not found');
      }
      
      return place;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Search places near a specific location
   * @param {Object} params - Search parameters
   * @param {Array<number>} params.coordinates - [longitude, latitude]
   * @param {number} [params.radius=5000] - Search radius in meters
   * @param {string} [params.type] - Place type to filter by
   * @param {number} [params.limit=10] - Maximum number of results
   * @returns {Promise<Array>} - Array of places
   */
  async searchNearby(params) {
    try {
      const { 
        coordinates, 
        radius = 5000, 
        type,
        limit = 10
      } = params;
      
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        throw ApiError.badRequest('Valid coordinates are required [longitude, latitude]');
      }
      
      const [longitude, latitude] = coordinates;
      
      // Create a geospatial query
      const geoQuery = {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radius
          }
        }
      };
      
      // Add type filter if provided
      if (type) {
        geoQuery.types = { $in: [type] };
      }
      
      // Execute query
      const places = await Place.find(geoQuery)
        .limit(limit)
        .lean();
      
      return places;
    } catch (error) {
      throw error;
    }
  }
}

export default new PlaceService(); 