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