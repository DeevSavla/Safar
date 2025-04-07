import userValidators from './validators/user.validator.js';
import itineraryValidators from './validators/itinerary.validator.js';
import { templateValidationSchemas } from './validators/template.validator.js';
import { ApiError } from './errorHandler.js';

/**
 * Combines all validators into a single object
 */
const validators = {
  ...userValidators,
  ...itineraryValidators,
  ...templateValidationSchemas
};

/**
 * Validates request data against a schema
 * @param {String} schema - The schema name to validate against
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schema) => (req, res, next) => {
  // Check if schema exists
  if (!validators[schema]) {
    return next(ApiError.internal(`Validation schema '${schema}' not found`));
  }

  // Validate request body
  const { error, value } = validators[schema].validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    errors: {
      wrap: {
        label: false
      }
    }
  });

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(', ');
    return next(ApiError.badRequest(errorMessage));
  }

  // Replace request body with validated value
  req.body = value;
  next();
}; 