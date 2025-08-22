const express = require("express");
const {
	createReview,
	getReviewsByTarget,
	getReviewById,
	updateReview,
	deleteReview,
	voteOnReview,
	getReviewsByUser,
	getPendingReviews,
	moderateReview,
	getReviewStats,
} = require("../controllers/review.controller");
const { protect } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/rbac.middleware");

const router = express.Router();

// Public routes
/**
 * @route   GET /target/:targetId/:targetType
 * @desc    Get reviews for a specific target (user or item)
 * @access  Public
 */
router.get("/target/:targetId/:targetType", getReviewsByTarget);

/**
 * @route   GET /stats/:targetId/:targetType
 * @desc    Get review statistics for a target
 * @access  Public
 */
router.get("/stats/:targetId/:targetType", getReviewStats);

/**
 * @route   GET /:reviewId
 * @desc    Get a single review by ID
 * @access  Public
 */
router.get("/:reviewId", getReviewById);

// Protected routes
/**
 * @route   POST /
 * @desc    Create a new review
 * @access  Private (requires authentication)
 */
router.post("/", protect, createReview);

/**
 * @route   PUT /:reviewId
 * @desc    Update a review
 * @access  Private (requires authentication)
 */
router.put("/:reviewId", protect, updateReview);

/**
 * @route   DELETE /:reviewId
 * @desc    Delete a review
 * @access  Private (requires authentication)
 */
router.delete("/:reviewId", protect, deleteReview);

/**
 * @route   POST /:reviewId/vote
 * @desc    Vote on a review (helpful/unhelpful)
 * @access  Private (requires authentication)
 */
router.post("/:reviewId/vote", protect, voteOnReview);

/**
 * @route   GET /user/:userId
 * @desc    Get reviews by a specific user
 * @access  Public
 */
router.get("/user/:userId", getReviewsByUser);

// Admin-only routes
/**
 * @route   GET /admin/pending
 * @desc    Get pending reviews for moderation
 * @access  Private (Admin only)
 */
router.get("/admin/pending", protect, requireRole("Admin"), getPendingReviews);

/**
 * @route   PUT /admin/:reviewId/moderate
 * @desc    Moderate a review (approve/reject)
 * @access  Private (Admin only)
 */
router.put("/admin/:reviewId/moderate", protect, requireRole("Admin"), moderateReview);

module.exports = router;
