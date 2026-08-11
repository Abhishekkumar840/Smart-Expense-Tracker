/**
 * backend/src/validations/budget.validation.js
 *
 * Joi validation schemas for the Budget module.
 * Mirrors income.validation.js exactly in structure/conventions,
 * adjusted for Budget.model.js's actual fields.
 * Consumed by the existing validate.middleware.js.
 */

const Joi = require('joi');

const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('Invalid ID format');

const createBudgetSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  amount: Joi.number().positive().precision(2).required(),
  category: objectId.required(),
  currency: Joi.string().trim().length(3).uppercase(),
  period: Joi.string().valid('weekly', 'monthly', 'yearly', 'custom').default('monthly'),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  alertThreshold: Joi.number().min(0).max(100).default(80),
  notes: Joi.string().trim().max(500).allow('', null),
});

const updateBudgetSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100),
  amount: Joi.number().positive().precision(2),
  category: objectId,
  currency: Joi.string().trim().length(3).uppercase(),
  period: Joi.string().valid('weekly', 'monthly', 'yearly', 'custom'),
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref('startDate')),
  alertThreshold: Joi.number().min(0).max(100),
  notes: Joi.string().trim().max(500).allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided to update' });

const budgetIdParamSchema = Joi.object({
  id: objectId.required(),
});

const budgetQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow('', null),
  category: objectId,
  period: Joi.string().valid('weekly', 'monthly', 'yearly', 'custom'),
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref('startDate')),
  sortBy: Joi.string().valid('amount', 'startDate', 'endDate', 'createdAt').default('startDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = {
  createBudgetSchema,
  updateBudgetSchema,
  budgetIdParamSchema,
  budgetQuerySchema,
};
