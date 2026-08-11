// Income data model.
const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Income category is required'],
    },

    title: {
      type: String,
      required: [true, 'Income title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    amount: {
      type: Number,
      required: [true, 'Income amount is required'],
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

    date: {
      type: Date,
      required: [true, 'Income date is required'],
      default: Date.now,
    },

    // Where this income originated — useful for reports like "salary vs
    // freelance income this year" beyond just the category breakdown.
    source: {
      type: String,
      enum: ['salary', 'freelance', 'business', 'investment', 'gift', 'other'],
      default: 'salary',
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
      },
      nextOccurrence: { type: Date },
    },
  },
  { timestamps: true }
);

// Same cross-field validation pattern as Expense: recurrence details are
// only required when the record is actually recurring.
incomeSchema.pre('validate', function validateRecurrence(next) {
  if (this.isRecurring && !this.recurrence?.frequency) {
    this.invalidate('recurrence.frequency', 'Recurrence frequency is required for recurring income');
  }
  next();
});

// ----------------------------------------------------------------------
// INDEXES — mirrors Expense.model.js for the same query-pattern reasons
// ----------------------------------------------------------------------
incomeSchema.index({ user: 1, date: -1 });
incomeSchema.index({ user: 1, category: 1 });
incomeSchema.index({ user: 1, source: 1 });

module.exports = mongoose.model('Income', incomeSchema);
