const Message = require('../models/Message');
const Task = require('../models/Task');

// Gửi tin nhắn và cập nhật nhiệm vụ
exports.sendMessage = async (senderId, receiverId, content) => {
    try {
        // Tạo tin nhắn mới
        const message = new Message({
            senderId,
            receiverId,
            content
        });
        await message.save();

        // Cập nhật số tin nhắn cho nhiệm vụ
        const task = await Task.findOne({ userId: senderId });
        if (task) {
            task.messages.count++;
            await task.save();
        }

        return message;
    } catch (error) {
        throw error;
    }
};

// ... các hàm khác giữ nguyên ... 