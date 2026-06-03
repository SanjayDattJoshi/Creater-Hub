const Message = require('../models/Message');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const sendMessage = async (req, res) => {
  try {
    const receiver = await User.findById(req.params.receiverId);
    if (!receiver) return res.status(404).json({ success: false, message: 'User not found' });

    const message = await Message.create({
      sender: req.user._id,
      receiver: req.params.receiverId,
      content: req.body.content,
      mediaUrl: req.file ? req.file.path : '',
      mediaType: req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : '',
    });

    await message.populate('sender', 'name avatar');

    // Fire notification to receiver
    await createNotification({
      user: req.params.receiverId,
      sender: req.user._id,
      type: 'message',
      message: `${req.user.name} sent you a message`,
      link: `/messages/${req.user._id}`,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getConversation = async (req, res) => {
  try {
    const otherId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherId },
        { sender: otherId, receiver: req.user._id },
      ],
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    // Mark messages from other user as read
    await Message.updateMany(
      { sender: otherId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInbox = async (req, res) => {
  try {
    // Get latest message per conversation partner
    const sent = await Message.aggregate([
      { $match: { sender: req.user._id, isDeleted: false } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$receiver', lastMessage: { $first: '$$ROOT' } } },
    ]);

    const received = await Message.aggregate([
      { $match: { receiver: req.user._id, isDeleted: false } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$sender', lastMessage: { $first: '$$ROOT' } } },
    ]);

    // Merge and deduplicate by partner ID
    const map = new Map();
    [...sent, ...received].forEach(({ _id, lastMessage }) => {
      const key = _id.toString();
      if (!map.has(key) || map.get(key).lastMessage.createdAt < lastMessage.createdAt) {
        map.set(key, { partnerId: _id, lastMessage });
      }
    });

    const conversations = await Promise.all(
      Array.from(map.values()).map(async ({ partnerId, lastMessage }) => {
        const partner = await User.findById(partnerId).select('name avatar role');
        const unread = await Message.countDocuments({ sender: partnerId, receiver: req.user._id, isRead: false });
        return { partner, lastMessage, unread };
      })
    );

    conversations.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
    res.status(200).json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    message.isDeleted = true;
    await message.save();
    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage, getConversation, getInbox, deleteMessage };
