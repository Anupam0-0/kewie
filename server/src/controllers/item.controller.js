const { Item, ItemImage } = require("../models/item.model");

// Create a new item
const createItem = async (req, res) => {
  try {
    const item = await Item.create({
      user: req.user._id,
      category: req.body.category,
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all items with user and category info
const getItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate("user", "name college")
      .populate("category", "name");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single item by ID, including images
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("user", "name email phone college")
      .populate("category", "name description");

    if (!item) return res.status(404).json({ message: "Item not found" });

    const images = await ItemImage.find({ item: item._id });
    res.json({ ...item.toObject(), images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update item by ID
const updateItemById = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
      },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete item by ID
const deleteItemById = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    // Remove associated images
    await ItemImage.deleteMany({ item: req.params.id });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItemById,
  deleteItemById,
  getItemsByUser,
  updateStatusById,
  createReportByItemId,
};
