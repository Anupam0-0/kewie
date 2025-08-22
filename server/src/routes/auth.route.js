const router = require("express").Router();
const { requireRole } = require("../middlewares/rbac.middleware");

const {
	register,
	login,
	me,
	updateProfile,
	changePassword,
	logout,
	getUserStats,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, me);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/logout", protect, logout);
router.get("/stats", protect, getUserStats);

// Admin-only routes
router.get("/admin", protect, requireRole("Admin"), (req, res) => {
	res.json({ secret: "only for admins" });
});

module.exports = router;
