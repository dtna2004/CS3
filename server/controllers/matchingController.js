const User = require('../models/User');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');

exports.getPotentialMatches = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId);
        const allUsers = await User.find({
            _id: { $ne: req.userId },
            gender: currentUser.preferredGender
        });

        const potentialMatches = allUsers.map(user => ({
            user: {
                _id: user._id,
                name: user.name,
                age: user.age,
                occupation: user.occupation,
                interests: user.interests,
                avatar: user.avatar,
                location: user.location
            },
            score: calculateMatchScore(currentUser, user)
        }));

        potentialMatches.sort((a, b) => b.score - a.score);

        res.json(potentialMatches.slice(0, 10));
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
}; 