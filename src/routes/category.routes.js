/**
 * backend/src/routes/category.routes.js
 *
 * Updated to wire the Joi validate.middleware.js, mirroring
 * expense.routes.js exactly — same middleware chain pattern:
 * routes → validate.middleware.js (Joi) → controller.
 */

const express = require('express');
const router = express.Router();

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');

const {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
  categoryQuerySchema,
} = require('../validations/category.validation');

const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

// All category routes require authentication
router.use(authenticate);

router
  .route('/')
  .post(validate(createCategorySchema, 'body'), createCategory)
  .get(validate(categoryQuerySchema, 'query'), getAllCategories);

router
  .route('/:id')
  .get(validate(categoryIdParamSchema, 'params'), getCategoryById)
  .put(
    validate(categoryIdParamSchema, 'params'),
    validate(updateCategorySchema, 'body'),
    updateCategory
  )
  .delete(validate(categoryIdParamSchema, 'params'), deleteCategory);

module.exports = router;
