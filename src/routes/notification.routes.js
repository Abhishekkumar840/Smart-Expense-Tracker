/**
 * backend/src/routes/notification.routes.js
 */

const express = require('express');
const router = express.Router();

const {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require('../controllers/notification.controller');

const { authenticate } = require('../middlewares/auth.middleware');

// All notification routes require authentication
router.use(authenticate);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
