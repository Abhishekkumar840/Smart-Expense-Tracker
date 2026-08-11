/**
 * backend/src/controllers/report.controller.js
 *
 * Module 11 - Report Module
 *
 * ASSUMED existing service method signatures (per Module 4):
 *   analyticsService.getMonthlyReport(userId, { month, year })
 *   analyticsService.getYearlyReport(userId, { year })
 *   analyticsService.getExpenseSummary(userId, { startDate, endDate })
 *   analyticsService.getIncomeSummary(userId, { startDate, endDate })
 *   analyticsService.getCategorySummary(userId, { startDate, endDate })
 *   analyticsService.getBudgetSummary(userId, { startDate, endDate })
 *   PdfGenerator.generate(data, options) -> returns a Buffer
 *
 * If the real method names differ, only the calls below need renaming —
 * controller structure and response contract stay the same.
 *
 * CSV export is built inline below since no dedicated CSV service exists
 * yet in the project (avoids creating a duplicate service).
 */

const AnalyticsService = require('../services/AnalyticsService');
const PdfGenerator = require('../services/PdfGenerator');
const analyticsService = new AnalyticsService();
const pdfGenerator = new PdfGenerator();
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Helper: convert an array of plain transaction records to a CSV string.
 */
const toCsv = (rows) => {
  if (!rows || rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const cell = value === null || value === undefined ? '' : String(value);
    if (/[",\n]/.test(cell)) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const dataLines = rows.map((row) =>
    headers.map((key) => escapeCell(row[key])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
};

/**
 * @desc    Get monthly report (income, expense, balance, category breakdown)
 * @route   GET /api/v1/reports/monthly
 * @access  Private
 */
const getMonthlyReport = asyncHandler(async (req, res) => {
  const userId = req.userId || req.user?._id || req.user?.id;
  const { month, year } = req.query;

  if (!month || !year) {
    throw new ApiError(400, 'month and year query params are required');
  }

  const report = await analyticsService.getMonthlyReport(userId, {
    month: Number(month),
    year: Number(year),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, report, 'Monthly report fetched successfully'));
});

/**
 * @desc    Get yearly report (income, expense, balance, monthly trend)
 * @route   GET /api/v1/reports/yearly
 * @access  Private
 */
const getYearlyReport = asyncHandler(async (req, res) => {
  const userId = req.userId || req.user?._id || req.user?.id;
  const { year } = req.query;

  if (!year) {
    throw new ApiError(400, 'year query param is required');
  }

  const report = await analyticsService.getYearlyReport(userId, {
    year: Number(year),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, report, 'Yearly report fetched successfully'));
});

/**
 * @desc    Get expense summary for a date range
 * @route   GET /api/v1/reports/expense-summary
 * @access  Private
 */
const getExpenseSummary = asyncHandler(async (req, res) => {
  const userId = req.userId || req.user?._id || req.user?.id;
  const { startDate, endDate } = req.query;

  const summary = await analyticsService.getExpenseSummary(userId, {
    startDate,
    endDate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, summary, 'Expense summary fetched successfully'));
});

/**
 * @desc    Get income summary for a date range
 * @route   GET /api/v1/reports/income-summary
 * @access  Private
 */
const getIncomeSummary = asyncHandler(async (req, res) => {
  const userId = req.userId || req.user?._id || req.user?.id;
  const { startDate, endDate } = req.query;

  const summary = await analyticsService.getIncomeSummary(userId, {
    startDate,
    endDate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, summary, 'Income summary fetched successfully'));
});

/**
 * @desc    Get category-wise summary for a date range
 * @route   GET /api/v1/reports/category-summary
 * @access  Private
 */
const getCategorySummary = asyncHandler(async (req, res) => {
  const userId = req.userId || req.user?._id || req.user?.id;
  const { startDate, endDate } = req.query;

  const summary = await analyticsService.getCategorySummary(userId, {
    startDate,
    endDate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, summary, 'Category summary fetched successfully'));
});

/**
 * @desc    Get budget summary (allocated vs spent) for a date range
 * @route   GET /api/v1/reports/budget-summary
 * @access  Private
 */
const getBudgetSummary = asyncHandler(async (req, res) => {
  const userId = req.userId || req.user?._id || req.user?.id;
  const { startDate, endDate } = req.query;

  const summary = await analyticsService.getBudgetSummary(userId, {
    startDate,
    endDate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, summary, 'Budget summary fetched successfully'));
});

/**
 * @desc    Generate and download a PDF report for a date range
 * @route   GET /api/v1/reports/pdf
 * @access  Private
 */
const generatePdfReport = asyncHandler(async (req, res) => {
  const userId = req.userId || req.user?._id || req.user?.id;
  const { startDate, endDate, year, month } = req.query;

  const reportData = month && year
    ? await analyticsService.getMonthlyReport(userId, {
        month: Number(month),
        year: Number(year),
      })
    : year
    ? await analyticsService.getYearlyReport(userId, { year: Number(year) })
    : await analyticsService.getExpenseSummary(userId, { startDate, endDate });

  const pdfBuffer = await pdfGenerator.generateExpenseReportPdf(reportData);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="report-${Date.now()}.pdf"`
  );

  return res.status(200).send(pdfBuffer);
});

/**
 * @desc    Export transactions (income + expense) as CSV for a date range
 * @route   GET /api/v1/reports/csv
 * @access  Private
 */
const exportCsvReport = asyncHandler(async (req, res) => {
  const userId = req.userId || req.user?._id || req.user?.id;
  const { startDate, endDate } = req.query;

  const [expenseSummary, incomeSummary] = await Promise.all([
    analyticsService.getExpenseSummary(userId, { startDate, endDate }),
    analyticsService.getIncomeSummary(userId, { startDate, endDate }),
  ]);

  const expenseRows = (expenseSummary?.transactions || []).map((tx) => ({
    type: 'expense',
    title: tx.title,
    amount: tx.amount,
    category: tx.category?.name || tx.category,
    date: tx.date,
  }));

  const incomeRows = (incomeSummary?.transactions || []).map((tx) => ({
    type: 'income',
    title: tx.title,
    amount: tx.amount,
    category: tx.category?.name || tx.category,
    date: tx.date,
  }));

  const csv = toCsv([...expenseRows, ...incomeRows]);

  if (!csv) {
    throw new ApiError(404, 'No transactions found for the given date range');
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="transactions-${Date.now()}.csv"`
  );

  return res.status(200).send(csv);
});

module.exports = {
  getMonthlyReport,
  getYearlyReport,
  getExpenseSummary,
  getIncomeSummary,
  getCategorySummary,
  getBudgetSummary,
  generatePdfReport,
  exportCsvReport,
};
