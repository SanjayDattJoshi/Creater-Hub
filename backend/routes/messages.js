const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getInbox, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.get('/inbox', protect, getInbox);
router.get('/conversation/:userId', protect, getConversation);
router.post('/send/:receiverId', protect, uploadSingle, sendMessage);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
