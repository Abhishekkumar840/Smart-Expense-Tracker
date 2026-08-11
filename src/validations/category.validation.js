/**
 * backend/src/validations/category.validation.js
 *
 * Joi validation schemas for the Category module.
 * Mirrors expense.validation.js exactly in structure/conventions.
 * Consumed by the existing validate.middleware.js.
 */

const Joi = require('joi');

const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('Invalid ID format');

const hexColor = Joi.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/).message(
  'Color must be a valid hex code'
);

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(40).required(),
  type: Joi.string().valid('expense', 'income').required(),
  icon: Joi.string().trim().max(50),
  color: hexColor,
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(40),
  type: Joi.string().valid('expense', 'income'),
  icon: Joi.string().trim().max(50),
  color: hexColor,
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided to update' });

const categoryIdParamSchema = Joi.object({
  id: objectId.required(),
});

const categoryQuerySchema = Joi.object({
  type: Joi.string().valid('expense', 'income'),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryQuerySchema,
};
