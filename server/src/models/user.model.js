const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const RefreshTokenSchema = new mongoose.Schema({
	tokenHash: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
	expiresAt: { type: Date, required: true },
	userAgent: String,
	ip: String,
});

const UserSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 50,
		},
		email: {
			type: String,
			unique: true,
			required: true,
			lowercase: true,
			trim: true,
			// validate: {
			// 	validator: function(v) {
			// 		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
			// 	},
			// 	message: 'Please enter a valid email address'
			// }
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		phone: {
			type: String,
			required: true,
			trim: true,
			// validate: {
			// 	validator: function(v) {
			// 		return /^\+?[\d\s\-\(\)]{10,}$/.test(v);
			// 	},
			// 	message: 'Please enter a valid phone number'
			// }
		},
		branch: {
			type: String,
			trim: true,
		},
		role: {
			type: String,
			enum: ["Student", "Admin"],
			default: "Student",
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		avatar: {
			type: String,
			// validate: {
			// 	validator: function (v) {
			// 		return !v || /^https?:\/\/.+/.test(v);
			// 	},
			// 	message: 'Avatar URL must be a valid HTTP/HTTPS URL'
			// }
		},
		lastLogin: Date,
		loginCount: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},

		//  Add verification fields
		// emailVerificationToken: String,
		// emailVerificationExpires: Date,
		// passwordResetToken: String,
		// passwordResetExpires: Date
	},
	{
		timestamps: true,
	}
);

UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	// const salt = await bcrypt.genSalt(12);
	// this.password = await bcrypt.hash(this.password, 12);
	next();
});

UserSchema.methods.comparePassword = async function (candidate) {
	console.log("testing raw password why? idk")
	console.log(candidate, this.password);
	// return bcrypt.compare(candidate, this.password);
	if (candidate == this.password) return true;
	else return false;
};

// Add method to generate verification token
UserSchema.methods.generateVerificationToken = function () {
	const token = require("crypto").randomBytes(32).toString("hex");
	this.emailVerificationToken = token;
	this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
	return token;
};

// Add method to generate password reset token
UserSchema.methods.generatePasswordResetToken = function () {
	const token = require("crypto").randomBytes(32).toString("hex");
	this.passwordResetToken = token;
	this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
	return token;
};

// Remove sensitive info when converting to JSON
UserSchema.methods.toJSON = function () {
	const obj = this.toObject();
	delete obj.password;
	delete obj.refreshTokens;
	return obj;
};

module.exports = {
	User: mongoose.model("User", UserSchema),
	RefreshTokenSchema,
	UserSchema,
};
