import Joi from 'joi';

export const templateValidationSchemas = {
  /**
   * Validation schema for creating an itinerary from a template
   */
  createFromTemplate: Joi.object({
    templateId: Joi.string().required().messages({
      'any.required': 'Template ID is required',
      'string.empty': 'Template ID cannot be empty'
    }),
    destination: Joi.string().required().messages({
      'any.required': 'Destination name is required',
      'string.empty': 'Destination name cannot be empty'
    }),
    location: Joi.object({
      latitude: Joi.number().required().min(-90).max(90).messages({
        'any.required': 'Latitude is required',
        'number.base': 'Latitude must be a number',
        'number.min': 'Latitude must be between -90 and 90',
        'number.max': 'Latitude must be between -90 and 90'
      }),
      longitude: Joi.number().required().min(-180).max(180).messages({
        'any.required': 'Longitude is required',
        'number.base': 'Longitude must be a number',
        'number.min': 'Longitude must be between -180 and 180',
        'number.max': 'Longitude must be between -180 and 180'
      })
    }).required().messages({
      'any.required': 'Location is required'
    }),
    startDate: Joi.date().iso().required().messages({
      'any.required': 'Start date is required',
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),
    country: Joi.string().optional(),
    currency: Joi.string().optional().default('USD'),
    budget: Joi.number().optional().min(0).default(0).messages({
      'number.base': 'Budget must be a number',
      'number.min': 'Budget cannot be negative'
    })
  })
}; 