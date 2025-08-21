// Check role
function requireRole(...roles) {
	return (req, res, next) => {
		const user = req.user;
		if (!user) return res.status(401).json({ error: "Unauthorized" });
		const has = roles.some((r) => user.roles.includes(r));
		if (!has)
			return res
				.status(403)
				.json({ error: "Forbidden - insufficient role" });
		next();
	};
}


module.exports = { requireRole };
