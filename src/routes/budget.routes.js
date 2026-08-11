/**
 * backend/src/routes/budget.routes.js
 *
 * Mirrors income.routes.js / expense.routes.js exactly — same
 * middleware chain pattern: routes → validate.middleware.js (Joi) →
 * controller.
 */

const express = require('express');
const router = express.Router();

const {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} = require('../controllers/budget.controller');

const {
  createBudgetSchema,
  updateBudgetSchema,
  budgetIdParamSchema,
  budgetQuerySchema,
} = require('../validations/budget.validation');

const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

// All budget routes require authentication
router.use(authenticate);

router
  .route('/')
  .post(validate(createBudgetSchema, 'body'), createBudget)
  .get(validate(budgetQuerySchema, 'query'), getAllBudgets);

// Explicit search endpoint (mirrors GET / with ?search=) for readability/back-compat
router.get('/search', validate(budgetQuerySchema, 'query'), getAllBudgets);

router
  .route('/:id')
  .get(validate(budgetIdParamSchema, 'params'), getBudgetById)
  .put(
    validate(budgetIdParamSchema, 'params'),
    validate(updateBudgetSchema, 'body'),
    updateBudget
  )
  .delete(validate(budgetIdParamSchema, 'params'), deleteBudget);

module.exports = router;
