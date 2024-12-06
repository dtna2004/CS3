const User = require('../models/User');
const Task = require('../models/Task');

// Xem hồ sơ người dùng và cập nhật nhiệm vụ
exports.viewProfile = async (viewerId, profileId) => {
    try {
        const user = await User.findById(profileId);
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        // Cập nhật lượt xem hồ sơ cho nhiệm vụ
        const task = await Task.findOne({ userId: viewerId });
        if (task && task.profileVisits.count < 5 && !task.profileVisits.visitedProfiles.includes(profileId)) {
            task.profileVisits.count++;
            task.profileVisits.visitedProfiles.push(profileId);
            await task.save();
        }

        return user;
    } catch (error) {
        throw error;
    }
};

// Cập nhật ảnh đại diện và cập nhật nhiệm vụ
exports.updateAvatar = async (userId, avatarUrl) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        user.avatar = avatarUrl;
        await user.save();

        // Cập nhật số lần đổi ảnh cho nhiệm vụ
        const task = await Task.findOne({ userId });
        if (task && task.avatarChanges.count < 5) {
            task.avatarChanges.count++;
            await task.save();
        }

        return user;
    } catch (error) {
        throw error;
    }
};

// ... các hàm khác giữ nguyên ... 