const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");
const {
	signAccess,
	signRefresh,
	hashToken,
	verifyRefresh,
} = require("../utils/generateToken");

// Cookie helpers
const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax",
	domain: process.env.COOKIE_DOMAIN || undefined,
};

exports.register = async (req, res) => {
	try {
		const { name, email, password, phone, branch } = req.body;
		
		// Validate required fields
		if (!name || !email || !password || !phone) {
			return res.status(400).json({ 
				message: "Missing required fields: name, email, password, phone" 
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ message: "Please enter a valid email address" });
		}

		// Validate password strength
		if (password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters long" });
		}

		// Check if user already exists
		const exists = await User.findOne({ email: email.toLowerCase() });
		if (exists) {
			return res.status(409).json({ message: "Email already registered" });
		}

		const user = await User.create({
			name: name.trim(),
			email: email.toLowerCase().trim(),
			password,
			phone: phone.trim(),
			branch: branch?.trim(),
		});

		const accessToken = signAccess({
			sub: user._id,
			role: user.role,
		});

		res.status(201).json({
			message: "User registered successfully",
			accessToken,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				branch: user.branch,
				role: user.role,
				isVerified: user.isVerified
			},
		});
	} catch (e) {
		console.error("Register error:", e);
		if (e.code === 11000) {
			return res.status(409).json({ message: "Email already registered" });
		}
		res.status(500).json({ message: "Internal server error" });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		
		if (!email || !password) {
			return res.status(400).json({ message: "Email and password are required" });
		}

		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		// Check if user is active
		if (!user.isActive) {
			return res.status(401).json({ message: "Account is deactivated. Please contact support." });
		}

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

		// Update last login and login count
		user.lastLogin = new Date();
		user.loginCount += 1;
		await user.save();

		const accessToken = signAccess({
			sub: user._id,
			role: user.role,
		});

		res.json({
			message: "Login successful",
			accessToken,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				branch: user.branch,
				role: user.role,
				isVerified: user.isVerified,
				avatar: user.avatar
			},
		});
	} catch (e) {
		console.error("Login error:", e);
		res.status(500).json({ message: "Internal server error" });
	}
};

exports.resetPassword = async (req, res) => {
	try {
	} catch (error) {
		res.status(500).json({ message: e.message });
	}
};

exports.me = async (req, res) => {
	try {
		const user = await User.findById(req.user._id)
			.select('-password')
			.lean();

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json({
			message: "User profile retrieved successfully",
			user
		});
	} catch (error) {
		console.error("Get profile error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Update user profile
exports.updateProfile = async (req, res) => {
	try {
		const { name, phone, branch, avatar } = req.body;
		const userId = req.user._id;

		const updateData = {};
		if (name !== undefined) updateData.name = name.trim();
		if (phone !== undefined) updateData.phone = phone.trim();
		if (branch !== undefined) updateData.branch = branch?.trim();
		if (avatar !== undefined) updateData.avatar = avatar;

		const user = await User.findByIdAndUpdate(
			userId,
			updateData,
			{ new: true, runValidators: true }
		).select('-password');

		res.json({
			message: "Profile updated successfully",
			user
		});
	} catch (error) {
		console.error("Update profile error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Change password
exports.changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		const userId = req.user._id;

		if (!currentPassword || !newPassword) {
			return res.status(400).json({ message: "Current password and new password are required" });
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ message: "New password must be at least 6 characters long" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const isCurrentPasswordValid = await user.comparePassword(currentPassword);
		if (!isCurrentPasswordValid) {
			return res.status(400).json({ message: "Current password is incorrect" });
		}

		user.password = newPassword;
		await user.save();

		res.json({ message: "Password changed successfully" });
	} catch (error) {
		console.error("Change password error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Logout (if you implement refresh tokens)
exports.logout = async (req, res) => {
	try {
		// If you implement refresh tokens, invalidate them here
		// For now, just return success
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get user statistics
exports.getUserStats = async (req, res) => {
	try {
		const userId = req.user._id;

		// Get user's items count
		const { Item } = require("../models/item.model");
		const itemStats = await Item.aggregate([
			{ $match: { user: userId } },
			{
				$group: {
					_id: null,
					totalItems: { $sum: 1 },
					availableItems: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
					soldItems: { $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] } },
					totalViews: { $sum: "$views" }
				}
			}
		]);

		const stats = itemStats[0] || {
			totalItems: 0,
			availableItems: 0,
			soldItems: 0,
			totalViews: 0
		};

		res.json({
			message: "User statistics retrieved successfully",
			stats
		});
	} catch (error) {
		console.error("Get user stats error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
