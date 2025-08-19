const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const { getOrCreateChat, getChats, sendMessage, getMessages } = require("../controllers/chatController");

router.use(protect);

router.get("/", getChats);
router.post("/", getOrCreateChat);

router.post("/:chatId/messages", sendMessage);
router.get("/:chatId/messages", getMessages);

module.exports = router;
