// API error wrapper for consistent responses.
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 500...)
   * @param {string} message - Human-readable error message
   * @param {Array}  errors - Optional array of field-level validation errors
   * @param {string} stack - Optional explicit stack trace (used when wrapping another error)
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }
}

module.exports = ApiError;
