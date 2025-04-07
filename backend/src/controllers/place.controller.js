import placeService from '../services/location/place.service.js';
import googlePlacesService from '../services/location/google-places.service.js';
import { ApiResponse } from '../middleware/apiResponse.js';

/**
 * PlaceController - Handles place-related API endpoints
 */
class PlaceController {
  /**
   * Search for places by query string
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async searchPlaces(req, res, next) {
    try {
      const { query, limit, page, useExternal } = req.query;
      
      // If useExternal is true, use Google Places API
      if (useExternal === 'true') {
        const places = await googlePlacesService.searchPlaces({
          query,
          location: req.query.lat && req.query.lng ? 
            [parseFloat(req.query.lat), parseFloat(req.query.lng)] : 
            undefined,
          radius: req.query.radius ? parseFloat(req.query.radius) : undefined
        });
        
        return ApiResponse.success(res, 200, 'Places retrieved from external API', { places });
      }
      
      // Otherwise use our database
      const result = await placeService.searchPlaces({
        query,
        limit,
        page
      });
      
      ApiResponse.success(res, 200, 'Places retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get place by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getPlaceById(req, res, next) {
    try {
      const placeId = req.params.id;
      const useExternal = req.query.useExternal === 'true';
      
      // If useExternal is true, use Google Places API for detailed info
      if (useExternal) {
        const place = await googlePlacesService.getPlaceDetails(placeId);
        return ApiResponse.success(res, 200, 'Place details retrieved from external API', { place });
      }
      
      const place = await placeService.getPlaceById(placeId);
      
      ApiResponse.success(res, 200, 'Place retrieved successfully', { place });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Search for places near a specific location
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async searchNearby(req, res, next) {
    try {
      const { lat, lng, radius, type, limit, useExternal } = req.query;
      
      if (!lat || !lng) {
        return ApiResponse.badRequest(res, 'Latitude and longitude are required');
      }
      
      // If useExternal is true, use Google Places API
      if (useExternal === 'true') {
        const places = await googlePlacesService.searchPlaces({
          query: type || 'places',
          location: [parseFloat(lat), parseFloat(lng)],
          radius: radius ? parseFloat(radius) : undefined
        });
        
        return ApiResponse.success(res, 200, 'Nearby places retrieved from external API', { places });
      }
      
      const places = await placeService.searchNearby({
        coordinates: [parseFloat(lng), parseFloat(lat)],
        radius: radius ? parseFloat(radius) : undefined,
        type,
        limit: limit ? parseInt(limit) : undefined
      });
      
      ApiResponse.success(res, 200, 'Nearby places retrieved successfully', { places });
    } catch (error) {
      next(error);
    }
  }
}

export default new PlaceController(); 