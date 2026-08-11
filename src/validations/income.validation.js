/**
 * backend/src/validations/income.validation.js
 *
 * Joi validation schemas for the Income module.
 * Consumed by middlewares/validate.middleware.js
 */

const Joi = require('joi');

const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('Invalid ID format');

const createIncomeSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  amount: Joi.number().positive().precision(2).required(),
  category: objectId.required(),
  date: Joi.date().max('now').required(),
  source: Joi.string()
    .valid('salary', 'business', 'investment', 'freelance', 'gift', 'other')
    .default('other'),
  description: Joi.string().trim().max(500).allow('', null),
  tags: Joi.array().items(Joi.string().trim().max(30)).default([]),
  isRecurring: Joi.boolean().default(false),
});

const updateIncomeSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100),
  amount: Joi.number().positive().precision(2),
  category: objectId,
  date: Joi.date().max('now'),
  source: Joi.string().valid(
    'salary',
    'business',
    'investment',
    'freelance',
    'gift',
    'other'
  ),
  description: Joi.string().trim().max(500).allow('', null),
  tags: Joi.array().items(Joi.string().trim().max(30)),
  isRecurring: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided to update' });

const incomeIdParamSchema = Joi.object({
  id: objectId.required(),
});

const incomeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow('', null),
  category: objectId,
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref('startDate')),
  minAmount: Joi.number().min(0),
  maxAmount: Joi.number().min(Joi.ref('minAmount')),
  sortBy: Joi.string().valid('amount', 'date', 'createdAt').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = {
  createIncomeSchema,
  updateIncomeSchema,
  incomeIdParamSchema,
  incomeQuerySchema,
};
