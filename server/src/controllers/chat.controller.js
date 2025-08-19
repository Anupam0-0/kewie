const Chat = require("../models/Chat");
const Message = require("../models/Message");

/**
 * POST /api/chats
 * body: { sellerId, itemId }
 * buyer = req.user.id
 */
exports.getOrCreateChat = async (req, res) => {
  try {
    const buyer = req.user._id;
    const { sellerId, itemId } = req.body;
    if (!sellerId || !itemId) return res.status(400).json({ message: "sellerId and itemId required" });

    let chat = await Chat.findOne({ buyer, seller: sellerId, item: itemId });
    if (!chat) chat = await Chat.create({ buyer, seller: sellerId, item: itemId });

    const populated = await chat
      .populate("buyer", "name")
      .populate("seller", "name")
      .populate("item", "title price status");

    res.status(201).json(populated);
  } catch (e) {
    // duplicate key -> return existing
    if (e.code === 11000) {
      const { sellerId, itemId } = req.body;
      const chat = await Chat.findOne({ buyer: req.user._id, seller: sellerId, item: itemId })
        .populate("buyer", "name")
        .populate("seller", "name")
        .populate("item", "title price status");
      return res.json(chat);
    }
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/chats
 * list chats for current user, newest first
 */
exports.getChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ $or: [{ buyer: userId }, { seller: userId }] })
      .sort({ updatedAt: -1 })
      .populate("buyer", "name")
      .populate("seller", "name")
      .populate("item", "title price status");
    res.json(chats);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * POST /api/chats/:chatId/messages
 * body: { content }
 */
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "content required" });

    // ensure user is a participant
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const uid = String(req.user._id);
    if (String(chat.buyer) !== uid && String(chat.seller) !== uid) {
      return res.status(403).json({ message: "Not a participant" });
    }

    const msg = await Message.create({ chat: chatId, sender: req.user._id, content });
    await Chat.findByIdAndUpdate(chatId, { $set: { updatedAt: new Date() } });

    const populated = await msg.populate("sender", "name");
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/chats/:chatId/messages?page=1&limit=30
 * ascending order by createdAt
 */
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 30, 1), 100);
    const skip  = (page - 1) * limit;

    // ensure user is a participant
    const chat = await Chat.findById(chatId, "_id buyer seller");
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const uid = String(req.user._id);
    if (String(chat.buyer) !== uid && String(chat.seller) !== uid) {
      return res.status(403).json({ message: "Not a participant" });
    }

    const [items, total] = await Promise.all([
      Message.find({ chat: chatId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name")
        .lean(),
      Message.countDocuments({ chat: chatId })
    ]);

    res.json({
      page, limit, total,
      hasMore: skip + items.length < total,
      items
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
