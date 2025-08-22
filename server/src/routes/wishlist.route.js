const express = require("express");
const {
	addToWishlist,
	getWishlist,
	removeFromWishlist,
	checkWishlistStatus,
	getWishlistStats,
	bulkAddToWishlist,
	bulkRemoveFromWishlist,
	clearWishlist,
	getWishlistByCategory,
	moveToCart,
} = require("../controllers/wishlist.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /
 * @desc    Get user's wishlist
 * @access  Private (requires authentication)
 */
router.get("/", getWishlist);

/**
 * @route   GET /stats
 * @desc    Get wishlist statistics
 * @access  Private (requires authentication)
 */
router.get("/stats", getWishlistStats);

/**
 * @route   GET /category/:categoryId
 * @desc    Get wishlist items by category
 * @access  Private (requires authentication)
 */
router.get("/category/:categoryId", getWishlistByCategory);

/**
 * @route   GET /check/:itemId
 * @desc    Check if item is in wishlist
 * @access  Private (requires authentication)
 */
router.get("/check/:itemId", checkWishlistStatus);

/**
 * @route   POST /
 * @desc    Add item to wishlist
 * @access  Private (requires authentication)
 */
router.post("/", addToWishlist);

/**
 * @route   POST /bulk
 * @desc    Bulk add items to wishlist
 * @access  Private (requires authentication)
 */
router.post("/bulk", bulkAddToWishlist);

/**
 * @route   DELETE /:itemId
 * @desc    Remove item from wishlist
 * @access  Private (requires authentication)
 */
router.delete("/:itemId", removeFromWishlist);

/**
 * @route   DELETE /bulk
 * @desc    Bulk remove items from wishlist
 * @access  Private (requires authentication)
 */
router.delete("/bulk", bulkRemoveFromWishlist);

/**
 * @route   DELETE /clear
 * @desc    Clear entire wishlist
 * @access  Private (requires authentication)
 */
router.delete("/clear", clearWishlist);

/**
 * @route   POST /:itemId/move-to-cart
 * @desc    Move wishlist item to cart
 * @access  Private (requires authentication)
 */
router.post("/:itemId/move-to-cart", moveToCart);

module.exports = router;
