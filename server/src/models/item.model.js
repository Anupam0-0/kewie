const mongoose = require("mongoose");
// This file contains schema for:
// 1. Category
// 2. Item
// 3. Item Image

const categorySchema = new mongoose.Schema(
	{
		name: { type: String, unique: true, required: true },
		description: String,
	},
	{
		timestamps: true,
	}
);

const itemSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		category: [
			{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }
		],
		title: { type: String, required: true },
		description: String,
		price: { type: Number, required: true },
		status: {
			type: String,
			enum: ["available", "sold", "reserved"],
			default: "available",
		},
	},
	{
		timestamps: true,
	}
);

const itemImageSchema = new mongoose.Schema(
	{
		item: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Item",
			required: true,
		},
		imageUrl: { type: String, required: true },
	},
	{ timestamps: true }
);

const wishListSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		item: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Item",
			required: true,
		},
	},
	{
		timestamps: true,
	}
);
wishListSchema.index({ user: 1, item: 1 }, { unique: true }); // prevent duplicates

const addToCartSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		item: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Item",
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

addToCartSchema.index({ user: 1, item: 1 }, { unique: true }); // prevent duplicates

module.exports = {
	Category: mongoose.model("Category", categorySchema),
	Item: mongoose.model("Item", itemSchema),
	ItemImage: mongoose.model("ItemImage", itemImageSchema),
	WishList: mongoose.model("WishList", wishListSchema),
	AddToCart: mongoose.model("AddToCart", addToCartSchema),
};
