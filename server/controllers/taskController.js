const Task = require('../models/Task');
const Coin = require('../models/Coin');
const mongoose = require('mongoose');

const taskController = {
    getTaskStatus: async (req, res) => {
        try {
            const userId = req.userId;
            console.log('getTaskStatus - userId:', userId);
            
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
            }

            let task = await Task.findOne({ userId });
            if (!task) {
                task = new Task({ userId });
                await task.save();
            }

            // Reset các nhiệm vụ nếu cần
            const needsSave = task.resetDaily() || task.resetWeekly();
            if (needsSave) {
                await task.save();
            }

            // Lấy số dư xu
            const coin = await Coin.findOne({ userId });
            const balance = coin ? coin.balance : 0;

            res.json({
                coins: balance,
                dailyLogin: task.dailyLogin.claimed,
                messages: task.messages.count,
                profileVisits: task.profileVisits.count,
                avatarChanges: task.avatarChanges.count,
                dating: task.dating.count
            });
        } catch (error) {
            console.error('Lỗi khi lấy trạng thái nhiệm vụ:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    claimReward: async (req, res) => {
        try {
            const userId = req.userId;
            const { taskType } = req.body;
            
            console.log('claimReward - userId:', userId);
            console.log('claimReward - taskType:', taskType);
            console.log('claimReward - req.body:', req.body);
            
            if (!taskType) {
                return res.status(400).json({ message: 'Thiếu thông tin loại nhiệm vụ' });
            }

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
            }

            // Tìm task của user
            const task = await Task.findOne({ userId });
            if (!task) {
                return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
            }

            // Reset các nhiệm vụ nếu cần
            const needsSave = task.resetDaily() || task.resetWeekly();
            if (needsSave) {
                await task.save();
            }

            // Tìm hoặc tạo tài khoản xu
            let coin = await Coin.findOne({ userId });
            if (!coin) {
                coin = new Coin({ userId });
                await coin.save();
            }

            let reward = 0;
            let description = '';

            // Xử lý từng loại nhiệm vụ
            switch (taskType) {
                case 'daily-login':
                    if (!task.dailyLogin.claimed) {
                        reward = 3;
                        task.dailyLogin.claimed = true;
                        task.dailyLogin.lastClaimed = new Date();
                        description = 'Đăng nhập hằng ngày';
                    } else {
                        return res.status(400).json({ message: 'Nhiệm vụ này đã được nhận thưởng hôm nay' });
                    }
                    break;
                case 'messages':
                    if (task.messages.count >= 5) {
                        reward = 3;
                        task.messages.count = 0;
                        description = 'Gửi 5 tin nhắn';
                    }
                    break;
                case 'profile-visits':
                    if (task.profileVisits.count > 0) {
                        reward = task.profileVisits.count;
                        task.profileVisits.count = 0;
                        task.profileVisits.visitedProfiles = [];
                        description = 'Ghé thăm hồ sơ';
                    }
                    break;
                case 'avatar-change':
                    if (task.avatarChanges.count >= 1) {
                        reward = 5;
                        task.avatarChanges.count--;
                        description = 'Đổi ảnh hồ sơ';
                    }
                    break;
                case 'dating':
                    if (task.dating.count >= 1) {
                        reward = 5;
                        task.dating.count--;
                        description = 'Đi hẹn hò';
                    }
                    break;
                default:
                    return res.status(400).json({ message: 'Loại nhiệm vụ không hợp lệ' });
            }

            if (reward > 0) {
                // Thêm xu và lưu thay đổi
                coin.addCoins(reward, 'TASK_REWARD', description);
                await coin.save();
                await task.save();

                res.json({
                    message: 'Nhận thưởng thành công',
                    reward,
                    newBalance: coin.balance
                });
            } else {
                res.status(400).json({ message: 'Không thể nhận thưởng' });
            }
        } catch (error) {
            console.error('Lỗi khi nhận thưởng:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    exchangeReward: async (req, res) => {
        try {
            const userId = req.userId;
            const { amount, coins } = req.body;
            
            console.log('exchangeReward - userId:', userId);
            console.log('exchangeReward - amount:', amount);
            console.log('exchangeReward - coins:', coins);

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
            }

            // Kiểm tra số xu và số tiền hợp lệ
            if ((coins !== 300 || amount !== 50000) && (coins !== 500 || amount !== 100000)) {
                return res.status(400).json({ message: 'Số xu hoặc số tiền không hợp lệ' });
            }

            // Tìm tài khoản xu
            const coin = await Coin.findOne({ userId });
            if (!coin) {
                return res.status(404).json({ message: 'Không tìm thấy tài khoản xu' });
            }

            // Kiểm tra số dư
            if (coin.balance < coins) {
                return res.status(400).json({ message: 'Số dư không đủ' });
            }

            // Trừ xu và lưu thay đổi
            coin.deductCoins(coins, 'EXCHANGE_REWARD', `Đổi ${amount.toLocaleString('vi-VN')}VNĐ`);
            await coin.save();

            res.json({
                message: 'Đổi thưởng thành công',
                exchangedAmount: amount,
                newBalance: coin.balance
            });
        } catch (error) {
            console.error('Lỗi khi đổi thưởng:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
};

module.exports = taskController; 