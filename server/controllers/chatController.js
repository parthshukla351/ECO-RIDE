const { Chat, Message } = require('../models/Message');
const { emitToUser } = require('../sockets/socketManager');

// @desc    Get or create chat for a ride
// @route   POST /api/chat/ride/:rideId
// @access  Private
exports.getOrCreateChat = async (req, res) => {
  try {
    const { rideId } = req.params;

    let chat = await Chat.findOne({
      ride: rideId,
      participants: req.user.id
    }).populate('participants', 'name avatar isOnline lastSeen');

    if (!chat) {
      chat = await Chat.create({
        ride: rideId,
        participants: [req.user.id]
      });
      chat = await chat.populate('participants', 'name avatar isOnline lastSeen');
    }

    res.status(200).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my chats
// @route   GET /api/chat
// @access  Private
exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      isActive: true
    })
      .populate('participants', 'name avatar isOnline')
      .populate('ride', 'origin destination departureTime status')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get messages for a chat
// @route   GET /api/chat/:chatId/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark as read
    await Message.updateMany(
      { chat: chatId, sender: { $ne: req.user.id }, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      messages: messages.reverse(),
      total: await Message.countDocuments({ chat: chatId })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send message
// @route   POST /api/chat/:chatId/message
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text', image, location } = req.body;

    const chat = await Chat.findById(chatId).populate('participants');
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      content,
      messageType,
      image,
      location
    });

    // Update chat
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar');

    // Emit to other participants
    chat.participants.forEach(participant => {
      if (participant._id.toString() !== req.user.id) {
        emitToUser(participant._id.toString(), 'newMessage', {
          chatId,
          message: populatedMessage
        });
      }
    });

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};