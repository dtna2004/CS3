const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getIceServers } = require('../services/xirsysService');

router.get('/ice-servers', auth, async (req, res) => {
    try {
        const iceServers = await getIceServers();
        res.json({ iceServers });
    } catch (error) {
        console.error('Error getting ICE servers:', error);
        res.status(500).json({ message: 'Lỗi lấy thông tin ICE servers' });
    }
});

module.exports = router;