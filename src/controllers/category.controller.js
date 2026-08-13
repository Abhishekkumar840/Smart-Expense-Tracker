/**
 * backend/src/controllers/category.controller.js
 *
 * Category Module Controller
 */

const CategoryModel = require("../models/Category.model");
const Category = require("../domain/Category");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

/**
 * @desc    Create a new custom category
 * @route   POST /api/v1/categories
 * @access  Private
 */
const createCategory = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    owner: req.userId,
  };

  let categoryDoc;

  try {
    categoryDoc = await CategoryModel.create(payload);
  } catch (err) {
    // Duplicate custom category
    if (err.code === 11000) {
      throw ApiError.conflict(
        "You already have a category with this name and type"
      );
    }

    throw err;
  }

  const category = Category.fromDocument(categoryDoc);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        category.toJSON(),
        "Category created successfully"
      )
    );
});

/**
 * @desc    Get all categories
 * @route   GET /api/v1/categories
 * @access  Private
 *
 * TEMPORARY DEBUG VERSION:
 * We are filtering only by category type.
 *
 * Example:
 * GET /api/v1/categories?type=income
 *
 * This should return every income category from MongoDB.
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const userId = req.userId;

  const filter = {
    $or: [
      { owner: null },      // system categories
      { owner: userId },    // user custom categories
    ],
  };

  if (type) {
    filter.type = type;
  }

  const categoryDocs = await CategoryModel.find(filter)
    .sort({ name: 1 })
    .lean();

  const categories = categoryDocs.map((doc) =>
    Category.fromDocument(doc).toJSON()
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { categories },
      "Categories fetched successfully"
    )
  );
});

/**
 * @desc    Get a single category by ID
 * @route   GET /api/v1/categories/:id
 * @access  Private
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const categoryDoc = await CategoryModel.findOne({
    _id: req.params.id,

    $or: [
      {
        owner: null,
      },
      {
        owner: userId,
      },
    ],
  });

  if (!categoryDoc) {
    throw ApiError.notFound("Category not found");
  }

  const category = Category.fromDocument(categoryDoc);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        category.toJSON(),
        "Category fetched successfully"
      )
    );
});

/**
 * @desc    Update the logged-in user's custom category
 * @route   PUT /api/v1/categories/:id
 * @access  Private
 */
const updateCategory = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const categoryDoc = await CategoryModel.findById(
    req.params.id
  );

  if (!categoryDoc) {
    throw ApiError.notFound("Category not found");
  }

  const category = Category.fromDocument(categoryDoc);

  /*
   * System default categories cannot be modified.
   */
  if (!category.isEditableBy(userId)) {
    throw ApiError.forbidden(
      category.isSystemDefault()
        ? "System default categories cannot be modified"
        : "You do not have permission to modify this category"
    );
  }

  let updatedDoc;

  try {
    updatedDoc = await CategoryModel.findByIdAndUpdate(
      req.params.id,

      {
        $set: req.body,
      },

      {
        new: true,
        runValidators: true,
      }
    );
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict(
        "You already have a category with this name and type"
      );
    }

    throw err;
  }

  const updatedCategory =
    Category.fromDocument(updatedDoc);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedCategory.toJSON(),
        "Category updated successfully"
      )
    );
});

/**
 * @desc    Delete the logged-in user's custom category
 * @route   DELETE /api/v1/categories/:id
 * @access  Private
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const categoryDoc = await CategoryModel.findById(
    req.params.id
  );

  if (!categoryDoc) {
    throw ApiError.notFound("Category not found");
  }

  const category = Category.fromDocument(categoryDoc);

  /*
   * System default categories cannot be deleted.
   */
  if (!category.isEditableBy(userId)) {
    throw ApiError.forbidden(
      category.isSystemDefault()
        ? "System default categories cannot be deleted"
        : "You do not have permission to delete this category"
    );
  }

  await CategoryModel.findByIdAndDelete(
    req.params.id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          id: req.params.id,
        },
        "Category deleted successfully"
      )
    );
});

/**
 * Export controller functions
 */
module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};