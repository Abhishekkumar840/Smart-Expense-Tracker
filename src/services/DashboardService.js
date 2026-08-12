const AnalyticsService = require('./AnalyticsService');
const BudgetModel = require('../models/Budget.model');
const NotificationModel = require('../models/Notification.model');
const ExpenseModel = require('../models/Expense.model');
const IncomeModel = require('../models/Income.model');
const BudgetService = require('./BudgetService');

class DashboardService {
  constructor({ analyticsService = new AnalyticsService(), budgetModel = BudgetModel, notificationModel = NotificationModel, expenseModel = ExpenseModel, incomeModel = IncomeModel } = {}) {
    this.analytics = analyticsService;
    this.budgetModel = budgetModel;
    this.notificationModel = notificationModel;
    this.expenseModel = expenseModel;
    this.incomeModel = incomeModel;
  }

  async getOverview(userId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const [monthlyReport, change, budgets, unreadNotificationCount, recentExpenses, recentIncomes, categoryRows] = await Promise.all([
      this.analytics.getMonthlyReport(userId, year, month),
      this.analytics.getMonthOverMonthChange(userId, year, month),
      this.budgetModel.find({ user: userId, startDate: { $lte: now }, endDate: { $gte: now } }).populate('category', 'name icon color').lean(),
      this.notificationModel.countDocuments({ user: userId, isRead: false }),
      this.expenseModel.find({ user: userId }).populate('category', 'name icon color').sort({ date: -1 }).limit(5).lean(),
      this.incomeModel.find({ user: userId }).populate('category', 'name icon color').sort({ date: -1 }).limit(5).lean(),
      this.analytics.getExpenseByCategory(userId, { startDate: new Date(year, month - 1, 1), endDate: new Date(year, month, 0, 23, 59, 59, 999) }),
    ]);
    const usageById = await BudgetService.calculateUsageForMany(budgets);
    const budgetStatus = budgets.map((b) => ({ ...b, usage: usageById.get(b._id.toString()) }));
    const recentTransactions = [...recentExpenses.map((e) => ({ ...e, type: 'expense' })), ...recentIncomes.map((i) => ({ ...i, type: 'income' }))]
      .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    return {
      period: monthlyReport.periodLabel,
      totalIncome: monthlyReport.totalIncome(),
      totalExpense: monthlyReport.totalExpense(),
      currentBalance: monthlyReport.netSavings(),
      monthlyIncome: monthlyReport.totalIncome(),
      monthlyExpense: monthlyReport.totalExpense(),
      savingsRatePercent: monthlyReport.savingsRatePercent(),
      expenseChangeFromLastMonth: change.percentageChange,
      expenseByCategory: Object.fromEntries(categoryRows.map((r) => [r.category?.name || r.categoryId || 'Other', r.total])),
      budgetStatus,
      recentTransactions,
      unreadNotificationCount,
    };
  }

  async getRecentTransactions(userId, limit = 10) {
    const [expenses, incomes] = await Promise.all([
      this.expenseModel.find({ user: userId }).populate('category', 'name icon color').sort({ date: -1 }).limit(limit).lean(),
      this.incomeModel.find({ user: userId }).populate('category', 'name icon color').sort({ date: -1 }).limit(limit).lean(),
    ]);
    return [...expenses.map((e) => ({ ...e, type: 'expense' })), ...incomes.map((i) => ({ ...i, type: 'income' }))]
      .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
  }

  async getDashboardSummary(userId) { return this.getOverview(userId); }
}

module.exports = DashboardService;
