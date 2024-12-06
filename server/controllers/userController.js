const User = require('../models/User');
const Match = require('../models/Match');

// Thêm hàm mới để đếm số bạn bè
async function countFriends(userId) {
    const friendCount = await Match.countDocuments({
        $or: [
            { sender: userId, status: 'accepted' },
            { receiver: userId, status: 'accepted' }
        ]
    });
    return friendCount;
}

const userController = {
    updateProfile: async (req, res) => {
        try {
            const updates = req.body;
            const user = await User.findByIdAndUpdate(
                req.userId,
                updates,
                { new: true }
            );
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    updateAvatar: async (req, res) => {
        try {
            const { avatar } = req.body;
            const user = await User.findByIdAndUpdate(
                req.userId,
                { avatar },
                { new: true }
            );
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }

            const friendCount = await countFriends(req.userId);
            
            const userProfile = {
                ...user.toObject(),
                friendCount
            };

            res.json(userProfile);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    getUserProfile: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }

            const friendCount = await countFriends(req.params.id);

            const publicProfile = {
                _id: user._id,
                name: user.name,
                age: user.age,
                avatar: user.avatar,
                occupation: user.occupation,
                interests: user.interests,
                lifestyle: user.lifestyle, 
                goals: user.goals,
                values: user.values,
                location: user.location,
                friendCount
            };

            res.json(publicProfile);
        } catch (error) {
            console.error('Get user profile error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    updateLocation: async (req, res) => {
        try {
            const { location } = req.body;
            const user = await User.findByIdAndUpdate(
                req.userId,
                { location },
                { new: true }
            );
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
};

module.exports = userController; 