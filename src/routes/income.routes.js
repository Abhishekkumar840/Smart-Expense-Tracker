/**
 * backend/src/routes/income.routes.js
 *
 * Module 7 - Income Module
 */

const express = require('express');
const router = express.Router();

const {
  createIncome,
  getAllIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
} = require('../controllers/income.controller');

const {
  createIncomeSchema,
  updateIncomeSchema,
  incomeIdParamSchema,
  incomeQuerySchema,
} = require('../validations/income.validation');

const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

// All income routes require authentication
router.use(authenticate);

router
  .route('/')
  .post(validate(createIncomeSchema, 'body'), createIncome)
  .get(validate(incomeQuerySchema, 'query'), getAllIncomes);

router
  .route('/:id')
  .get(validate(incomeIdParamSchema, 'params'), getIncomeById)
  .put(
    validate(incomeIdParamSchema, 'params'),
    validate(updateIncomeSchema, 'body'),
    updateIncome
  )
  .delete(
    validate(incomeIdParamSchema, 'params'),
    deleteIncome
  );

module.exports = router;