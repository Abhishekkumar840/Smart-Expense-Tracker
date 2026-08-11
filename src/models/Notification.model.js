// Notification data model.
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // every read is "this user's notifications"
    },

    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [300, 'Message cannot exceed 300 characters'],
    },

    // Lets the frontend pick an icon/color per notification and, if needed,
    // filter the bell dropdown by category (e.g. "show only budget alerts").
    type: {
      type: String,
      enum: {
        values: ['budget_alert', 'large_expense', 'system', 'account', 'admin_broadcast'],
        message: 'Invalid notification type',
      },
      required: true,
    },

    // Optional polymorphic reference back to the record that triggered this
    // notification (a Budget, an Expense, etc). `refModel` tells Mongoose
    // which collection `relatedEntity` points into, so `.populate()` works
    // correctly regardless of which entity type triggered the alert.
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntityModel',
      default: null,
    },
    relatedEntityModel: {
      type: String,
      enum: ['Budget', 'Expense', 'Income'],
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true, // the unread-count badge queries this constantly
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ----------------------------------------------------------------------
// INDEXES
// ----------------------------------------------------------------------
// The notification bell's two core queries: "all of this user's
// notifications, newest first" and "this user's UNREAD count/list" — this
// compound index serves both without a collection scan.
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

// ----------------------------------------------------------------------
// INSTANCE METHODS
// ----------------------------------------------------------------------
// Encapsulates the "mark as read" state transition (sets both isRead and
// readAt together) so callers can't accidentally set one without the other.
notificationSchema.methods.markAsRead = function markAsRead() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
