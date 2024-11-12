const Match = require('../models/Match');
const User = require('../models/User');

exports.sendMatchRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        
        const existingMatch = await Match.findOne({
            $or: [
                { sender: req.userId, receiver: receiverId },
                { sender: receiverId, receiver: req.userId }
            ]
        });

        if (existingMatch) {
            return res.status(400).json({ message: 'Yêu cầu kết nối đã tồn tại' });
        }

        const match = new Match({
            sender: req.userId,
            receiver: receiverId
        });

        await match.save();
        res.status(201).json(match);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.respondToMatch = async (req, res) => {
    try {
        const { matchId, status } = req.body;
        
        const match = await Match.findOne({
            _id: matchId,
            receiver: req.userId
        });

        if (!match) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu kết nối' });
        }

        match.status = status;
        await match.save();
        
        res.json(match);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getMatches = async (req, res) => {
    try {
        const matches = await Match.find({
            $or: [
                { sender: req.userId },
                { receiver: req.userId }
            ],
            status: 'accepted'
        }).populate('sender receiver', 'name avatar');
        
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getPendingMatches = async (req, res) => {
    try {
        const matches = await Match.find({
            receiver: req.userId,
            status: 'pending'
        }).populate('sender', 'name avatar');
        
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.blockMatch = async (req, res) => {
    try {
        const { userId } = req.body;
        
        await Match.findOneAndUpdate(
            {
                $or: [
                    { sender: req.userId, receiver: userId },
                    { sender: userId, receiver: req.userId }
                ]
            },
            { status: 'blocked' }
        );
        
        res.json({ message: 'Đã chặn người dùng' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
}; 