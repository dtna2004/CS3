const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getIceServers } = require('../controllers/videoCallController');

router.get('/ice-servers', authenticateToken, getIceServers);

module.exports = router;