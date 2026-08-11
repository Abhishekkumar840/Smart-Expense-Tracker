/**
 * backend/src/routes/dashboard.routes.js
 */

const express = require('express');
const router = express.Router();

const {
  getDashboardOverview,
  getRecentTransactions,
  getExpenseByCategory,
  getMonthlyAnalytics,
} = require('../controllers/dashboard.controller');

const { authenticate } = require('../middlewares/auth.middleware');

// All dashboard routes require authentication
router.use(authenticate);

router.get('/overview', getDashboardOverview);
router.get('/recent-transactions', getRecentTransactions);
router.get('/expense-by-category', getExpenseByCategory);
router.get('/monthly-analytics', getMonthlyAnalytics);

module.exports = router;
