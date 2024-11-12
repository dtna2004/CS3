const User = require('../models/User');

exports.updateProfile = async (req, res) => {
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
};

exports.updateAvatar = async (req, res) => {
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
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Chỉ trả về thông tin công khai
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
            location: user.location
        };

        res.json(publicProfile);
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateLocation = async (req, res) => {
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
}; 