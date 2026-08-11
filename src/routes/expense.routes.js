/**
 * backend/src/routes/expense.routes.js
 *
 * ASSUMPTIONS:
 *  - middlewares/auth.middleware.js exports `protect`
 *  - middlewares/validate.middleware.js exports a factory:
 *      (schema, source = 'body') => (req, res, next) => {...}
 *    matching the pattern used for auth.validation.js in Module 5.
 *    If your middleware is named/shaped differently, only the two
 *    require() lines below need updating.
 */

const express = require('express');
const router = express.Router();

const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');

const {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
  expenseQuerySchema,
} = require('../validations/expense.validation');

const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

// All expense routes require authentication
router.use(authenticate);

router
  .route('/')
  .post(validate(createExpenseSchema, 'body'), createExpense)
  .get(validate(expenseQuerySchema, 'query'), getAllExpenses);

// Explicit search endpoint (mirrors GET / with ?search=) for readability/back-compat
router.get(
  '/search',
  validate(expenseQuerySchema, 'query'),
  getAllExpenses
);

router
  .route('/:id')
  .get(validate(expenseIdParamSchema, 'params'), getExpenseById)
  .put(
    validate(expenseIdParamSchema, 'params'),
    validate(updateExpenseSchema, 'body'),
    updateExpense
  )
  .delete(validate(expenseIdParamSchema, 'params'), deleteExpense);

module.exports = router;
