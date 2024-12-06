const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

router.post('/send', authenticateToken, messageController.sendMessage);
router.get('/:userId', authenticateToken, messageController.getMessages);
router.get('/unread/count', authenticateToken, messageController.getUnreadCount);
router.get('/:userId/last', authenticateToken, messageController.getLastMessage);

module.exports = router; 