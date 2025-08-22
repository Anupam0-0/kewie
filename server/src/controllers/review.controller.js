const Review = require("../models/review.model");
const { User } = require("../models/user.model");
const { Item } = require("../models/item.model");

// Create a new review
exports.createReview = async (req, res) => {
	try {
		const { targetId, targetType, rating, title, content, images } = req.body;
		const reviewer = req.user._id;

		// Validate required fields
		if (!targetId || !targetType || !rating || !title || !content) {
			return res.status(400).json({ 
				message: "Missing required fields: targetId, targetType, rating, title, content" 
			});
		}

		// Validate targetType
		if (!["user", "item"].includes(targetType)) {
			return res.status(400).json({ message: "targetType must be 'user' or 'item'" });
		}

		// Validate rating
		if (rating < 1 || rating > 5) {
			return res.status(400).json({ message: "Rating must be between 1 and 5" });
		}

		// Check if target exists
		const TargetModel = targetType === "user" ? User : Item;
		const target = await TargetModel.findById(targetId);
		if (!target) {
			return res.status(404).json({ message: `${targetType} not found` });
		}

		// Prevent self-reviews
		if (targetType === "user" && reviewer.toString() === targetId) {
			return res.status(400).json({ message: "Cannot review yourself" });
		}

		// Check if user already reviewed this target
		const existingReview = await Review.findOne({
			reviewer,
			target: targetId,
			targetType
		});

		if (existingReview) {
			return res.status(409).json({ message: "You have already reviewed this target" });
		}

		// Create the review
		const review = await Review.create({
			reviewer,
			target: targetId,
			targetType,
			rating,
			title,
			content,
			images: images || []
		});

		// Populate reviewer info
		await review.populate("reviewer", "name avatar");

		res.status(201).json({
			message: "Review created successfully",
			review
		});

	} catch (error) {
		console.error("Create review error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get reviews for a specific target (user or item)
exports.getReviewsByTarget = async (req, res) => {
	try {
		const { targetId, targetType } = req.params;
		const { page = 1, limit = 10, status = "approved", sort = "newest" } = req.query;

		// Validate targetType
		if (!["user", "item"].includes(targetType)) {
			return res.status(400).json({ message: "Invalid targetType" });
		}

		// Validate status
		if (!["pending", "approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "Invalid status" });
		}

		const skip = (parseInt(page) - 1) * parseInt(limit);
		const sortOptions = {
			newest: { createdAt: -1 },
			oldest: { createdAt: 1 },
			rating: { rating: -1 },
			helpful: { helpfulVotes: -1 }
		};

		const query = {
			target: targetId,
			targetType,
			status
		};

		const [reviews, total] = await Promise.all([
			Review.find(query)
				.sort(sortOptions[sort] || sortOptions.newest)
				.skip(skip)
				.limit(parseInt(limit))
				.populate("reviewer", "name avatar")
				.lean(),
			Review.countDocuments(query)
		]);

		// Get average rating
		const avgRating = await Review.getAverageRating(targetId, targetType);

		res.json({
			reviews,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit))
			},
			stats: avgRating
		});

	} catch (error) {
		console.error("Get reviews error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get a single review by ID
exports.getReviewById = async (req, res) => {
	try {
		const { reviewId } = req.params;

		const review = await Review.findById(reviewId)
			.populate("reviewer", "name avatar")
			.populate("target", "name title");

		if (!review) {
			return res.status(404).json({ message: "Review not found" });
		}

		res.json(review);

	} catch (error) {
		console.error("Get review error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Update a review (only by the reviewer within 24 hours)
exports.updateReview = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const { rating, title, content, images } = req.body;
		const userId = req.user._id;

		const review = await Review.findById(reviewId);
		if (!review) {
			return res.status(404).json({ message: "Review not found" });
		}

		// Check if user is the reviewer
		if (review.reviewer.toString() !== userId.toString()) {
			return res.status(403).json({ message: "You can only edit your own reviews" });
		}

		// Check if review is editable (within 24 hours)
		if (!review.isEditable()) {
			return res.status(400).json({ message: "Reviews can only be edited within 24 hours of creation" });
		}

		// Update fields
		const updateData = {};
		if (rating !== undefined) updateData.rating = rating;
		if (title !== undefined) updateData.title = title;
		if (content !== undefined) updateData.content = content;
		if (images !== undefined) updateData.images = images;

		const updatedReview = await Review.findByIdAndUpdate(
			reviewId,
			updateData,
			{ new: true, runValidators: true }
		).populate("reviewer", "name avatar");

		res.json({
			message: "Review updated successfully",
			review: updatedReview
		});

	} catch (error) {
		console.error("Update review error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Delete a review (only by the reviewer)
exports.deleteReview = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const userId = req.user._id;

		const review = await Review.findById(reviewId);
		if (!review) {
			return res.status(404).json({ message: "Review not found" });
		}

		// Check if user is the reviewer
		if (review.reviewer.toString() !== userId.toString()) {
			return res.status(403).json({ message: "You can only delete your own reviews" });
		}

		await Review.findByIdAndDelete(reviewId);

		res.json({ message: "Review deleted successfully" });

	} catch (error) {
		console.error("Delete review error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Vote on a review (helpful/unhelpful)
exports.voteOnReview = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const { isHelpful } = req.body;
		const userId = req.user._id;

		if (typeof isHelpful !== "boolean") {
			return res.status(400).json({ message: "isHelpful must be a boolean" });
		}

		const review = await Review.findById(reviewId);
		if (!review) {
			return res.status(404).json({ message: "Review not found" });
		}

		// Prevent voting on own reviews
		if (review.reviewer.toString() === userId.toString()) {
			return res.status(400).json({ message: "Cannot vote on your own review" });
		}

		// Update votes
		await review.vote(isHelpful);

		res.json({
			message: "Vote recorded successfully",
			helpfulVotes: review.helpfulVotes,
			unhelpfulVotes: review.unhelpfulVotes,
			helpfulScore: review.helpfulScore
		});

	} catch (error) {
		console.error("Vote review error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get reviews by a specific user
exports.getReviewsByUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10 } = req.query;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const [reviews, total] = await Promise.all([
			Review.find({ reviewer: userId })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(parseInt(limit))
				.populate("target", "name title")
				.lean(),
			Review.countDocuments({ reviewer: userId })
		]);

		res.json({
			reviews,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit))
			}
		});

	} catch (error) {
		console.error("Get user reviews error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Admin: Get pending reviews for moderation
exports.getPendingReviews = async (req, res) => {
	try {
		const { page = 1, limit = 20 } = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		const [reviews, total] = await Promise.all([
			Review.find({ status: "pending" })
				.sort({ createdAt: 1 })
				.skip(skip)
				.limit(parseInt(limit))
				.populate("reviewer", "name email")
				.populate("target", "name title")
				.lean(),
			Review.countDocuments({ status: "pending" })
		]);

		res.json({
			reviews,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit))
			}
		});

	} catch (error) {
		console.error("Get pending reviews error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Admin: Moderate a review
exports.moderateReview = async (req, res) => {
	try {
		const { reviewId } = req.params;
		const { status, adminNotes } = req.body;
		const adminId = req.user._id;

		if (!["approved", "rejected"].includes(status)) {
			return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
		}

		const review = await Review.findById(reviewId);
		if (!review) {
			return res.status(404).json({ message: "Review not found" });
		}

		// Update review status
		review.status = status;
		review.moderatedBy = adminId;
		review.moderatedAt = new Date();
		if (adminNotes) review.adminNotes = adminNotes;

		await review.save();

		res.json({
			message: `Review ${status} successfully`,
			review
		});

	} catch (error) {
		console.error("Moderate review error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get review statistics
exports.getReviewStats = async (req, res) => {
	try {
		const { targetId, targetType } = req.params;

		const stats = await Review.aggregate([
			{
				$match: {
					target: mongoose.Types.ObjectId(targetId),
					targetType,
					status: "approved"
				}
			},
			{
				$group: {
					_id: null,
					totalReviews: { $sum: 1 },
					averageRating: { $avg: "$rating" },
					ratingDistribution: {
						$push: "$rating"
					}
				}
			}
		]);

		if (stats.length === 0) {
			return res.json({
				totalReviews: 0,
				averageRating: 0,
				ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
			});
		}

		// Calculate rating distribution
		const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		stats[0].ratingDistribution.forEach(rating => {
			distribution[rating]++;
		});

		res.json({
			totalReviews: stats[0].totalReviews,
			averageRating: Math.round(stats[0].averageRating * 10) / 10,
			ratingDistribution: distribution
		});

	} catch (error) {
		console.error("Get review stats error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
}; 