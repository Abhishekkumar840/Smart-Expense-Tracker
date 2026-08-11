const DashboardService = require('../services/DashboardService');
const AnalyticsService = require('../services/AnalyticsService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const dashboardService = new DashboardService();
const analyticsService = new AnalyticsService();
const userIdOf = (req) => req.userId || req.user?._id || req.user?.id;

const getDashboardOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getOverview(userIdOf(req));
  res.status(200).json(new ApiResponse(200, overview, 'Dashboard overview fetched successfully'));
});

const getRecentTransactions = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const recentTransactions = await dashboardService.getRecentTransactions(userIdOf(req), limit);
  res.status(200).json(new ApiResponse(200, { recentTransactions }, 'Recent transactions fetched successfully'));
});

const getExpenseByCategory = asyncHandler(async (req, res) => {
  const expenseByCategory = await analyticsService.getExpenseByCategory(userIdOf(req), req.query);
  res.status(200).json(new ApiResponse(200, { expenseByCategory }, 'Expense by category fetched successfully'));
});

const getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const monthlyAnalytics = await analyticsService.getMonthlyAnalytics(userIdOf(req), { year: req.query.year });
  res.status(200).json(new ApiResponse(200, { monthlyAnalytics }, 'Monthly analytics fetched successfully'));
});

module.exports = { getDashboardOverview, getRecentTransactions, getExpenseByCategory, getMonthlyAnalytics };
