const { WishList, Item } = require("../models/item.model");

// Add item to wishlist
exports.addToWishlist = async (req, res) => {
	try {
		const { itemId } = req.body;
		const userId = req.user._id;

		if (!itemId) {
			return res.status(400).json({ message: "Item ID is required" });
		}

		// Check if item exists and is available
		const item = await Item.findById(itemId);
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		if (item.status !== "available") {
			return res.status(400).json({ message: "Item is not available for wishlisting" });
		}

		// Check if already in wishlist
		const existingWishlist = await WishList.findOne({ user: userId, item: itemId });
		if (existingWishlist) {
			return res.status(409).json({ message: "Item is already in your wishlist" });
		}

		// Add to wishlist
		const wishlistItem = await WishList.create({
			user: userId,
			item: itemId
		});

		// Populate item details
		await wishlistItem.populate({
			path: "item",
			select: "title price description condition images",
			populate: {
				path: "user",
				select: "name"
			}
		});

		res.status(201).json({
			message: "Item added to wishlist successfully",
			wishlistItem
		});

	} catch (error) {
		console.error("Add to wishlist error:", error);
		if (error.code === 11000) {
			return res.status(409).json({ message: "Item is already in your wishlist" });
		}
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get user's wishlist
exports.getWishlist = async (req, res) => {
	try {
		const userId = req.user._id;
		const { page = 1, limit = 10, sort = "newest" } = req.query;

		const skip = (parseInt(page) - 1) * parseInt(limit);
		const sortOptions = {
			newest: { createdAt: -1 },
			oldest: { createdAt: 1 },
			priceLow: { "item.price": 1 },
			priceHigh: { "item.price": -1 }
		};

		const [wishlistItems, total] = await Promise.all([
			WishList.find({ user: userId })
				.sort(sortOptions[sort] || sortOptions.newest)
				.skip(skip)
				.limit(parseInt(limit))
				.populate({
					path: "item",
					select: "title price description condition status images user",
					populate: {
						path: "user",
						select: "name"
					}
				})
				.lean(),
			WishList.countDocuments({ user: userId })
		]);

		// Filter out items that are no longer available
		const availableItems = wishlistItems.filter(item => item.item.status === "available");

		res.json({
			wishlist: availableItems,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit))
			}
		});

	} catch (error) {
		console.error("Get wishlist error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
	try {
		const { itemId } = req.params;
		const userId = req.user._id;

		const wishlistItem = await WishList.findOneAndDelete({
			user: userId,
			item: itemId
		});

		if (!wishlistItem) {
			return res.status(404).json({ message: "Item not found in wishlist" });
		}

		res.json({ message: "Item removed from wishlist successfully" });

	} catch (error) {
		console.error("Remove from wishlist error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Check if item is in wishlist
exports.checkWishlistStatus = async (req, res) => {
	try {
		const { itemId } = req.params;
		const userId = req.user._id;

		const wishlistItem = await WishList.findOne({
			user: userId,
			item: itemId
		});

		res.json({
			isInWishlist: !!wishlistItem,
			addedAt: wishlistItem?.createdAt
		});

	} catch (error) {
		console.error("Check wishlist status error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get wishlist statistics
exports.getWishlistStats = async (req, res) => {
	try {
		const userId = req.user._id;

		const stats = await WishList.aggregate([
			{
				$match: { user: userId }
			},
			{
				$lookup: {
					from: "items",
					localField: "item",
					foreignField: "_id",
					as: "itemDetails"
				}
			},
			{
				$unwind: "$itemDetails"
			},
			{
				$group: {
					_id: null,
					totalItems: { $sum: 1 },
					availableItems: {
						$sum: {
							$cond: [{ $eq: ["$itemDetails.status", "available"] }, 1, 0]
						}
					},
					soldItems: {
						$sum: {
							$cond: [{ $eq: ["$itemDetails.status", "sold"] }, 1, 0]
						}
					},
					totalValue: {
						$sum: {
							$cond: [
								{ $eq: ["$itemDetails.status", "available"] },
								"$itemDetails.price",
								0
							]
						}
					},
					averagePrice: {
						$avg: {
							$cond: [
								{ $eq: ["$itemDetails.status", "available"] },
								"$itemDetails.price",
								null
							]
						}
					}
				}
			}
		]);

		const result = stats[0] || {
			totalItems: 0,
			availableItems: 0,
			soldItems: 0,
			totalValue: 0,
			averagePrice: 0
		};

		res.json(result);

	} catch (error) {
		console.error("Get wishlist stats error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Bulk add items to wishlist
exports.bulkAddToWishlist = async (req, res) => {
	try {
		const { itemIds } = req.body;
		const userId = req.user._id;

		if (!Array.isArray(itemIds) || itemIds.length === 0) {
			return res.status(400).json({ message: "Item IDs array is required" });
		}

		// Check if items exist and are available
		const items = await Item.find({
			_id: { $in: itemIds },
			status: "available"
		});

		if (items.length === 0) {
			return res.status(404).json({ message: "No available items found" });
		}

		const availableItemIds = items.map(item => item._id);

		// Check which items are already in wishlist
		const existingWishlist = await WishList.find({
			user: userId,
			item: { $in: availableItemIds }
		});

		const existingItemIds = existingWishlist.map(w => w.item.toString());
		const newItemIds = availableItemIds.filter(id => !existingItemIds.includes(id.toString()));

		if (newItemIds.length === 0) {
			return res.status(409).json({ message: "All items are already in your wishlist" });
		}

		// Add new items to wishlist
		const wishlistItems = newItemIds.map(itemId => ({
			user: userId,
			item: itemId
		}));

		const createdItems = await WishList.insertMany(wishlistItems);

		// Populate item details
		await WishList.populate(createdItems, {
			path: "item",
			select: "title price description condition",
			populate: {
				path: "user",
				select: "name"
			}
		});

		res.status(201).json({
			message: `Added ${createdItems.length} items to wishlist`,
			added: createdItems,
			alreadyExists: existingItemIds.length,
			notFound: itemIds.length - availableItemIds.length
		});

	} catch (error) {
		console.error("Bulk add to wishlist error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Bulk remove items from wishlist
exports.bulkRemoveFromWishlist = async (req, res) => {
	try {
		const { itemIds } = req.body;
		const userId = req.user._id;

		if (!Array.isArray(itemIds) || itemIds.length === 0) {
			return res.status(400).json({ message: "Item IDs array is required" });
		}

		const result = await WishList.deleteMany({
			user: userId,
			item: { $in: itemIds }
		});

		res.json({
			message: `Removed ${result.deletedCount} items from wishlist`,
			deletedCount: result.deletedCount
		});

	} catch (error) {
		console.error("Bulk remove from wishlist error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
	try {
		const userId = req.user._id;

		const result = await WishList.deleteMany({ user: userId });

		res.json({
			message: `Cleared wishlist successfully`,
			deletedCount: result.deletedCount
		});

	} catch (error) {
		console.error("Clear wishlist error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get wishlist items by category
exports.getWishlistByCategory = async (req, res) => {
	try {
		const userId = req.user._id;
		const { categoryId } = req.params;
		const { page = 1, limit = 10 } = req.query;

		const skip = (parseInt(page) - 1) * parseInt(limit);

		const [wishlistItems, total] = await Promise.all([
			WishList.find({ user: userId })
				.populate({
					path: "item",
					match: { 
						category: categoryId,
						status: "available"
					},
					select: "title price description condition images user",
					populate: {
						path: "user",
						select: "name"
					}
				})
				.skip(skip)
				.limit(parseInt(limit))
				.lean(),
			WishList.countDocuments({ user: userId })
		]);

		// Filter out items that don't match the category or are not available
		const filteredItems = wishlistItems.filter(item => item.item);

		res.json({
			wishlist: filteredItems,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total: filteredItems.length,
				pages: Math.ceil(filteredItems.length / parseInt(limit))
			}
		});

	} catch (error) {
		console.error("Get wishlist by category error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Move wishlist item to cart (if you have a cart system)
exports.moveToCart = async (req, res) => {
	try {
		const { itemId } = req.params;
		const userId = req.user._id;

		// Check if item is in wishlist
		const wishlistItem = await WishList.findOne({
			user: userId,
			item: itemId
		});

		if (!wishlistItem) {
			return res.status(404).json({ message: "Item not found in wishlist" });
		}

		// Check if item is still available
		const item = await Item.findById(itemId);
		if (!item || item.status !== "available") {
			return res.status(400).json({ message: "Item is no longer available" });
		}

		// Here you would add to cart (implement based on your cart system)
		// For now, we'll just remove from wishlist
		await WishList.findByIdAndDelete(wishlistItem._id);

		res.json({
			message: "Item moved to cart successfully",
			item: {
				id: item._id,
				title: item.title,
				price: item.price
			}
		});

	} catch (error) {
		console.error("Move to cart error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
