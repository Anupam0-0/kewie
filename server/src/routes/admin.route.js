const express = require("express");
const router = express.Router();

// ! POST PUT DELETE can only be done by Admin, (middleware to be added later)


// manage users
router.get("/users", protect ,getAllUsers);

// monitor the listings
router.get("/listings", getAllListings);

// remove bad lsitings
router.get("/users", getAllUsers);

module.exports = router;
