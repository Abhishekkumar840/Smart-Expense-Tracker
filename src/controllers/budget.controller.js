/**
 * backend/src/controllers/budget.controller.js
 *
 * Budget Module — mirrors income.controller.js / expense.controller.js
 * exactly in structure (routes → validate.middleware.js → controller →
 * model/domain), with one addition: usedAmount / remainingAmount /
 * percentageUsed are computed via BudgetService (from live Expense data)
 * and merged into the response, since those values are never stored on
 * the Budget document itself.
 *
 * Uses `req.userId` (a plain string, set by authenticate in
 * auth.middleware.js), not req.user._id — req.user is the UserDomain
 * instance, not a raw Mongo document. Same pattern as income.controller.js.
 */

const BudgetModel = require('../models/Budget.model');
const Budget = require('../domain/Budget');
const BudgetService = require('../services/BudgetService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Helper: build a Mongo filter object from validated query params.
 */
const buildFilter = (userId, query) => {
  const filter = { user: userId };

  if (query.category) {
    filter.category = query.category;
  }

  if (query.period) {
    filter.period = query.period;
  }

  if (query.startDate || query.endDate) {
    filter.startDate = {};
    if (query.startDate) {
        filter.startDate.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
        filter.endDate = { $lte: new Date(query.endDate) };
    }
}

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { notes: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

/**
 * Helper: merge a budget's domain JSON with its computed usage figures.
 */
const withUsage = async (budgetDoc) => {
  const budget = Budget.fromDocument(budgetDoc);
  const usage = await BudgetService.calculateUsage(budgetDoc);
  return { ...budget.toJSON(), ...usage };
};

/**
 * @desc    Create a new budget
 * @route   POST /api/v1/budgets
 * @access  Private
 */
const createBudget = asyncHandler(async (req, res) => {
  const payload = { ...req.body, user: req.userId };

  const budgetDoc = await BudgetModel.create(payload);
  const budgetWithUsage = await withUsage(budgetDoc);

  return res
    .status(201)
    .json(new ApiResponse(201, budgetWithUsage, 'Budget created successfully'));
});

/**
 * @desc    Get all budgets for the logged-in user
 *          Supports search, filter by category/period/date, sorting, pagination
 * @route   GET /api/v1/budgets
 * @access  Private
 */
const getAllBudgets = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page, limit, sortBy, sortOrder } = req.query;

  const filter = buildFilter(userId, req.query);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [budgetDocs, totalCount] = await Promise.all([
    BudgetModel.find(filter)
      .populate('category', 'name icon color')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    BudgetModel.countDocuments(filter),
  ]);

  const usageByBudgetId = await BudgetService.calculateUsageForMany(budgetDocs);

  const budgets = budgetDocs.map((doc) => ({
    ...Budget.fromDocument(doc).toJSON(),
    ...usageByBudgetId.get(doc._id.toString()),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        budgets,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
      'Budgets fetched successfully'
    )
  );
});

/**
 * @desc    Get a single budget by ID
 * @route   GET /api/v1/budgets/:id
 * @access  Private
 */
const getBudgetById = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const budgetDoc = await BudgetModel.findOne({
    _id: req.params.id,
    user: userId,
  }).populate('category', 'name icon color');

  if (!budgetDoc) {
    throw ApiError.notFound('Budget not found');
  }

  const budgetWithUsage = await withUsage(budgetDoc);

  return res
    .status(200)
    .json(new ApiResponse(200, budgetWithUsage, 'Budget fetched successfully'));
});

/**
 * @desc    Update an existing budget
 * @route   PUT /api/v1/budgets/:id
 * @access  Private
 */
const updateBudget = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const budgetDoc = await BudgetModel.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('category', 'name icon color');

  if (!budgetDoc) {
    throw ApiError.notFound('Budget not found');
  }

  const budgetWithUsage = await withUsage(budgetDoc);

  return res
    .status(200)
    .json(new ApiResponse(200, budgetWithUsage, 'Budget updated successfully'));
});

/**
 * @desc    Delete a budget
 * @route   DELETE /api/v1/budgets/:id
 * @access  Private
 */
const deleteBudget = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const budgetDoc = await BudgetModel.findOneAndDelete({
    _id: req.params.id,
    user: userId,
  });

  if (!budgetDoc) {
    throw ApiError.notFound('Budget not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { id: req.params.id }, 'Budget deleted successfully'));
});

module.exports = {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
};
