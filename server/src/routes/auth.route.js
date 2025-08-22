const router = require("express").Router();
const { requireRole } = require("../middlewares/rbac.middleware");
const { validateBody } = require("../middlewares/validation.middleware");
const {
	userRegistrationSchema,
	userLoginSchema,
	userUpdateSchema,
	changePasswordSchema
} = require("../utils/validationSchemas");

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
router.post("/register", validateBody(userRegistrationSchema), register);
router.post("/login", validateBody(userLoginSchema), login);

// Protected routes
router.get("/me", protect, me);
router.put("/profile", protect, validateBody(userUpdateSchema), updateProfile);
router.put("/change-password", protect, validateBody(changePasswordSchema), changePassword);
router.post("/logout", protect, logout);
router.get("/stats", protect, getUserStats);

// Admin-only routes
router.get("/admin", protect, requireRole("Admin"), (req, res) => {
	res.json({ secret: "only for admins" });
});

module.exports = router;
