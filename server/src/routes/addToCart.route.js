const express = require("express");
const router = express.Router();
const {} = require();

// get all the user's dave images
router.get("/", getAddToCart);
router.post("/:itemId", addItemToCart);
router.delete("/:itemId", deleteItemFromCart);

module.exports = router;
