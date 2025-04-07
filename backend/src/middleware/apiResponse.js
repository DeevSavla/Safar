/**
 * ApiResponse - Utility for standardized API responses
 */
/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @returns {Object} Express response
 */
export const success = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send a success response with pagination
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Array} data - Data array
 * @param {Object} pagination - Pagination info
 * @returns {Object} Express response
 */
export const paginated = (res, statusCode = 200, message = 'Success', data = [], pagination = {}) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} errors - Error details
 * @returns {Object} Express response
 */
export const error = (res, statusCode = 500, message = 'Server Error', errors = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Create a namespace object for backwards compatibility
export const ApiResponse = {
  success,
  paginated,
  error
}; 