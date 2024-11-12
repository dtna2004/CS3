const User = require('../models/User');
const Match = require('../models/Match');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');

exports.getPotentialMatches = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
        }

        // Lấy danh sách người dùng phù hợp với giới tính ưa thích
        const allUsers = await User.find({
            _id: { $ne: req.userId }, // Không lấy chính mình
            gender: currentUser.preferredGender || { $ne: currentUser.gender } // Nếu không có preferredGender thì lấy giới tính khác
        });

        // Lấy danh sách người đã match hoặc đã gửi yêu cầu
        const existingMatches = await Match.find({
            $or: [
                { sender: req.userId },
                { receiver: req.userId }
            ]
        });

        const matchedUserIds = existingMatches.map(match => 
            match.sender.toString() === req.userId ? match.receiver.toString() : match.sender.toString()
        );

        // Lọc ra những người chưa match
        const potentialMatches = allUsers
            .filter(user => !matchedUserIds.includes(user._id.toString()))
            .map(user => {
                const score = calculateMatchScore(currentUser, user);
                return {
                    user: {
                        _id: user._id,
                        name: user.name,
                        age: user.age,
                        occupation: user.occupation,
                        interests: user.interests,
                        lifestyle: user.lifestyle,
                        goals: user.goals,
                        values: user.values,
                        avatar: user.avatar,
                        location: user.location
                    },
                    score: score
                };
            });

        // Sắp xếp theo điểm số từ cao xuống thấp
        potentialMatches.sort((a, b) => b.score - a.score);

        // Trả về 10 người phù hợp nhất
        res.json(potentialMatches.slice(0, 10));
    } catch (error) {
        console.error('Matching error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
}; 