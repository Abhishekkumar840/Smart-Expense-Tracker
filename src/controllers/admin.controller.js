/**
 * backend/src/controllers/admin.controller.js
 *
 * Module 13 - Admin Module
 *
 * ASSUMED existing service method signatures (per Module 4):
 *   DashboardService.getAdminOverview()
 *   AnalyticsService.getOverallExpenseStatistics(options)
 *   AnalyticsService.getOverallIncomeStatistics(options)
 *
 * ASSUMED User.model.js fields include: role ('user' | 'admin'),
 * isBlocked (Boolean).
 *
 * If real method/field names differ, only the relevant calls below
 * need renaming — controller structure and response contract stay the same.
 */

const UserModel = require('../models/User.model');
const DashboardService = require('../services/DashboardService');
const AnalyticsService = require('../services/AnalyticsService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get admin dashboard overview (platform-wide metrics)
 * @route   GET /api/v1/admin/dashboard
 * @access  Private/Admin
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  const overview = await DashboardService.getAdminOverview();

  return res
    .status(200)
    .json(new ApiResponse(200, overview, 'Admin dashboard fetched successfully'));
});

/**
 * @desc    Get all users (paginated, searchable)
 * @route   GET /api/v1/admin/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.role) {
    filter.role = req.query.role;
  }

  const [users, totalCount] = await Promise.all([
    UserModel.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    UserModel.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
      'Users fetched successfully'
    )
  );
});

/**
 * @desc    Get a single user by ID
 * @route   GET /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.params.id).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User fetched successfully'));
});

/**
 * @desc    Update a user's details
 * @route   PUT /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'At least one field must be provided to update');
  }

  const user = await UserModel.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User updated successfully'));
});

/**
 * @desc    Delete a user
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { id: req.params.id }, 'User deleted successfully'));
});

/**
 * @desc    Block a user
 * @route   PATCH /api/v1/admin/users/:id/block
 * @access  Private/Admin
 */
const blockUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndUpdate(
    req.params.id,
    { $set: { isBlocked: true } },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User blocked successfully'));
});

/**
 * @desc    Unblock a user
 * @route   PATCH /api/v1/admin/users/:id/unblock
 * @access  Private/Admin
 */
const unblockUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndUpdate(
    req.params.id,
    { $set: { isBlocked: false } },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User unblocked successfully'));
});

/**
 * @desc    Get platform-wide user statistics
 * @route   GET /api/v1/admin/statistics/users
 * @access  Private/Admin
 */
const getUserStatistics = asyncHandler(async (req, res) => {
  const [totalUsers, totalAdmins, totalBlocked] = await Promise.all([
    UserModel.countDocuments({}),
    UserModel.countDocuments({ role: 'admin' }),
    UserModel.countDocuments({ isBlocked: true }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        totalAdmins,
        totalRegularUsers: totalUsers - totalAdmins,
        totalBlocked,
        totalActive: totalUsers - totalBlocked,
      },
      'User statistics fetched successfully'
    )
  );
});

/**
 * @desc    Get overall (platform-wide) expense statistics
 * @route   GET /api/v1/admin/statistics/expenses
 * @access  Private/Admin
 */
const getOverallExpenseStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const statistics = await AnalyticsService.getOverallExpenseStatistics({
    startDate,
    endDate,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, statistics, 'Overall expense statistics fetched successfully')
    );
});

/**
 * @desc    Get overall (platform-wide) income statistics
 * @route   GET /api/v1/admin/statistics/incomes
 * @access  Private/Admin
 */
const getOverallIncomeStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const statistics = await AnalyticsService.getOverallIncomeStatistics({
    startDate,
    endDate,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, statistics, 'Overall income statistics fetched successfully')
    );
});

module.exports = {
  getAdminDashboard,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  getUserStatistics,
  getOverallExpenseStatistics,
  getOverallIncomeStatistics,
};
