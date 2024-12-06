const Match = require('../models/Match');
const User = require('../models/User');

const matchController = {
    sendMatchRequest: async (req, res) => {
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
    },

    respondToMatch: async (req, res) => {
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
    },

    getMatches: async (req, res) => {
        try {
            const matches = await Match.find({
                $or: [
                    { sender: req.userId },
                    { receiver: req.userId }
                ],
                status: 'accepted'
            }).populate('sender receiver', 'name avatar');
            
            const formattedMatches = matches.map(match => ({
                ...match.toObject(),
                otherUser: match.sender._id.toString() === req.userId ? 
                    match.receiver : match.sender
            }));
            
            res.json(formattedMatches);
        } catch (error) {
            console.error('Get matches error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    getPendingMatches: async (req, res) => {
        try {
            const matches = await Match.find({
                receiver: req.userId,
                status: 'pending'
            }).populate('sender', 'name avatar');
            
            res.json(matches);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    blockMatch: async (req, res) => {
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
    },

    getPendingCount: async (req, res) => {
        try {
            const count = await Match.countDocuments({
                receiver: req.userId,
                status: 'pending'
            });

            res.json({ count });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    unmatchUser: async (req, res) => {
        try {
            const { userId } = req.body;
            
            const match = await Match.findOne({
                $or: [
                    { sender: req.userId, receiver: userId },
                    { sender: userId, receiver: req.userId }
                ],
                status: 'accepted'
            });

            if (!match) {
                return res.status(404).json({ message: 'Không tìm thấy kết nối' });
            }

            match.status = 'rejected';
            await match.save();
            
            res.status(200).json({ message: 'Đã hủy kết nối thành công' });
        } catch (error) {
            console.error('Unmatch error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    unblockUser: async (req, res) => {
        try {
            const { userId } = req.body;
            
            await Match.findOneAndUpdate(
                {
                    $or: [
                        { sender: req.userId, receiver: userId },
                        { sender: userId, receiver: req.userId }
                    ],
                    status: 'blocked'
                },
                { status: 'rejected' }
            );

            await User.findByIdAndUpdate(req.userId, {
                $pull: { blockedUsers: userId }
            });

            res.json({ message: 'Đã bỏ chặn người dùng thành công' });
        } catch (error) {
            console.error('Unblock error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    rematchUser: async (req, res) => {
        try {
            const { userId } = req.body;
            
            const match = await Match.findOne({
                $or: [
                    { sender: req.userId, receiver: userId },
                    { sender: userId, receiver: req.userId }
                ],
                status: 'rejected'
            });

            if (match) {
                match.status = 'pending';
                match.sender = req.userId;
                match.receiver = userId;
                await match.save();
            } else {
                const newMatch = new Match({
                    sender: req.userId,
                    receiver: userId,
                    status: 'pending'
                });
                await newMatch.save();
            }

            res.json({ message: 'Đã gửi lời mời kết nối' });
        } catch (error) {
            console.error('Rematch error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    getMatchesByStatus: async (req, res) => {
        try {
            const { status } = req.params;
            const matches = await Match.find({
                $or: [
                    { sender: req.userId },
                    { receiver: req.userId }
                ],
                status
            }).populate('sender receiver', 'name avatar');

            const formattedMatches = matches.map(match => ({
                ...match.toObject(),
                otherUser: match.sender._id.toString() === req.userId ? 
                    match.receiver : match.sender
            }));

            res.json(formattedMatches);
        } catch (error) {
            console.error('Get matches by status error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    getFriends: async (req, res) => {
        try {
            const { userId } = req.params;
            const matches = await Match.find({
                $or: [
                    { sender: userId },
                    { receiver: userId }
                ],
                status: 'accepted'
            }).populate('sender receiver', 'name avatar');

            const friends = matches.map(match => {
                const friend = match.sender._id.toString() === userId ? 
                    match.receiver : match.sender;
                return {
                    _id: friend._id,
                    name: friend.name,
                    avatar: friend.avatar
                };
            });

            res.json(friends);
        } catch (error) {
            console.error('Get friends error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
};

module.exports = matchController; 