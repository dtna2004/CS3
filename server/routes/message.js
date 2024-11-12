const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.post('/send', auth, messageController.sendMessage);
router.get('/:userId', auth, messageController.getMessages);
router.get('/unread/count', auth, messageController.getUnreadCount);
router.get('/:userId/last', auth, messageController.getLastMessage);

module.exports = router; 