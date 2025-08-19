const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
	{
		buyer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		seller: {
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

chatSchema.index({ buyer: 1, seller: 1, item: 1 }, { unique: true });

const messageSchema = new mongoose.Schema(
	{
		chat: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chat",
			required: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		content: { type: String, required: true },
	},
	{
		timestamps: true,
	}
);

messageSchema.index({ chat: 1, createdAt: 1 });

module.exports = {
	Chat: mongoose.model("Chat", chatSchema),
	Message: mongoose.model("Message", messageSchema),
};
