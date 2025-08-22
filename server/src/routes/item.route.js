const express = require("express");
const {
	createItem,
	getItems,
	getItemById,
	updateItemById,
	deleteItemById,
	getItemsByUser,
	updateStatusById,
	createReportByItemId,
	searchItems,
	getFeaturedItems,
	getItemsByCategory,
	getItemStats,
} = require("../controllers/item.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// Public routes
/**
 * @route   GET /
 * @desc    Get all item listings with filtering, sorting, and pagination
 * @access  Public
 */
router.get("/", getItems);

/**
 * @route   GET /search
 * @desc    Search items by title and description
 * @access  Public
 */
router.get("/search", searchItems);

/**
 * @route   GET /featured
 * @desc    Get featured/popular items
 * @access  Public
 */
router.get("/featured", getFeaturedItems);

/**
 * @route   GET /category/:categoryId
 * @desc    Get items by category
 * @access  Public
 */
router.get("/category/:categoryId", getItemsByCategory);

/**
 * @route   GET /stats
 * @desc    Get item statistics
 * @access  Public
 */
router.get("/stats", getItemStats);

/**
 * @route   GET /user/:userId
 * @desc    Get all item listings by a specific user
 * @access  Public
 */
router.get("/user/:userId", getItemsByUser);

/**
 * @route   GET /:itemId
 * @desc    Get a single item by its ID
 * @access  Public
 */
router.get("/:itemId", getItemById);

// Protected routes
/**
 * @route   POST /
 * @desc    Create a new item listing
 * @access  Private (requires authentication)
 */
router.post("/", protect, createItem);

/**
 * @route   PUT /:itemId
 * @desc    Update an existing item listing
 * @access  Private (requires authentication)
 */
router.put("/:itemId", protect, updateItemById);

/**
 * @route   DELETE /:itemId
 * @desc    Delete an item listing
 * @access  Private (requires authentication)
 */
router.delete("/:itemId", protect, deleteItemById);

/**
 * @route   PATCH /:itemId/status
 * @desc    Update status of an item
 * @access  Private (requires authentication)
 */
router.patch("/:itemId/status", protect, updateStatusById);

/**
 * @route   POST /:itemId/report
 * @desc    Report an item
 * @access  Private (requires authentication)
 */
router.post("/:itemId/report", protect, createReportByItemId);

module.exports = router;
