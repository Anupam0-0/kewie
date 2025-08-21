const express = require("express");
const router = express.Router();

// ! POST PUT DELETE can only be done by Admin, (middleware to be added later)


router.get("/", getCategories);
router.post("/", createCategoriwes);
router.put("/", updateCategories);
router.delete("/", deleteCategories);

// // for subcategories (for future)
// router
// 	.route("/:CategoryId/subcategories")
// 	.get(getSubCategories)
// 	.post(protect, createSubCategories)
// 	.put(protect, updateSubCategories)
// 	.delete(protect, deleteSubCategories);

module.exports = router;
