const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticateToken } = require('../middleware/auth');

router.post('/send-request', authenticateToken, matchController.sendMatchRequest);
router.post('/respond', authenticateToken, matchController.respondToMatch);
router.get('/', authenticateToken, matchController.getMatches);
router.get('/pending', authenticateToken, matchController.getPendingMatches);
router.post('/block', authenticateToken, matchController.blockMatch);
router.get('/pending/count', authenticateToken, matchController.getPendingCount);
router.post('/unmatch', authenticateToken, matchController.unmatchUser);
router.post('/unblock', authenticateToken, matchController.unblockUser);
router.post('/rematch', authenticateToken, matchController.rematchUser);
router.get('/status/:status', authenticateToken, matchController.getMatchesByStatus);
router.get('/friends/:userId', authenticateToken, matchController.getFriends);

module.exports = router; 