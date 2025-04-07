/**
 * Create a custom API error
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} errors - Additional error details
 * @returns {Error} Error object with additional fields
 */
export const createApiError = (message, statusCode, errors = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errors = errors;
  error.isOperational = true;
  Error.captureStackTrace(error, createApiError);
  return error;
};

/**
 * ApiError - Utility for creating standardized API errors
 */
export const ApiError = {
  /**
   * Create a 400 Bad Request error
   * @param {String|Object} message - Error message or error object
   * @returns {Error} Error object
   */
  badRequest: (message) => {
    if (typeof message === 'string') {
      return createApiError(message, 400);
    }
    return createApiError('Bad Request', 400, message);
  },

  /**
   * Create a 401 Unauthorized error
   * @param {String} message - Error message
   * @returns {Error} Error object
   */
  unauthorized: (message = 'Unauthorized - Authentication required') => {
    return createApiError(message, 401);
  },

  /**
   * Create a 403 Forbidden error
   * @param {String} message - Error message
   * @returns {Error} Error object
   */
  forbidden: (message = 'Forbidden - Insufficient permissions') => {
    return createApiError(message, 403);
  },

  /**
   * Create a 404 Not Found error
   * @param {String} message - Error message
   * @returns {Error} Error object
   */
  notFound: (message = 'Resource not found') => {
    return createApiError(message, 404);
  },

  /**
   * Create a 409 Conflict error
   * @param {String} message - Error message
   * @returns {Error} Error object
   */
  conflict: (message = 'Resource conflict') => {
    return createApiError(message, 409);
  },

  /**
   * Create a 422 Unprocessable Entity error
   * @param {String} message - Error message
   * @returns {Error} Error object
   */
  unprocessableEntity: (message = 'Unprocessable entity') => {
    return createApiError(message, 422);
  },

  /**
   * Create a 500 Internal Server Error
   * @param {String} message - Error message
   * @returns {Error} Error object
   */
  internal: (message = 'Internal server error') => {
    return createApiError(message, 500);
  }
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Set default status code and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || null;

  // Log errors
  console.error(`[ERROR] ${req.method} ${req.path}:`, {
    statusCode,
    message,
    errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value error';
    const field = Object.keys(err.keyValue)[0];
    errors = {
      [field]: `${field} already exists`
    };
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Send response
  res.status(statusCode).json({
    status: 'error',
    message,
    errors,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Handle 404 errors for undefined routes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(`Route not found: ${req.originalUrl}`);
  next(error);
}; 