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
} = require("../controllers/item.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @route   GET /
 * @desc    Get all item listings
 * @access  Public
 */
router.get("/", getItems);

/**
 * @route   GET /:itemId
 * @desc    Get a single item by its ID
 * @access  Public
 */
router.get("/:itemId", getItemById);

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
 * @route   GET /user/:userId
 * @desc    Get all item listings by a specific user
 * @access  Public
 */
router.get("/user/:userId", getItemsByUser);

/**
 * @route   PATCH /:itemId/status
 * @desc    Update status of an item
 * @access  Public
 */
router.patch("/:itemId/status", updateStatusById);

/**
 * @route   POST /:itemId/report
 * @desc    Report an item
 * @access  Public
 */
router.post("/:itemId/report", createReportByItemId);

module.exports = router;
