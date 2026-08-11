// Budget data model.
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // nearly every query is scoped to "this user's budgets"
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Budget category is required'],
    },

    title: {
      type: String,
      required: [true, 'Budget title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    // The spending cap for this category/period. Stored as a Number (not
    // a formatted string) so it can be compared directly against the
    // aggregated Expense total in BudgetService.
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      max: [10000000, 'Amount exceeds the maximum allowed value'],
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },

    period: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly', 'custom'],
      default: 'monthly',
    },

    startDate: {
      type: Date,
      required: [true, 'Budget start date is required'],
    },

    endDate: {
      type: Date,
      required: [true, 'Budget end date is required'],
      validate: {
        // Cross-field validation done as a simple field-level validator
        // (unlike Expense/Income's isRecurring->recurrence rule, this
        // only ever needs `this.startDate`, which is available here).
        validator: function validateEndAfterStart(value) {
          return !this.startDate || value >= this.startDate;
        },
        message: 'End date must be on or after the start date',
      },
    },

    // Percentage of the budget at which the user should be warned they're
    // approaching the limit (used by BudgetService/NotificationService,
    // not enforced here — just stored per-budget so it's configurable).
    alertThreshold: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// ----------------------------------------------------------------------
// INDEXES
// ----------------------------------------------------------------------
// The single most common query pattern: "this user's budgets, sorted by
// start date" (Budget list page), and "this user's budget for category X"
// (used when BudgetService checks usage while creating/editing an expense).
budgetSchema.index({ user: 1, startDate: -1 });
budgetSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
