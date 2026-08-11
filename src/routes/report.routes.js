/**
 * backend/src/routes/report.routes.js
 */

const express = require('express');
const router = express.Router();

const {
  getMonthlyReport,
  getYearlyReport,
  getExpenseSummary,
  getIncomeSummary,
  getCategorySummary,
  getBudgetSummary,
  generatePdfReport,
  exportCsvReport,
} = require('../controllers/report.controller');

const { authenticate } = require('../middlewares/auth.middleware');

// All report routes require authentication
router.use(authenticate);

router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);
router.get('/expense-summary', getExpenseSummary);
router.get('/income-summary', getIncomeSummary);
router.get('/category-summary', getCategorySummary);
router.get('/budget-summary', getBudgetSummary);
router.get('/pdf', generatePdfReport);
router.get('/csv', exportCsvReport);

module.exports = router;
