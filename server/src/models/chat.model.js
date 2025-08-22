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
		status: {
			type: String,
			enum: ["active", "archived", "blocked"],
			default: "active"
		},
		lastMessage: {
			content: String,
			sender: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User"
			},
			timestamp: Date
		},
		unreadCount: {
			buyer: { type: Number, default: 0 },
			seller: { type: Number, default: 0 }
		}
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
		content: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000
		},
		messageType: {
			type: String,
			enum: ["text", "image", "file", "offer"],
			default: "text"
		},
		attachments: [{
			type: String,
			url: String,
			filename: String,
			size: Number
		}],
		isRead: {
			type: Boolean,
			default: false
		},
		readAt: Date,

		// For offer messages
		offerAmount: {
			type: Number,
			min: 0,
			required: function () {
				return this.messageType === "offer";
			}
		},
		offerStatus: {
			type: String,
			enum: ["pending", "accepted", "rejected", "expired"],
			default: "pending"
		}

	},
	{
		timestamps: true,
	}
);

messageSchema.index({ chat: 1, createdAt: 1 });

messageSchema.methods.markAsRead = function () {
	this.isRead = true;
	this.readAt = new Date();
	return this.save();
};

module.exports = {
	Chat: mongoose.model("Chat", chatSchema),
	Message: mongoose.model("Message", messageSchema),
};
