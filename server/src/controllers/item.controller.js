const {Item, ItemImage} = require("../models/item.model");

// POST /api/items
exports.createItem = async (req, res) => {
  try {
    const item = await Item.create({
      user: req.user._id,
      category: req.body.category,
      title: req.body.title,
      description: req.body.description,
      price: req.body.price
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate("user", "name college")
      .populate("category", "name");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/items/:id
exports.getItemById = async (req, res) => {
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
