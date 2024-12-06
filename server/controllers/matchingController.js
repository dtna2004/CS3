const User = require('../models/User');
const Match = require('../models/Match');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');

const matchingController = {
    getPotentialMatches: async (req, res) => {
        try {
            const currentUser = await User.findById(req.userId);
            if (!currentUser) {
                return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
            }

            let query = {
                _id: { $ne: req.userId }
            };

            if (currentUser.preferredGender) {
                query.gender = currentUser.preferredGender;
            }

            if (currentUser.age) {
                query.age = {
                    $gte: Math.max(18, currentUser.age - 10),
                    $lte: currentUser.age + 10
                };
            }

            if (currentUser.location && currentUser.location.coordinates) {
                query['location.coordinates'] = {
                    $near: {
                        $geometry: currentUser.location,
                        $maxDistance: 100000 // 100km
                    }
                };
            }

            const allUsers = await User.find(query).limit(50);

            const existingMatches = await Match.find({
                $or: [
                    { sender: req.userId },
                    { receiver: req.userId }
                ]
            });

            const matchedUserIds = existingMatches.map(match => 
                match.sender.toString() === req.userId ? 
                match.receiver.toString() : 
                match.sender.toString()
            );

            const potentialMatches = allUsers
                .filter(user => !matchedUserIds.includes(user._id.toString()))
                .map(user => ({
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
                    score: calculateMatchScore(currentUser, user) || 0
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 20);

            res.json(potentialMatches);
        } catch (error) {
            console.error('Matching error:', error);
            res.status(500).json({ 
                message: 'Lỗi server',
                error: error.message 
            });
        }
    },

    updateUserLocation: async (req, res) => {
        try {
            const { location } = req.body;
            
            if (!location || !location.coordinates) {
                return res.status(400).json({ 
                    message: 'Vị trí không hợp lệ' 
                });
            }

            await User.findByIdAndUpdate(req.userId, {
                location: location
            });

            res.json({ message: 'Cập nhật vị trí thành công' });
        } catch (error) {
            console.error('Update location error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
};

module.exports = matchingController; 