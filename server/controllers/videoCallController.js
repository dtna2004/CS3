const { getIceServers } = require('../services/xirsysService');

exports.getIceServers = async (req, res) => {
    try {
        const iceServers = await getIceServers();
        res.json({ iceServers });
    } catch (error) {
        console.error('Error getting ICE servers:', error);
        res.status(500).json({ message: 'Lỗi lấy thông tin ICE servers' });
    }
};

module.exports = { getIceServers }; 