const router = require("express").Router();
const {
	register,
	login,
	me,
	refresh,
	logout,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
// Example admin-only route
router.get("/admin", authenticate, requireRole("admin"), (req, res) => {
	res.json({ secret: "only for admins" });
});
// Example permission-based route
router.post(
	"/items",
	authenticate,
	requirePermission("items:create"),
	(req, res) => {
		res.json({ ok: true, createdBy: req.user._id });
	}
);

module.exports = router;
