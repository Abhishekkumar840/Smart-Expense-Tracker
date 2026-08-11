/**
 * backend/src/middlewares/validate.middleware.js
 *
 * Generic Joi validation middleware.
 * Usage: validate(schema, 'body' | 'params' | 'query')
 *
 * ASSUMPTION: utils/ApiError.js exports a class with signature
 *   new ApiError(statusCode, message, errors = [])
 * If your ApiError constructor differs, only the throw below needs adjusting.
 */

const ApiError = require('../utils/ApiError');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return next(new ApiError(400, 'Validation failed', errors));
    }

    req[source] = value;
    return next();
  };
};

module.exports = validate;
