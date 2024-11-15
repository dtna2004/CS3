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

exports.getPendingCount = async (req, res) => {
    try {
        const count = await Match.countDocuments({
            receiver: req.userId,
            status: 'pending'
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.unmatchUser = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Tìm match hiện tại
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

        // Cập nhật trạng thái thành rejected
        match.status = 'rejected';
        await match.save();
        
        res.status(200).json({ message: 'Đã hủy kết nối thành công' });
    } catch (error) {
        console.error('Unmatch error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.blockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Tìm match hiện tại
        const match = await Match.findOne({
            $or: [
                { sender: req.userId, receiver: userId },
                { sender: userId, receiver: req.userId }
            ]
        });

        if (match) {
            match.status = 'blocked';
            await match.save();
        } else {
            // Nếu chưa có match, tạo mới với trạng thái blocked
            const newMatch = new Match({
                sender: req.userId,
                receiver: userId,
                status: 'blocked'
            });
            await newMatch.save();
        }

        // Thêm userId vào danh sách bị chặn của người dùng
        await User.findByIdAndUpdate(req.userId, {
            $addToSet: { blockedUsers: userId }
        });
        
        res.json({ message: 'Đã chặn người dùng thành công' });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.unblockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Tìm và cập nhật match
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

        // Xóa khỏi danh sách bị chặn
        await User.findByIdAndUpdate(req.userId, {
            $pull: { blockedUsers: userId }
        });

        res.json({ message: 'Đã bỏ chặn người dùng thành công' });
    } catch (error) {
        console.error('Unblock error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.rematchUser = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Tìm match cũ
        const match = await Match.findOne({
            $or: [
                { sender: req.userId, receiver: userId },
                { sender: userId, receiver: req.userId }
            ],
            status: 'rejected'
        });

        if (match) {
            // Tạo match request mới
            match.status = 'pending';
            match.sender = req.userId;
            match.receiver = userId;
            await match.save();
        } else {
            // Tạo match mới nếu không tìm thấy
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
};

exports.getMatchesByStatus = async (req, res) => {
    try {
        const { status } = req.params; // 'blocked' hoặc 'rejected'
        
        const matches = await Match.find({
            $or: [
                { sender: req.userId, status: status },
                { receiver: req.userId, status: status }
            ]
        }).populate('sender receiver', 'name avatar');

        const formattedMatches = matches.map(match => ({
            ...match.toObject(),
            otherUser: match.sender._id.toString() === req.userId ? 
                match.receiver : match.sender
        }));

        res.json(formattedMatches);
    } catch (error) {
        console.error(`Error getting ${status} matches:`, error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Cập nhật hàm getPotentialMatches để loại bỏ người dùng bị chặn
exports.getPotentialMatches = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
        }

        // Lấy danh sách người dùng đã block và bị block
        const blockedMatches = await Match.find({
            $or: [
                { sender: req.userId, status: 'blocked' },
                { receiver: req.userId, status: 'blocked' }
            ]
        });

        const blockedUserIds = blockedMatches.map(match => 
            match.sender.toString() === req.userId ? match.receiver : match.sender
        );

        // Thêm danh sách người dùng đã block vào điều kiện loại trừ
        const allUsers = await User.find({
            _id: { 
                $ne: req.userId,
                $nin: [...blockedUserIds, ...(currentUser.blockedUsers || [])]
            },
            gender: currentUser.preferredGender || { $ne: currentUser.gender }
        });

        // Phần còn lại của logic ghép cặp...
    } catch (error) {
        console.error('Matching error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Thêm API để lấy danh sách người dùng đã chặn và đã hủy kết nối
exports.getMatchesByStatus = async (req, res) => {
    try {
        const { status } = req.params; // 'blocked' hoặc 'rejected'
        
        const matches = await Match.find({
            $or: [
                { sender: req.userId, status: status },
                { receiver: req.userId, status: status }
            ]
        }).populate('sender receiver', 'name avatar');

        const formattedMatches = matches.map(match => ({
            ...match.toObject(),
            otherUser: match.sender._id.toString() === req.userId ? 
                match.receiver : match.sender
        }));

        res.json(formattedMatches);
    } catch (error) {
        console.error(`Error getting ${status} matches:`, error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getFriends = async (req, res) => {
    try {
        const userId = req.params.userId;
        const limit = parseInt(req.query.limit) || 0; // 0 means no limit
        
        const matches = await Match.find({
            $or: [
                { sender: userId, status: 'accepted' },
                { receiver: userId, status: 'accepted' }
            ]
        });

        const friendIds = matches.map(match => 
            match.sender.toString() === userId ? match.receiver : match.sender
        );

        let query = User.find(
            { _id: { $in: friendIds } },
            'name avatar'
        );

        if (limit > 0) {
            query = query.limit(limit);
        }

        const friends = await query;

        res.json(friends);
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
}; 