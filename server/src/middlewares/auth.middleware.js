const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const {User} = require("../models/user.model");
const { verifyAccess } = require("../utils/generateToken");

// Verify access token from Authorization header
const protect = async (req, res, next) => {
	try {
		const auth = req.headers.authorization;
		if (!auth || !auth.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const token = auth.split(" ")[1];
		// console.log(token);
		let payload;
		try {
			payload = verifyAccess(token);
			// console.log(payload);
		} catch (err) {
			return res
				.status(401)
				.json({ error: "Invalid token: verification failed" });
		}
		if (!payload || !payload.sub) {
			return res.status(401).json({ error: "Invalid token payload" });
		}
		// console.log(payload.sub);
		const user = await User.findById(payload.sub).select("-password");
		// console.log(user);
		if (!user) return res.status(401).json({ error: "User not found" });
		req.user = user; // attach user doc
		next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid token", message : err.message });
	}
};

module.exports = { protect };
