// NotificationService.js
//
// Handles creation and retrieval of in-app notifications.
// Keeps notification persistence logic outside controllers/services
// that trigger the notification.

const NotificationModel = require('../models/Notification.model');
const Notification = require('../domain/Notification');

class NotificationService {
  /**
   * Create a budget alert notification.
   */
  static async createBudgetAlert({
    userId,
    budgetId,
    budgetName,
    percentageUsed,
  }) {
    const notification = Notification.forBudgetAlert({
      userId,
      budgetId,
      budgetName,
      percentageUsed,
    });

    return NotificationModel.create({
      user: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedEntity: notification.relatedEntityId,
      relatedEntityModel: notification.relatedEntityModel,
      isRead: notification.isRead,
      readAt: notification.readAt,
    });
  }

  /**
   * Create a large-expense notification.
   */
  static async createLargeExpense({
    userId,
    expenseId,
    expenseTitle,
    amount,
  }) {
    const notification = Notification.forLargeExpense({
      userId,
      expenseId,
      expenseTitle,
      amount,
    });

    return NotificationModel.create({
      user: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedEntity: notification.relatedEntityId,
      relatedEntityModel: notification.relatedEntityModel,
      isRead: notification.isRead,
      readAt: notification.readAt,
    });
  }

  /**
   * Create an admin broadcast notification.
   */
  static async createAdminBroadcast({
    userId,
    title,
    message,
  }) {
    const notification = Notification.forAdminBroadcast({
      userId,
      title,
      message,
    });

    return NotificationModel.create({
      user: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedEntity: notification.relatedEntityId,
      relatedEntityModel: notification.relatedEntityModel,
      isRead: notification.isRead,
      readAt: notification.readAt,
    });
  }
}

module.exports = NotificationService;