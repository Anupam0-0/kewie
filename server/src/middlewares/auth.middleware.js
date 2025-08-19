const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyAccess } = require("../utils/token");

// Verify access token from Authorization header
const protect = async (req, res, next) => {
	// let token;
	// if (req.headers.authorization?.startsWith("Bearer")) {
	//   try {
	//     token = req.headers.authorization.split(" ")[1];
	//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
	//     req.user = await User.findById(decoded.id).select("-passwordHash");
	//     return next();
	//   } catch (err) {
	//     return res.status(401).json({ message: "Not authorized, token failed" });
	//   }
	// }
	// return res.status(401).json({ message: "No token, authorization denied" });

	try {
		const auth = req.headers.authorization;
		if (!auth || !auth.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		const token = auth.split(" ")[1];
		const payload = verifyAccess(token);
		const user = await User.findById(payload.sub).select("-password");
		if (!user) return res.status(401).json({ error: "User not found" });
		req.user = user; // attach user doc
		next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid token" });
	}
};

module.exports = { protect };
