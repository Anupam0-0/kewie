const express = require("express");
const {
	addToCart,
	getCart,
	updateCartItemQuantity,
	removeFromCart,
	clearCart,
	getCartStats,
	bulkAddToCart,
	bulkRemoveFromCart,
	checkCartStatus,
	moveToWishlist,
	getCartBySeller,
} = require("../controllers/cart.controller");
const { protect } = require("../middlewares/auth.middleware");
const { validateBody, validateParams } = require("../middlewares/validation.middleware");
const { 
	cartAddSchema, 
	cartUpdateQuantitySchema,
	bulkCartSchema,
	itemIdParamSchema,
	sellerIdParamSchema 
} = require("../utils/validationSchemas");

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /
 * @desc    Get user's cart
 * @access  Private (requires authentication)
 */
router.get("/", getCart);

/**
 * @route   GET /stats
 * @desc    Get cart statistics
 * @access  Private (requires authentication)
 */
router.get("/stats", getCartStats);

/**
 * @route   GET /seller/:sellerId
 * @desc    Get cart items by seller
 * @access  Private (requires authentication)
 */
router.get("/seller/:sellerId", validateParams(sellerIdParamSchema), getCartBySeller);

/**
 * @route   GET /check/:itemId
 * @desc    Check if item is in cart
 * @access  Private (requires authentication)
 */
router.get("/check/:itemId", validateParams(itemIdParamSchema), checkCartStatus);

/**
 * @route   POST /
 * @desc    Add item to cart
 * @access  Private (requires authentication)
 */
router.post("/", validateBody(cartAddSchema), addToCart);

/**
 * @route   POST /bulk
 * @desc    Bulk add items to cart
 * @access  Private (requires authentication)
 */
router.post("/bulk", validateBody(bulkCartSchema), bulkAddToCart);

/**
 * @route   PUT /:itemId/quantity
 * @desc    Update cart item quantity
 * @access  Private (requires authentication)
 */
router.put("/:itemId/quantity", validateParams(itemIdParamSchema), validateBody(cartUpdateQuantitySchema), updateCartItemQuantity);

/**
 * @route   DELETE /:itemId
 * @desc    Remove item from cart
 * @access  Private (requires authentication)
 */
router.delete("/:itemId", validateParams(itemIdParamSchema), removeFromCart);

/**
 * @route   DELETE /bulk
 * @desc    Bulk remove items from cart
 * @access  Private (requires authentication)
 */
router.delete("/bulk", validateBody(bulkCartSchema), bulkRemoveFromCart);

/**
 * @route   DELETE /clear
 * @desc    Clear entire cart
 * @access  Private (requires authentication)
 */
router.delete("/clear", clearCart);

/**
 * @route   POST /:itemId/move-to-wishlist
 * @desc    Move cart item to wishlist
 * @access  Private (requires authentication)
 */
router.post("/:itemId/move-to-wishlist", validateParams(itemIdParamSchema), moveToWishlist);

module.exports = router;
