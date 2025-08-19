const express = require("express");
const {
	createItem,
	getItems,
	getItemById,
} = require("../controllers/item.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.route("/").get(getItems).post(protect, createItem);
router.route("/:id").get(getItemById);

module.exports = router;
