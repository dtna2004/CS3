const User = require('../models/User');
const Match = require('../models/Match');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');

exports.getPotentialMatches = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
        }

        const allUsers = await User.find({
            _id: { $ne: req.userId },
            gender: currentUser.preferredGender || { $ne: currentUser.gender }
        });

        const existingMatches = await Match.find({
            $or: [
                { sender: req.userId },
                { receiver: req.userId }
            ]
        });

        const matchedUserIds = existingMatches.map(match => 
            match.sender.toString() === req.userId ? match.receiver.toString() : match.sender.toString()
        );

        const potentialMatches = allUsers
            .filter(user => !matchedUserIds.includes(user._id.toString()))
            .filter(user => 
                user.name && 
                user.interests && 
                user.interests.length > 0
            )
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

        potentialMatches.sort((a, b) => b.score - a.score);

        res.json(potentialMatches.slice(0, 10));
    } catch (error) {
        console.error('Matching error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
}; 