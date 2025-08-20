const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const RefreshTokenSchema = new mongoose.Schema({
	tokenHash: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
	expiresAt: { type: Date, required: true },
	userAgent: String,
	ip: String,
});

const UserSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, unique: true, required: true },
		passwordHash: { type: String, required: true },
		phone: { type: String, required: true },
		branch: String,
		role: { type: String, enum: ["Student", "Admin"] },
		isVerified: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	const salt = await bcrypt.genSalt(12);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

UserSchema.methods.comparePassword = async function (candidate) {
	return bcrypt.compare(candidate, this.password);
};

// Remove sensitive info when converting to JSON
UserSchema.methods.toJSON = function () {
	const obj = this.toObject();
	delete obj.password;
	delete obj.refreshTokens;
	return obj;
};

module.exports = mongoose.model("User", UserSchema);
