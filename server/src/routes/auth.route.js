const router = require("express").Router();
const { requireRole } = require("../middlewares/rbac.middleware");

const {
	register,
	login,
	me,
	// logout,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
// router.post("/refresh", refresh);
// router.post("/logout", protect, logout);

// Example admin-only route
router.get("/admin", protect, requireRole("admin"), (req, res) => {
	res.json({ secret: "only for admins" });
});

module.exports = router;
