const mongoose = require('mongoose');
const ExpenseModel = require('../models/Expense.model');
const IncomeModel = require('../models/Income.model');
const ExpenseDomain = require('../domain/Expense');
const IncomeDomain = require('../domain/Income');
const Report = require('../domain/Report');
const ExpenseCalculator = require('./ExpenseCalculator');

class AnalyticsService {
  #expenseModel;
  #incomeModel;

  constructor(expenseModel = ExpenseModel, incomeModel = IncomeModel) {
    this.#expenseModel = expenseModel;
    this.#incomeModel = incomeModel;
  }

  async #fetchDomainTransactions(userId, startDate, endDate) {
    const [expenseDocs, incomeDocs] = await Promise.all([
      this.#expenseModel.find({ user: userId, date: { $gte: startDate, $lte: endDate } }).lean(),
      this.#incomeModel.find({ user: userId, date: { $gte: startDate, $lte: endDate } }).lean(),
    ]);
    return {
      expenses: expenseDocs.map((doc) => ExpenseDomain.fromDocument(doc)),
      incomes: incomeDocs.map((doc) => IncomeDomain.fromDocument(doc)),
    };
  }

  #periodDates(startDate, endDate) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(1970, 0, 1);
    return { startDate: start, endDate: end };
  }

  async getMonthlyReport(userId, yearOrOptions, maybeMonth) {
    const year = typeof yearOrOptions === 'object' ? Number(yearOrOptions.year) : Number(yearOrOptions);
    const month = typeof yearOrOptions === 'object' ? Number(yearOrOptions.month) : Number(maybeMonth);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const { expenses, incomes } = await this.#fetchDomainTransactions(userId, startDate, endDate);
    return new Report({
      userId,
      periodLabel: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
      startDate,
      endDate,
      expenses,
      incomes,
    });
  }

  async getYearlyReport(userId, yearOrOptions) {
    const year = typeof yearOrOptions === 'object' ? Number(yearOrOptions.year) : Number(yearOrOptions);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    const { expenses, incomes } = await this.#fetchDomainTransactions(userId, startDate, endDate);
    return new Report({ userId, periodLabel: String(year), startDate, endDate, expenses, incomes });
  }

  async getMonthOverMonthChange(userId, year, month) {
    const currentReport = await this.getMonthlyReport(userId, year, month);
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const previousReport = await this.getMonthlyReport(userId, previousYear, previousMonth);
    return {
      currentTotal: currentReport.totalExpense(),
      previousTotal: previousReport.totalExpense(),
      percentageChange: ExpenseCalculator.percentageChange(previousReport.totalExpense(), currentReport.totalExpense()),
    };
  }

  async getYearlyMonthlyTrend(userId, year) {
    const report = await this.getYearlyReport(userId, year);
    return {
      expenseTrend: ExpenseCalculator.groupByMonth(report.expenses),
      incomeTrend: ExpenseCalculator.groupByMonth(report.incomes),
    };
  }

  async getExpenseSummary(userId, options = {}) {
    const { startDate, endDate } = this.#periodDates(options.startDate, options.endDate);
    const docs = await this.#expenseModel.find({ user: userId, date: { $gte: startDate, $lte: endDate } }).populate('category', 'name icon color').lean();
    return {
      period: { startDate, endDate },
      total: ExpenseCalculator.sum(docs),
      average: ExpenseCalculator.average(docs),
      highest: ExpenseCalculator.max(docs),
      count: docs.length,
      transactions: docs,
    };
  }

  async getIncomeSummary(userId, options = {}) {
    const { startDate, endDate } = this.#periodDates(options.startDate, options.endDate);
    const docs = await this.#incomeModel.find({ user: userId, date: { $gte: startDate, $lte: endDate } }).populate('category', 'name icon color').lean();
    return {
      period: { startDate, endDate },
      total: ExpenseCalculator.sum(docs),
      average: ExpenseCalculator.average(docs),
      highest: ExpenseCalculator.max(docs),
      count: docs.length,
      transactions: docs,
    };
  }

  async getExpenseByCategory(userId, options = {}) {
    const { startDate, endDate } = this.#periodDates(options.startDate, options.endDate);
    const rows = await this.#expenseModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    const categoryIds = rows.map((r) => r._id).filter(Boolean);
    const CategoryModel = require('../models/Category.model');
    const cats = await CategoryModel.find({ _id: { $in: categoryIds } }).select('name icon color').lean();
    const byId = new Map(cats.map((c) => [c._id.toString(), c]));
    return rows.map((r) => ({ categoryId: r._id?.toString(), category: byId.get(r._id?.toString()) || null, total: r.total, count: r.count }));
  }

  async getMonthlyAnalytics(userId, options = {}) {
    const year = Number(options.year || new Date().getFullYear());
    const report = await this.getYearlyReport(userId, year);
    const expenseTrend = ExpenseCalculator.groupByMonth(report.expenses);
    const incomeTrend = ExpenseCalculator.groupByMonth(report.incomes);
    return Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      return { month: key, expense: expenseTrend[key] || 0, income: incomeTrend[key] || 0, net: (incomeTrend[key] || 0) - (expenseTrend[key] || 0) };
    });
  }

  async getCategorySummary(userId, options = {}) {
    return this.getExpenseByCategory(userId, options);
  }

  async getBudgetSummary(userId, options = {}) {
    const BudgetService = require('./BudgetService');
    const BudgetModel = require('../models/Budget.model');
    const filter = { user: userId };
    if (options.startDate || options.endDate) {
      filter.startDate = {};
      if (options.startDate) filter.startDate.$gte = new Date(options.startDate);
      if (options.endDate) filter.startDate.$lte = new Date(options.endDate);
    }
    const budgets = await BudgetModel.find(filter).populate('category', 'name icon color').lean();
    const usage = await BudgetService.calculateUsageForMany(budgets);
    return budgets.map((b) => ({ ...b, usage: usage.get(b._id.toString()) }));
  }
}

module.exports = AnalyticsService;
