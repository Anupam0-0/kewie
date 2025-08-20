const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
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

		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({
			name,
			email,
			passwordHash,
			phone,
			branch,
		});

		res.status(201).json({
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				college: user.college,
			},
			token: generateToken(user._id),
		});
	} catch (e) {
		res.status(500).json({ message: e.message });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password)
			return res.status(400).json({ message: "Missing fields" });

		const user = await User.findOne({ email });
		if (!user)
			return res.status(401).json({ message: "Invalid credentials" });

		const ok = await user.comparePassword(password);
		if (!ok)
			return res.status(401).json({ message: "Invalid credentials" });

		const accessToken = signAccess({
			sub: user._id,
			roles: user.roles,
			permissions: user.permissions,
		});
		const refreshToken = signRefresh({ sub: user._id });

		// Store hashed refresh token in DB for rotation/revoke
		const tokenHash = hashToken(refreshToken);
		const expiresAt = new Date(
			Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES || "7d")
		);
		user.refreshTokens.push({
			tokenHash,
			expiresAt,
			userAgent: req.get("User-Agent"),
			ip: req.ip,
		});
		// Limit stored tokens for cleanup
		if (user.refreshTokens.length > 10) user.refreshTokens.shift();
		await user.save();

		res.json({
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				college: user.college,
			},
			token: generateToken(user._id),
		});
	} catch (e) {
		res.status(500).json({ message: e.message });
	}
};

// Refresh endpoint: read refresh token from cookie, verify, rotate
exports.refresh = async (req, res, next) => {
	try {
		const token = req.cookies.refreshToken;
		if (!token) return res.status(401).json({ error: "No refresh token" });
		const payload = verifyRefresh(token);
		const user = await User.findById(payload.sub);
		if (!user) return res.status(401).json({ error: "User not found" });

		const tokenHash = hashToken(token);
		const stored = user.refreshTokens.find(
			(t) => t.tokenHash === tokenHash
		);
		if (!stored) {
			// Token not found - possible reuse. Revoke all tokens for user -> force logout everywhere
			user.refreshTokens = [];
			await user.save();
			return res
				.status(401)
				.json({ error: "Refresh token invalid (possible reuse)" });
		}

		// Remove used token (rotation)
		user.refreshTokens = user.refreshTokens.filter(
			(t) => t.tokenHash !== tokenHash
		);

		// Issue new tokens
		const accessToken = signAccess({
			sub: user._id,
			roles: user.roles,
			permissions: user.permissions,
		});
		const newRefresh = signRefresh({ sub: user._id });
		const newHash = hashToken(newRefresh);
		const expiresAt = new Date(
			Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES || "7d")
		);
		user.refreshTokens.push({
			tokenHash: newHash,
			expiresAt,
			userAgent: req.get("User-Agent"),
			ip: req.ip,
		});
		if (user.refreshTokens.length > 10) user.refreshTokens.shift();
		await user.save();

		res.cookie("refreshToken", newRefresh, {
			...cookieOptions,
			maxAge: expiresAt.getTime() - Date.now(),
		});
		res.json({ accessToken, user: user.toJSON() });
	} catch (err) {
		return res.status(401).json({ error: "Invalid refresh token" });
	}
};

// Logout - remove cookie and revoke the specific refresh token
exports.logout = async (req, res, next) => {
	try {
		const token = req.cookies.refreshToken;
		if (token && req.user) {
			const hash = hashToken(token);
			req.user.refreshTokens = req.user.refreshTokens.filter(
				(t) => t.tokenHash !== hash
			);
			await req.user.save();
		}
		res.clearCookie("refreshToken", cookieOptions);
		res.json({ ok: true });
	} catch (err) {
		next(err);
	}
};

exports.resetPassoword = async (req, res) => {
	try {
	} catch (error) {
		res.status(500).json({ message: e.message });
	}
};

exports.me = async (req, res) => {
	res.json(req.user);
};


