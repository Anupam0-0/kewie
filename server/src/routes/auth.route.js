const router = require("express").Router();
const {
	requireRole,
	requirePermission,
} = require("../middlewares/rbac.middleware");
const {
	register,
	login,
	me,
	refresh,
	logout,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
// Example admin-only route
router.get("/admin", protect, requireRole("admin"), (req, res) => {
	res.json({ secret: "only for admins" });
});
// Example permission-based route
router.post(
	"/items",
	protect,
	requirePermission("items:create"),
	(req, res) => {
		res.json({ ok: true, createdBy: req.user._id });
	}
);

module.exports = router;
