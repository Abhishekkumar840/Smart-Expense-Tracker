// Expense data model.
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // nearly every query is scoped to "this user's expenses"
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Expense category is required'],
    },

    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    // Stored as a Number (not a formatted string) so aggregation pipelines
    // ($sum, $avg for AnalyticsService) work directly without parsing.
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      // Keeps a hard ceiling against fat-finger entry errors (e.g. an extra
      // zero); adjust if the target users need larger transactions.
      max: [10000000, 'Amount exceeds the maximum allowed value'],
    },

    // ISO currency code kept per-expense (not just per-user) so historical
    // records stay accurate even if a user's default currency changes later,
    // or the app adds multi-currency support.
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },

    date: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now,
    },

    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'wallet', 'other'],
      default: 'cash',
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // Uploaded receipt image/PDF (via Multer), stored on cloud storage —
    // only the URL and storage id are kept in Mongo.
    receipt: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    // Supports recurring expenses (e.g. monthly rent) without duplicating
    // rows for every future month — a scheduled job can read this flag to
    // auto-generate the next occurrence.
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        // Only meaningful when isRecurring is true; validated together below.
      },
      nextOccurrence: { type: Date },
    },

    tags: {
      // Free-form labels for finer-grained search/filtering beyond category.
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'A maximum of 10 tags is allowed per expense',
      },
    },
  },
  { timestamps: true }
);

// ----------------------------------------------------------------------
// VALIDATION
// ----------------------------------------------------------------------
// Cross-field validation: recurrence.frequency only makes sense when
// isRecurring is true. Mongoose's built-in `required` can't express
// "required only if another field is truthy", so this is done manually.
expenseSchema.pre('validate', function validateRecurrence(next) {
  if (this.isRecurring && !this.recurrence?.frequency) {
    this.invalidate('recurrence.frequency', 'Recurrence frequency is required for recurring expenses');
  }
  next();
});

// ----------------------------------------------------------------------
// INDEXES
// ----------------------------------------------------------------------
// The single most common query pattern: "this user's expenses, sorted by
// date, optionally within a range" (dashboard, monthly/yearly reports).
// A compound index on (user, date) serves both the filter and the sort.
expenseSchema.index({ user: 1, date: -1 });

// Powers "this user's spending by category" (pie charts, budget checks).
expenseSchema.index({ user: 1, category: 1 });

// Supports admin-level analytics across all users grouped by date.
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
