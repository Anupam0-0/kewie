const express = require("express");
const router = express.Router();
const {} = require()

// get all the user's dave images
router.get("/", getWishlist);
router.post("/:itemId", addToWishList);
router.delete("/:itemId", deleteFromWishList);

module.exports = router;
