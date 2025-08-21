const express = require("express");
const router = express.Router();

router.get("/:itemId", protect, getReviewsByItem);
router.post("/:itemId", protect, setReviewsByItem);
router.put("/:itemId", protect, updateReviewsByItem);
router.delete("/:itemId", protect, deleteReviewsByItem);

module.exports = router;
