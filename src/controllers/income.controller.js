/**
 * backend/src/controllers/income.controller.js
 *
 * Module 7 - Income Module
 */

const IncomeModel = require('../models/Income.model');
const Income = require('../domain/Income');
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
 * @desc    Create a new income
 * @route   POST /api/v1/incomes
 * @access  Private
 */
const createIncome = asyncHandler(async (req, res) => {
  const payload = { ...req.body, user: req.user._id || req.user.id };

  const incomeDoc = await IncomeModel.create(payload);
  const income = Income.fromDocument
    ? Income.fromDocument(incomeDoc)
    : incomeDoc;

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        income.toJSON ? income.toJSON() : income,
        'Income created successfully'
      )
    );
});

/**
 * @desc    Get all incomes for the logged-in user
 *          Supports search, filter by category/date/amount, sorting, pagination
 * @route   GET /api/v1/incomes
 * @access  Private
 */
const getAllIncomes = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { page, limit, sortBy, sortOrder } = req.query;

  const filter = buildFilter(userId, req.query);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [incomeDocs, totalCount] = await Promise.all([
    IncomeModel.find(filter)
      .populate('category', 'name icon color')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    IncomeModel.countDocuments(filter),
  ]);

  const incomes = incomeDocs.map((doc) =>
    Income.fromDocument ? Income.fromDocument(doc).toJSON() : doc
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        incomes,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
      'Incomes fetched successfully'
    )
  );
});

/**
 * @desc    Get a single income by ID
 * @route   GET /api/v1/incomes/:id
 * @access  Private
 */
const getIncomeById = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const incomeDoc = await IncomeModel.findOne({
    _id: req.params.id,
    user: userId,
  }).populate('category', 'name icon color');

  if (!incomeDoc) {
    throw new ApiError(404, 'Income not found');
  }

  const income = Income.fromDocument
    ? Income.fromDocument(incomeDoc)
    : incomeDoc;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        income.toJSON ? income.toJSON() : income,
        'Income fetched successfully'
      )
    );
});

/**
 * @desc    Update an existing income
 * @route   PUT /api/v1/incomes/:id
 * @access  Private
 */
const updateIncome = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const incomeDoc = await IncomeModel.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('category', 'name icon color');

  if (!incomeDoc) {
    throw new ApiError(404, 'Income not found');
  }

  const income = Income.fromDocument
    ? Income.fromDocument(incomeDoc)
    : incomeDoc;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        income.toJSON ? income.toJSON() : income,
        'Income updated successfully'
      )
    );
});

/**
 * @desc    Delete an income
 * @route   DELETE /api/v1/incomes/:id
 * @access  Private
 */
const deleteIncome = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const incomeDoc = await IncomeModel.findOneAndDelete({
    _id: req.params.id,
    user: userId,
  });

  if (!incomeDoc) {
    throw new ApiError(404, 'Income not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { id: req.params.id }, 'Income deleted successfully'));
});

module.exports = {
  createIncome,
  getAllIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
};
