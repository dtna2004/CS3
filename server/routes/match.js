const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const auth = require('../middleware/auth');

router.post('/send-request', auth, matchController.sendMatchRequest);
router.post('/respond', auth, matchController.respondToMatch);
router.get('/', auth, matchController.getMatches);
router.get('/pending', auth, matchController.getPendingMatches);
router.post('/block', auth, matchController.blockMatch);
router.get('/pending/count', auth, matchController.getPendingCount);

module.exports = router; 