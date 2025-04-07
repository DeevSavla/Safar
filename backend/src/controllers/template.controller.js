import templateService from '../services/itinerary/template.service.js';
import { ApiResponse } from '../middleware/apiResponse.js';

/**
 * TemplateController - Handles template-related API endpoints
 */
class TemplateController {
  /**
   * Get all available templates
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getTemplates(req, res, next) {
    try {
      const templates = templateService.getAvailableTemplates();
      
      ApiResponse.success(res, 200, 'Templates retrieved successfully', { templates });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get template details
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async getTemplateDetails(req, res, next) {
    try {
      const templateId = req.params.id;
      
      const template = templateService.getTemplateDetails(templateId);
      
      ApiResponse.success(res, 200, 'Template details retrieved successfully', { template });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create itinerary from template
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async createFromTemplate(req, res, next) {
    try {
      const userId = req.user.id;
      const params = req.body;
      
      const itinerary = await templateService.createFromTemplate(userId, params);
      
      ApiResponse.success(res, 201, 'Itinerary created from template successfully', { itinerary });
    } catch (error) {
      next(error);
    }
  }
}

export default new TemplateController(); 