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

// Check permission
function requirePermission(...permissions) {
	return (req, res, next) => {
		const user = req.user;
		if (!user) return res.status(401).json({ error: "Unauthorized" });
		const ok = permissions.every((p) => user.permissions.includes(p));
		if (!ok)
			return res
				.status(403)
				.json({ error: "Forbidden - missing permission" });
		next();
	};
}

module.exports = { requireRole, requirePermission };
