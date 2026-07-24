const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOrCreateChat,
  getMyChats,
  getMessages,
  sendMessage,
  markAsRead
} = require('../controllers/chatController');

router.post('/ride/:rideId', protect, getOrCreateChat);
router.get('/', protect, getMyChats);
router.get('/:chatId/messages', protect, getMessages);
router.post('/:chatId/message', protect, sendMessage);
router.put('/:chatId/read', protect, markAsRead);

module.exports = router;