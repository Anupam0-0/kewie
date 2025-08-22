const { AddToCart, Item } = require("../models/item.model");

// Add item to cart
exports.addToCart = async (req, res) => {
	try {
		const { itemId, quantity = 1 } = req.body;
		const userId = req.user._id;

		if (!itemId) {
			return res.status(400).json({ message: "Item ID is required" });
		}

		if (quantity < 1) {
			return res.status(400).json({ message: "Quantity must be at least 1" });
		}

		// Check if item exists and is available
		const item = await Item.findById(itemId);
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		if (item.status !== "available") {
			return res.status(400).json({ message: "Item is not available for purchase" });
		}

		// Check if already in cart
		const existingCartItem = await AddToCart.findOne({ user: userId, item: itemId });
		
		if (existingCartItem) {
			// Update quantity
			existingCartItem.quantity += quantity;
			await existingCartItem.save();

			await existingCartItem.populate({
				path: "item",
				select: "title price description condition images",
				populate: {
					path: "user",
					select: "name"
				}
			});

			return res.json({
				message: "Cart item quantity updated",
				cartItem: existingCartItem
			});
		}

		// Add new item to cart
		const cartItem = await AddToCart.create({
			user: userId,
			item: itemId,
			quantity
		});

		// Populate item details
		await cartItem.populate({
			path: "item",
			select: "title price description condition images",
			populate: {
				path: "user",
				select: "name"
			}
		});

		res.status(201).json({
			message: "Item added to cart successfully",
			cartItem
		});

	} catch (error) {
		console.error("Add to cart error:", error);
		if (error.code === 11000) {
			return res.status(409).json({ message: "Item is already in your cart" });
		}
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get user's cart
exports.getCart = async (req, res) => {
	try {
		const userId = req.user._id;

		const cartItems = await AddToCart.find({ user: userId })
			.populate({
				path: "item",
				select: "title price description condition status images user",
				populate: {
					path: "user",
					select: "name"
				}
			})
			.sort({ createdAt: -1 })
			.lean();

		// Filter out items that are no longer available
		const availableItems = cartItems.filter(item => item.item.status === "available");

		// Calculate totals
		const subtotal = availableItems.reduce((sum, item) => {
			return sum + (item.item.price * item.quantity);
		}, 0);

		const totalItems = availableItems.reduce((sum, item) => sum + item.quantity, 0);

		res.json({
			cart: availableItems,
			summary: {
				totalItems,
				subtotal,
				itemCount: availableItems.length
			}
		});

	} catch (error) {
		console.error("Get cart error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Update cart item quantity
exports.updateCartItemQuantity = async (req, res) => {
	try {
		const { itemId } = req.params;
		const { quantity } = req.body;
		const userId = req.user._id;

		if (quantity < 1) {
			return res.status(400).json({ message: "Quantity must be at least 1" });
		}

		const cartItem = await AddToCart.findOne({ user: userId, item: itemId });
		if (!cartItem) {
			return res.status(404).json({ message: "Item not found in cart" });
		}

		// Check if item is still available
		const item = await Item.findById(itemId);
		if (!item || item.status !== "available") {
			return res.status(400).json({ message: "Item is no longer available" });
		}

		cartItem.quantity = quantity;
		await cartItem.save();

		await cartItem.populate({
			path: "item",
			select: "title price description condition images",
			populate: {
				path: "user",
				select: "name"
			}
		});

		res.json({
			message: "Cart item quantity updated",
			cartItem
		});

	} catch (error) {
		console.error("Update cart quantity error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
	try {
		const { itemId } = req.params;
		const userId = req.user._id;

		const cartItem = await AddToCart.findOneAndDelete({
			user: userId,
			item: itemId
		});

		if (!cartItem) {
			return res.status(404).json({ message: "Item not found in cart" });
		}

		res.json({ message: "Item removed from cart successfully" });

	} catch (error) {
		console.error("Remove from cart error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Clear entire cart
exports.clearCart = async (req, res) => {
	try {
		const userId = req.user._id;

		const result = await AddToCart.deleteMany({ user: userId });

		res.json({
			message: "Cart cleared successfully",
			deletedCount: result.deletedCount
		});

	} catch (error) {
		console.error("Clear cart error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get cart statistics
exports.getCartStats = async (req, res) => {
	try {
		const userId = req.user._id;

		const stats = await AddToCart.aggregate([
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
				$match: { "itemDetails.status": "available" }
			},
			{
				$group: {
					_id: null,
					totalItems: { $sum: "$quantity" },
					uniqueItems: { $sum: 1 },
					subtotal: { $sum: { $multiply: ["$itemDetails.price", "$quantity"] } },
					averagePrice: { $avg: "$itemDetails.price" }
				}
			}
		]);

		const result = stats[0] || {
			totalItems: 0,
			uniqueItems: 0,
			subtotal: 0,
			averagePrice: 0
		};

		res.json(result);

	} catch (error) {
		console.error("Get cart stats error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Bulk add items to cart
exports.bulkAddToCart = async (req, res) => {
	try {
		const { items } = req.body; // [{ itemId, quantity }]
		const userId = req.user._id;

		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: "Items array is required" });
		}

		const results = {
			added: [],
			updated: [],
			errors: []
		};

		for (const itemData of items) {
			try {
				const { itemId, quantity = 1 } = itemData;

				if (!itemId) {
					results.errors.push({ itemId, error: "Item ID is required" });
					continue;
				}

				// Check if item exists and is available
				const item = await Item.findById(itemId);
				if (!item) {
					results.errors.push({ itemId, error: "Item not found" });
					continue;
				}

				if (item.status !== "available") {
					results.errors.push({ itemId, error: "Item is not available" });
					continue;
				}

				// Check if already in cart
				const existingCartItem = await AddToCart.findOne({ user: userId, item: itemId });
				
				if (existingCartItem) {
					existingCartItem.quantity += quantity;
					await existingCartItem.save();
					results.updated.push({ itemId, quantity: existingCartItem.quantity });
				} else {
					await AddToCart.create({
						user: userId,
						item: itemId,
						quantity
					});
					results.added.push({ itemId, quantity });
				}

			} catch (error) {
				results.errors.push({ itemId: itemData.itemId, error: error.message });
			}
		}

		res.status(201).json({
			message: `Added ${results.added.length} items, updated ${results.updated.length} items`,
			results
		});

	} catch (error) {
		console.error("Bulk add to cart error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Bulk remove items from cart
exports.bulkRemoveFromCart = async (req, res) => {
	try {
		const { itemIds } = req.body;
		const userId = req.user._id;

		if (!Array.isArray(itemIds) || itemIds.length === 0) {
			return res.status(400).json({ message: "Item IDs array is required" });
		}

		const result = await AddToCart.deleteMany({
			user: userId,
			item: { $in: itemIds }
		});

		res.json({
			message: `Removed ${result.deletedCount} items from cart`,
			deletedCount: result.deletedCount
		});

	} catch (error) {
		console.error("Bulk remove from cart error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Check if item is in cart
exports.checkCartStatus = async (req, res) => {
	try {
		const { itemId } = req.params;
		const userId = req.user._id;

		const cartItem = await AddToCart.findOne({
			user: userId,
			item: itemId
		});

		res.json({
			isInCart: !!cartItem,
			quantity: cartItem?.quantity || 0,
			addedAt: cartItem?.createdAt
		});

	} catch (error) {
		console.error("Check cart status error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Move cart item to wishlist
exports.moveToWishlist = async (req, res) => {
	try {
		const { itemId } = req.params;
		const userId = req.user._id;

		// Check if item is in cart
		const cartItem = await AddToCart.findOne({
			user: userId,
			item: itemId
		});

		if (!cartItem) {
			return res.status(404).json({ message: "Item not found in cart" });
		}

		// Check if item is still available
		const item = await Item.findById(itemId);
		if (!item || item.status !== "available") {
			return res.status(400).json({ message: "Item is no longer available" });
		}

		// Add to wishlist (you'll need to import WishList model)
		const { WishList } = require("../models/item.model");
		
		// Check if already in wishlist
		const existingWishlist = await WishList.findOne({ user: userId, item: itemId });
		if (existingWishlist) {
			return res.status(409).json({ message: "Item is already in your wishlist" });
		}

		await WishList.create({
			user: userId,
			item: itemId
		});

		// Remove from cart
		await AddToCart.findByIdAndDelete(cartItem._id);

		res.json({
			message: "Item moved to wishlist successfully",
			item: {
				id: item._id,
				title: item.title,
				price: item.price
			}
		});

	} catch (error) {
		console.error("Move to wishlist error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get cart items by seller
exports.getCartBySeller = async (req, res) => {
	try {
		const userId = req.user._id;
		const { sellerId } = req.params;

		const cartItems = await AddToCart.find({ user: userId })
			.populate({
				path: "item",
				match: { 
					user: sellerId,
					status: "available"
				},
				select: "title price description condition images user",
				populate: {
					path: "user",
					select: "name"
				}
			})
			.lean();

		// Filter out items that don't match the seller or are not available
		const filteredItems = cartItems.filter(item => item.item);

		// Calculate subtotal for this seller
		const subtotal = filteredItems.reduce((sum, item) => {
			return sum + (item.item.price * item.quantity);
		}, 0);

		res.json({
			cart: filteredItems,
			seller: sellerId,
			subtotal,
			itemCount: filteredItems.length
		});

	} catch (error) {
		console.error("Get cart by seller error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
}; 