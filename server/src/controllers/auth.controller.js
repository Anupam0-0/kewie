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
		if (!name || !email || !password)
			return res.status(400).json({ message: "Missing fields" });

		const exists = await User.findOne({ email });
		if (exists)
			return res
				.status(409)
				.json({ message: "Email already registered" });

		const user = await User.create({
			name,
			email,
			password,
			phone,
			branch,
		});

		const accessToken = signAccess({
			sub: user._id,
			role: user.role,
		});

		res.status(201).json({
			accessToken,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				college: user.college,
			},
		});
	} catch (e) {
		res.status(500).json({ message: e.message });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: "Missing fields" });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: "User not found. Please register." });
		}

        const ok = await user.comparePassword(password);
        if (!ok)
            return res.status(401).json({ message: "Invalid credentials" });

		const accessToken = signAccess({
			sub: user._id,
			role: user.role,
		});

		res.json({
			accessToken,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				college: user.college,
			},
		});
	} catch (e) {
		console.error(e);
		res.status(500).json({ message: e.message });
	}
};

exports.resetPassword = async (req, res) => {
	try {
	} catch (error) {
		res.status(500).json({ message: e.message });
	}
};

exports.me = async (req, res) => {
	res.json(req.user);
};
