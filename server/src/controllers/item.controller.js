const { Item, ItemImage } = require("../models/item.model");

// Create a new item
const createItem = async (req, res) => {
  try {
    const { title, description, price, category, condition, location, negotiable } = req.body;

    // Validate required fields
    if (!title || !price || !category || !condition) {
      return res.status(400).json({ 
        message: "Missing required fields: title, price, category, condition" 
      });
    }

    // Validate price
    if (price <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    // Validate category array
    if (!Array.isArray(category) || category.length === 0) {
      return res.status(400).json({ message: "At least one category is required" });
    }

    const item = await Item.create({
      user: req.user._id,
      category,
      title: title.trim(),
      description: description?.trim(),
      price,
      condition,
      location: location?.trim(),
      negotiable: negotiable !== undefined ? negotiable : true
    });

    // Populate user and category info
    await item.populate("user", "name");
    await item.populate("category", "name");

    res.status(201).json({
      message: "Item created successfully",
      item
    });
  } catch (err) {
    console.error("Create item error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all items with filtering, sorting, and pagination
const getItems = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = "newest",
      category,
      minPrice,
      maxPrice,
      condition,
      status = "available",
      search,
      negotiable
    } = req.query;

    // Build query
    const query = { status };
    
    if (category) {
      query.category = { $in: Array.isArray(category) ? category : [category] };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (condition) {
      query.condition = condition;
    }
    
    if (negotiable !== undefined) {
      query.negotiable = negotiable === 'true';
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      priceLow: { price: 1 },
      priceHigh: { price: -1 },
      title: { title: 1 }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      Item.find(query)
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name")
        .populate("category", "name")
        .lean(),
      Item.countDocuments(query)
    ]);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Get items error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a single item by ID, including images
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findById(id)
      .populate("user", "name email phone")
      .populate("category", "name description");

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Increment view count
    await Item.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Get images
    const images = await ItemImage.find({ item: item._id });

    res.json({ 
      item: { ...item.toObject(), images },
      message: "Item retrieved successfully"
    });
  } catch (err) {
    console.error("Get item error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update item by ID
const updateItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, condition, location, negotiable } = req.body;

    // Check if item exists and user owns it
    const existingItem = await Item.findById(id);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (existingItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own items" });
    }

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({ message: "Price must be greater than 0" });
      }
      updateData.price = price;
    }
    if (category !== undefined) {
      if (!Array.isArray(category) || category.length === 0) {
        return res.status(400).json({ message: "At least one category is required" });
      }
      updateData.category = category;
    }
    if (condition !== undefined) updateData.condition = condition;
    if (location !== undefined) updateData.location = location?.trim();
    if (negotiable !== undefined) updateData.negotiable = negotiable;

    const item = await Item.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("user", "name").populate("category", "name");

    res.json({
      message: "Item updated successfully",
      item
    });
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete item by ID
const deleteItemById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists and user owns it
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own items" });
    }

    // Delete item and associated images
    await Promise.all([
      Item.findByIdAndDelete(id),
      ItemImage.deleteMany({ item: id })
    ]);

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all items created by a specific user
const getItemsByUser = async (req, res) => {
  try {
    const items = await Item.find({ user: req.params.userId })
      .populate("category", "name");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update status of an item (available, sold, reserved)
const updateStatusById = async (req, res) => {
  try {
    const { status } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Placeholder for reporting an item (extend as needed)
const createReportByItemId = async (req, res) => {
  try {
    // Implement reporting logic here
    res.status(201).json({ message: "Report created (not implemented)" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search items
const searchItems = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      Item.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ],
        status: "available"
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name")
        .populate("category", "name")
        .lean(),
      Item.countDocuments({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ],
        status: "available"
      })
    ]);

    res.json({
      items,
      query: q,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Search items error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get featured/popular items
const getFeaturedItems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const items = await Item.find({ status: "available" })
      .sort({ views: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .populate("user", "name")
      .populate("category", "name")
      .lean();

    res.json({
      items,
      message: "Featured items retrieved successfully"
    });
  } catch (err) {
    console.error("Get featured items error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get items by category
const getItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      priceLow: { price: 1 },
      priceHigh: { price: -1 },
      popular: { views: -1 }
    };

    const [items, total] = await Promise.all([
      Item.find({ 
        category: categoryId,
        status: "available"
      })
        .sort(sortOptions[sort] || sortOptions.newest)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name")
        .populate("category", "name")
        .lean(),
      Item.countDocuments({ 
        category: categoryId,
        status: "available"
      })
    ]);

    res.json({
      items,
      category: categoryId,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Get items by category error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get item statistics
const getItemStats = async (req, res) => {
  try {
    const stats = await Item.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          availableItems: {
            $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] }
          },
          soldItems: {
            $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] }
          },
          reservedItems: {
            $sum: { $cond: [{ $eq: ["$status", "reserved"] }, 1, 0] }
          },
          averagePrice: { $avg: "$price" },
          totalViews: { $sum: "$views" }
        }
      }
    ]);

    const result = stats[0] || {
      totalItems: 0,
      availableItems: 0,
      soldItems: 0,
      reservedItems: 0,
      averagePrice: 0,
      totalViews: 0
    };

    res.json(result);
  } catch (err) {
    console.error("Get item stats error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItemById,
  deleteItemById,
  getItemsByUser,
  updateStatusById,
  createReportByItemId,
  searchItems,
  getFeaturedItems,
  getItemsByCategory,
  getItemStats,
};
