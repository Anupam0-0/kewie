const { Category, Item } = require("../models/item.model");

// Create a new category
exports.createCategory = async (req, res) => {
	try {
		const { name, description } = req.body;

		if (!name) {
			return res.status(400).json({ message: "Category name is required" });
		}

		// Check if category already exists
		const existingCategory = await Category.findOne({ 
			name: { $regex: new RegExp(`^${name}$`, 'i') } 
		});

		if (existingCategory) {
			return res.status(409).json({ message: "Category with this name already exists" });
		}

		const category = await Category.create({
			name: name.trim(),
			description: description?.trim()
		});

		res.status(201).json({
			message: "Category created successfully",
			category
		});

	} catch (error) {
		console.error("Create category error:", error);
		if (error.code === 11000) {
			return res.status(409).json({ message: "Category with this name already exists" });
		}
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get all categories
exports.getAllCategories = async (req, res) => {
	try {
		const { includeStats = false } = req.query;

		let categories = await Category.find().sort({ name: 1 });

		if (includeStats === 'true') {
			// Get item count for each category
			const categoriesWithStats = await Promise.all(
				categories.map(async (category) => {
					const itemCount = await Item.countDocuments({ 
						category: category._id,
						status: "available"
					});
					return {
						...category.toObject(),
						itemCount
					};
				})
			);
			return res.json(categoriesWithStats);
		}

		res.json(categories);

	} catch (error) {
		console.error("Get categories error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get a single category by ID
exports.getCategoryById = async (req, res) => {
	try {
		const { categoryId } = req.params;
		const { includeItems = false, page = 1, limit = 10 } = req.query;

		const category = await Category.findById(categoryId);
		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		if (includeItems === 'true') {
			const skip = (parseInt(page) - 1) * parseInt(limit);
			
			const [items, total] = await Promise.all([
				Item.find({ 
					category: categoryId,
					status: "available"
				})
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(parseInt(limit))
					.populate("user", "name")
					.lean(),
				Item.countDocuments({ 
					category: categoryId,
					status: "available"
				})
			]);

			return res.json({
				category,
				items,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					pages: Math.ceil(total / parseInt(limit))
				}
			});
		}

		res.json(category);

	} catch (error) {
		console.error("Get category error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Update a category
exports.updateCategory = async (req, res) => {
	try {
		const { categoryId } = req.params;
		const { name, description } = req.body;

		const category = await Category.findById(categoryId);
		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		// Check if new name conflicts with existing category
		if (name && name !== category.name) {
			const existingCategory = await Category.findOne({ 
				name: { $regex: new RegExp(`^${name}$`, 'i') },
				_id: { $ne: categoryId }
			});

			if (existingCategory) {
				return res.status(409).json({ message: "Category with this name already exists" });
			}
		}

		const updateData = {};
		if (name !== undefined) updateData.name = name.trim();
		if (description !== undefined) updateData.description = description?.trim();

		const updatedCategory = await Category.findByIdAndUpdate(
			categoryId,
			updateData,
			{ new: true, runValidators: true }
		);

		res.json({
			message: "Category updated successfully",
			category: updatedCategory
		});

	} catch (error) {
		console.error("Update category error:", error);
		if (error.code === 11000) {
			return res.status(409).json({ message: "Category with this name already exists" });
		}
		res.status(500).json({ message: "Internal server error" });
	}
};

// Delete a category
exports.deleteCategory = async (req, res) => {
	try {
		const { categoryId } = req.params;

		const category = await Category.findById(categoryId);
		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		// Check if category has items
		const itemCount = await Item.countDocuments({ category: categoryId });
		if (itemCount > 0) {
			return res.status(400).json({ 
				message: `Cannot delete category. It has ${itemCount} associated items.`,
				itemCount
			});
		}

		await Category.findByIdAndDelete(categoryId);

		res.json({ message: "Category deleted successfully" });

	} catch (error) {
		console.error("Delete category error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Search categories
exports.searchCategories = async (req, res) => {
	try {
		const { q, limit = 10 } = req.query;

		if (!q) {
			return res.status(400).json({ message: "Search query is required" });
		}

		const categories = await Category.find({
			$or: [
				{ name: { $regex: q, $options: 'i' } },
				{ description: { $regex: q, $options: 'i' } }
			]
		})
			.limit(parseInt(limit))
			.sort({ name: 1 });

		res.json(categories);

	} catch (error) {
		console.error("Search categories error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get category statistics
exports.getCategoryStats = async (req, res) => {
	try {
		const stats = await Category.aggregate([
			{
				$lookup: {
					from: "items",
					localField: "_id",
					foreignField: "category",
					as: "items"
				}
			},
			{
				$project: {
					name: 1,
					description: 1,
					totalItems: { $size: "$items" },
					availableItems: {
						$size: {
							$filter: {
								input: "$items",
								cond: { $eq: ["$$this.status", "available"] }
							}
						}
					},
					soldItems: {
						$size: {
							$filter: {
								input: "$items",
								cond: { $eq: ["$$this.status", "sold"] }
							}
						}
					},
					averagePrice: {
						$avg: {
							$filter: {
								input: "$items",
								cond: { $eq: ["$$this.status", "available"] }
							}
						}
					}
				}
			},
			{
				$sort: { totalItems: -1 }
			}
		]);

		// Calculate overall statistics
		const overallStats = {
			totalCategories: stats.length,
			totalItems: stats.reduce((sum, cat) => sum + cat.totalItems, 0),
			availableItems: stats.reduce((sum, cat) => sum + cat.availableItems, 0),
			soldItems: stats.reduce((sum, cat) => sum + cat.soldItems, 0),
			averagePrice: stats.reduce((sum, cat) => sum + (cat.averagePrice || 0), 0) / stats.length || 0
		};

		res.json({
			categories: stats,
			overall: overallStats
		});

	} catch (error) {
		console.error("Get category stats error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get popular categories (most items)
exports.getPopularCategories = async (req, res) => {
	try {
		const { limit = 10 } = req.query;

		const popularCategories = await Category.aggregate([
			{
				$lookup: {
					from: "items",
					localField: "_id",
					foreignField: "category",
					as: "items"
				}
			},
			{
				$project: {
					name: 1,
					description: 1,
					itemCount: { $size: "$items" }
				}
			},
			{
				$match: { itemCount: { $gt: 0 } }
			},
			{
				$sort: { itemCount: -1 }
			},
			{
				$limit: parseInt(limit)
			}
		]);

		res.json(popularCategories);

	} catch (error) {
		console.error("Get popular categories error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Bulk create categories (admin only)
exports.bulkCreateCategories = async (req, res) => {
	try {
		const { categories } = req.body;

		if (!Array.isArray(categories) || categories.length === 0) {
			return res.status(400).json({ message: "Categories array is required" });
		}

		const createdCategories = [];
		const errors = [];

		for (const cat of categories) {
			try {
				if (!cat.name) {
					errors.push({ name: cat.name, error: "Name is required" });
					continue;
				}

				const existingCategory = await Category.findOne({ 
					name: { $regex: new RegExp(`^${cat.name}$`, 'i') } 
				});

				if (existingCategory) {
					errors.push({ name: cat.name, error: "Category already exists" });
					continue;
				}

				const category = await Category.create({
					name: cat.name.trim(),
					description: cat.description?.trim()
				});

				createdCategories.push(category);
			} catch (error) {
				errors.push({ name: cat.name, error: error.message });
			}
		}

		res.status(201).json({
			message: `Created ${createdCategories.length} categories`,
			created: createdCategories,
			errors: errors.length > 0 ? errors : undefined
		});

	} catch (error) {
		console.error("Bulk create categories error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};