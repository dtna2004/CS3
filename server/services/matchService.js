const Match = require('../models/Match');
const Task = require('../models/Task');

// Tạo lịch hẹn và cập nhật nhiệm vụ
exports.createDate = async (userId1, userId2, dateDetails) => {
    try {
        const match = new Match({
            users: [userId1, userId2],
            dateDetails
        });
        await match.save();

        // Cập nhật số lần hẹn hò cho cả hai người dùng
        const [task1, task2] = await Promise.all([
            Task.findOne({ userId: userId1 }),
            Task.findOne({ userId: userId2 })
        ]);

        if (task1 && task1.dating.count < 7) {
            task1.dating.count++;
            await task1.save();
        }

        if (task2 && task2.dating.count < 7) {
            task2.dating.count++;
            await task2.save();
        }

        return match;
    } catch (error) {
        throw error;
    }
};

// ... các hàm khác giữ nguyên ... 