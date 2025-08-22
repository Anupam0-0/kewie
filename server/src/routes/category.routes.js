const express = require("express");
const {
	createCategory,
	getAllCategories,
	getCategoryById,
	updateCategory,
	deleteCategory,
	searchCategories,
	getCategoryStats,
	getPopularCategories,
	bulkCreateCategories,
} = require("../controllers/category.controller");
const { protect } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/rbac.middleware");
const { validateBody, validateParams, validateQuery } = require("../middlewares/validation.middleware");
const { 
	categoryCreateSchema, 
	categoryUpdateSchema, 
	bulkCategoryCreateSchema,
	categoryIdParamSchema,
	searchSchema 
} = require("../utils/validationSchemas");

const router = express.Router();

// Public routes
/**
 * @route   GET /
 * @desc    Get all categories
 * @access  Public
 */
router.get("/", getAllCategories);

/**
 * @route   GET /search
 * @desc    Search categories
 * @access  Public
 */
router.get("/search", validateQuery(searchSchema), searchCategories);

/**
 * @route   GET /stats
 * @desc    Get category statistics
 * @access  Public
 */
router.get("/stats", getCategoryStats);

/**
 * @route   GET /popular
 * @desc    Get popular categories
 * @access  Public
 */
router.get("/popular", getPopularCategories);

/**
 * @route   GET /:categoryId
 * @desc    Get a single category by ID
 * @access  Public
 */
router.get("/:categoryId", validateParams(categoryIdParamSchema), getCategoryById);

// Admin-only routes
/**
 * @route   POST /
 * @desc    Create a new category
 * @access  Private (Admin only)
 */
router.post("/", protect, requireRole("Admin"), validateBody(categoryCreateSchema), createCategory);

/**
 * @route   POST /bulk
 * @desc    Bulk create categories
 * @access  Private (Admin only)
 */
router.post("/bulk", protect, requireRole("Admin"), validateBody(bulkCategoryCreateSchema), bulkCreateCategories);

/**
 * @route   PUT /:categoryId
 * @desc    Update a category
 * @access  Private (Admin only)
 */
router.put("/:categoryId", protect, requireRole("Admin"), validateParams(categoryIdParamSchema), validateBody(categoryUpdateSchema), updateCategory);

/**
 * @route   DELETE /:categoryId
 * @desc    Delete a category
 * @access  Private (Admin only)
 */
router.delete("/:categoryId", protect, requireRole("Admin"), validateParams(categoryIdParamSchema), deleteCategory);

module.exports = router;
