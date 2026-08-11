/**
 * backend/src/controllers/notification.controller.js
 *
 * Module 12 - Notification Module
 */

const NotificationModel = require('../models/Notification.model');
const Notification = require('../domain/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { user: userId };
  if (req.query.isRead !== undefined) {
    filter.isRead = req.query.isRead === 'true';
  }

  const [notificationDocs, totalCount] = await Promise.all([
    NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    NotificationModel.countDocuments(filter),
  ]);

  const notifications = notificationDocs.map((doc) =>
    Notification.fromDocument ? Notification.fromDocument(doc).toJSON() : doc
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
      'Notifications fetched successfully'
    )
  );
});

/**
 * @desc    Get unread notification count for the logged-in user
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const unreadCount = await NotificationModel.countDocuments({
    user: userId,
    isRead: false,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { unreadCount }, 'Unread notification count fetched successfully')
    );
});

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const notificationDoc = await NotificationModel.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notificationDoc) {
    throw new ApiError(404, 'Notification not found');
  }

  const notification = Notification.fromDocument
    ? Notification.fromDocument(notificationDoc)
    : notificationDoc;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        notification.toJSON ? notification.toJSON() : notification,
        'Notification marked as read'
      )
    );
});

/**
 * @desc    Mark all notifications as read for the logged-in user
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const result = await NotificationModel.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { modifiedCount: result.modifiedCount ?? result.nModified ?? 0 },
        'All notifications marked as read'
      )
    );
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  const notificationDoc = await NotificationModel.findOneAndDelete({
    _id: req.params.id,
    user: userId,
  });

  if (!notificationDoc) {
    throw new ApiError(404, 'Notification not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { id: req.params.id }, 'Notification deleted successfully')
    );
});

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
