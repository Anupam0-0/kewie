// Check role
function requireRole(...roles) {
	return (req, res, next) => {
		const user = req.user;
		if (!user) return res.status(401).json({ error: "Unauthorized" });
		
		// Check if user has the required role (single role field)
		const hasRole = roles.includes(user.role);
		if (!hasRole) {
			return res
				.status(403)
				.json({ error: "Forbidden - insufficient role" });
		}
		next();
	};
}


module.exports = { requireRole };
