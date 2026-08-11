/**
 * backend/src/controllers/expense.controller.js
 *
 * Module 6 - Expense Module
 *
 * ASSUMPTIONS (adjust only if your real files differ):
 *  - models/Expense.model.js exports a Mongoose model with fields:
 *      user, title, amount, category (ObjectId ref 'Category'), date,
 *      paymentMethod, description, tags, isRecurring, receiptUrl, timestamps
 *  - domain/Expense.js exports a class with a static/instance factory,
 *      e.g. Expense.fromDocument(doc) -> returns a domain instance
 *      with a .toJSON() method for API-safe serialization.
 *  - services/ExpenseCalculator.js exposes helpers such as
 *      ExpenseCalculator.getTotal(expenses) and
 *      ExpenseCalculator.groupByCategory(expenses)
 *      used here to attach a summary to the list response.
 *  - utils/asyncHandler.js  -> wraps async controllers
 *  - utils/ApiError.js      -> class ApiError(statusCode, message)
 *  - utils/ApiResponse.js   -> class ApiResponse(statusCode, data, message)
 *  - middlewares/auth.middleware.js exposes `protect`, which sets req.user
 *      (req.user._id / req.user.id available)
 *
 * If any of these names differ in your actual codebase, only the
 * require() paths / method names below need to change — the control
 * flow and API contract stay the same.
 */

const ExpenseModel = require('../models/Expense.model');
const Expense = require('../domain/Expense');
const ExpenseCalculator = require('../services/ExpenseCalculator');
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

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) filter.date.$lte = new Date(query.endDate);
  }

  if (query.minAmount || query.maxAmount) {
    filter.amount = {};
    if (query.minAmount !== undefined) filter.amount.$gte = query.minAmount;
    if (query.maxAmount !== undefined) filter.amount.$lte = query.maxAmount;
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
 * @desc    Create a new expense
 * @route   POST /api/v1/expenses
 * @access  Private
 */
const createExpense = asyncHandler(async (req, res) => {
  const payload = { ...req.body, user: req.user._id || req.user.id };

  const expenseDoc = await ExpenseModel.create(payload);
  const expense = Expense.fromDocument
    ? Expense.fromDocument(expenseDoc)
    : expenseDoc;

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        expense.toJSON ? expense.toJSON() : expense,
        'Expense created successfully'
      )
    );
});

/**
 * @desc    Get all expenses for the logged-in user
 *          Supports search, filter by category/date/amount, sorting, pagination
 * @route   GET /api/v1/expenses
 * @access  Private
 */
const getAllExpenses = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const {
    page,
    limit,
    sortBy,
    sortOrder,
  } = req.query;

  const filter = buildFilter(userId, req.query);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [expenseDocs, totalCount] = await Promise.all([
    ExpenseModel.find(filter)
      .populate('category', 'name icon color')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    ExpenseModel.countDocuments(filter),
  ]);

  const expenses = expenseDocs.map((doc) =>
    Expense.fromDocument ? Expense.fromDocument(doc).toJSON() : doc
  );

  const summary = ExpenseCalculator?.getTotal
    ? ExpenseCalculator.getTotal(expenseDocs)
    : undefined;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        expenses,
        summary,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
      'Expenses fetched successfully'
    )
  );
});

/**
 * @desc    Get a single expense by ID
 * @route   GET /api/v1/expenses/:id
 * @access  Private
 */
const getExpenseById = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const expenseDoc = await ExpenseModel.findOne({
    _id: req.params.id,
    user: userId,
  }).populate('category', 'name icon color');

  if (!expenseDoc) {
    throw new ApiError(404, 'Expense not found');
  }

  const expense = Expense.fromDocument
    ? Expense.fromDocument(expenseDoc)
    : expenseDoc;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        expense.toJSON ? expense.toJSON() : expense,
        'Expense fetched successfully'
      )
    );
});

/**
 * @desc    Update an existing expense
 * @route   PUT /api/v1/expenses/:id
 * @access  Private
 */
const updateExpense = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const expenseDoc = await ExpenseModel.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('category', 'name icon color');

  if (!expenseDoc) {
    throw new ApiError(404, 'Expense not found');
  }

  const expense = Expense.fromDocument
    ? Expense.fromDocument(expenseDoc)
    : expenseDoc;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        expense.toJSON ? expense.toJSON() : expense,
        'Expense updated successfully'
      )
    );
});

/**
 * @desc    Delete an expense
 * @route   DELETE /api/v1/expenses/:id
 * @access  Private
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const expenseDoc = await ExpenseModel.findOneAndDelete({
    _id: req.params.id,
    user: userId,
  });

  if (!expenseDoc) {
    throw new ApiError(404, 'Expense not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { id: req.params.id }, 'Expense deleted successfully'));
});

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
