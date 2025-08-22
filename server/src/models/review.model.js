const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
	{
		// The user who wrote the review
		reviewer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		// The target being reviewed (can be either a user or an item)
		targetType: {
			type: String,
			enum: ["user", "item"],
			required: true,
		},
		// Reference to the target (user or item)
		target: {
			type: mongoose.Schema.Types.ObjectId,
			refPath: "targetModel",
			required: true,
		},
		// Dynamic reference based on targetType
		targetModel: {
			type: String,
			required: true,
			enum: ["User", "Item"],
		},
		// Rating (1-5 stars)
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		// Review title/headline
		title: {
			type: String,
			required: true,
			maxlength: 100,
		},
		// Review content
		content: {
			type: String,
			required: true,
			maxlength: 1000,
		},
		// Review status
		status: {
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: "pending",
		},
		// Helpful votes count
		helpfulVotes: {
			type: Number,
			default: 0,
            min: 0
		},
		// Unhelpful votes count
		unhelpfulVotes: {
			type: Number,
			default: 0,
            min: 0
		},
		// Images attached to the review (optional)
		images: [{
			imageUrl: {
				type: String,
				required: true,
			},
			caption: String,
		}],
		// Admin notes (for moderation)
		adminNotes: String,
	},
	{
		timestamps: true,
	}
);

// Index for efficient queries
reviewSchema.index({ target: 1, targetType: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });

// Compound index to prevent duplicate reviews from same user on same target
reviewSchema.index({ reviewer: 1, target: 1, targetType: 1 }, { unique: true });

// Virtual for calculating average rating
reviewSchema.virtual("helpfulScore").get(function() {
	return this.helpfulVotes - this.unhelpfulVotes;
});

// Pre-save middleware to set targetModel based on targetType
reviewSchema.pre("save", function(next) {
	if (this.targetType === "user") {
		this.targetModel = "User";
	} else if (this.targetType === "item") {
		this.targetModel = "Item";
	}
	next();
});

// Static method to get average rating for a target
reviewSchema.statics.getAverageRating = async function(targetId, targetType) {
	const result = await this.aggregate([
		{
			$match: {
				target: mongoose.Types.ObjectId(targetId),
				targetType: targetType,
				status: "approved"
			}
		},
		{
			$group: {
				_id: null,
				averageRating: { $avg: "$rating" },
				totalReviews: { $sum: 1 }
			}
		}
	]);
	
	return result.length > 0 ? {
		averageRating: Math.round(result[0].averageRating * 10) / 10,
		totalReviews: result[0].totalReviews
	} : { averageRating: 0, totalReviews: 0 };
};

// Instance method to mark review as helpful/unhelpful
reviewSchema.methods.vote = function(isHelpful) {
	if (isHelpful) {
		this.helpfulVotes += 1;
	} else {
		this.unhelpfulVotes += 1;
	}
	return this.save();
};

// Method to check if user can review (prevent self-reviews)
reviewSchema.methods.canReview = function(userId) {
	return this.reviewer.toString() !== userId.toString();
};

// Add method to check if review is recent (for editing)
reviewSchema.methods.isEditable = function() {
	const hoursSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60);
	return hoursSinceCreation <= 24; // Allow editing within 24 hours
};


// JSON transformation to include virtuals
reviewSchema.set("toJSON", { virtuals: true });
reviewSchema.set("toObject", { virtuals: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
