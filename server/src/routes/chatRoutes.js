const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const { 
	getOrCreateChat, 
	getChats, 
	sendMessage, 
	getMessages 
} = require("../controllers/chat.controller");

// All routes require authentication
router.use(protect);

/**
 * @route   GET /
 * @desc    Get all chats for current user
 * @access  Private (requires authentication)
 */
router.get("/", getChats);

/**
 * @route   POST /
 * @desc    Get or create a chat between buyer and seller
 * @access  Private (requires authentication)
 */
router.post("/", getOrCreateChat);

/**
 * @route   POST /:chatId/messages
 * @desc    Send a message in a chat
 * @access  Private (requires authentication)
 */
router.post("/:chatId/messages", sendMessage);

/**
 * @route   GET /:chatId/messages
 * @desc    Get messages for a specific chat
 * @access  Private (requires authentication)
 */
router.get("/:chatId/messages", getMessages);

module.exports = router;
