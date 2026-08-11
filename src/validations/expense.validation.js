/**
 * backend/src/validations/expense.validation.js
 *
 * Joi validation schemas for the Expense module.
 * Consumed by a generic `validate(schema, source)` middleware,
 * consistent with the pattern already used in Module 5 (auth.validation.js).
 *
 * ASSUMPTION: middlewares/validate.middleware.js exposes:
 *   module.exports = (schema, source = 'body') => (req, res, next) => {...}
 * If your existing implementation differs, only the middleware import
 * path in expense.routes.js needs to change — these schemas are framework-agnostic.
 */

const Joi = require('joi');

const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('Invalid ID format');

const createExpenseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  amount: Joi.number().positive().precision(2).required(),
  category: objectId.required(),
  date: Joi.date().max('now').required(),
  paymentMethod: Joi.string()
    .valid('cash', 'card', 'upi', 'bank_transfer', 'wallet', 'other')
    .default('other'),
  notes: Joi.string().trim().max(500).allow('', null),
  tags: Joi.array().items(Joi.string().trim().max(30)).default([]),
  isRecurring: Joi.boolean().default(false),
  receiptUrl: Joi.string().uri().allow('', null),
});

const updateExpenseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100),
  amount: Joi.number().positive().precision(2),
  category: objectId,
  date: Joi.date().max('now'),
  paymentMethod: Joi.string().valid(
    'cash',
    'card',
    'upi',
    'netbanking',
    'wallet',
    'other'
  ),
  notes: Joi.string().trim().max(500).allow('', null),
  tags: Joi.array().items(Joi.string().trim().max(30)),
  isRecurring: Joi.boolean(),
  receiptUrl: Joi.string().uri().allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided to update' });

const expenseIdParamSchema = Joi.object({
  id: objectId.required(),
});

const expenseQuerySchema = Joi.object({
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
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
  expenseQuerySchema,
};
