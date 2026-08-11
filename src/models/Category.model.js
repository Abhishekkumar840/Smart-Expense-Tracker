// Category data model.
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [40, 'Category name cannot exceed 40 characters'],
    },

    // Distinguishes whether this category applies to money going out or
    // coming in — a "Salary" category should never show up while adding
    // an expense, and vice versa.
    type: {
      type: String,
      enum: {
        values: ['expense', 'income'],
        message: 'Category type must be either "expense" or "income"',
      },
      required: true,
    },

    // Icon identifier (e.g. a react-icons name like "FaUtensils") so the
    // frontend can render a consistent icon per category without storing
    // binary image data for something this small.
    icon: {
      type: String,
      default: 'FaTag',
    },

    // Hex color used for chart segments and category badges — keeping it
    // on the category itself means charts stay visually consistent
    // everywhere the category appears.
    color: {
      type: String,
      default: '#6366F1',
      match: [/^#([0-9A-Fa-f]{3}){1,2}$/, 'Color must be a valid hex code'],
    },

    // `null` owner = system-provided default category, visible to every
    // user (e.g. "Groceries", "Rent", "Salary"). A non-null owner is a
    // custom category created by that specific user and only visible to them.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    isSystemDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ----------------------------------------------------------------------
// INDEXES
// ----------------------------------------------------------------------
// Every "add expense" / "add income" form loads the dropdown of categories
// scoped to (a) system defaults and (b) the current user's own categories,
// filtered by type. This compound index makes that lookup efficient.
categorySchema.index({ owner: 1, type: 1 });

// Prevents the same user from creating two custom categories with the
// identical name + type (e.g. two "Travel" expense categories). System
// defaults (owner: null) are exempt via the partial filter, since multiple
// null owners are expected.
categorySchema.index(
  { owner: 1, name: 1, type: 1 },
  { unique: true, partialFilterExpression: { owner: { $type: 'objectId' } } }
);

module.exports = mongoose.model('Category', categorySchema);
