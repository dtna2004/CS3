const Message = require('../models/Message');
const Match = require('../models/Match');

const messageController = {
    sendMessage: async (req, res) => {
        try {
            const { receiverId, content } = req.body;

            const match = await Match.findOne({
                $or: [
                    { sender: req.userId, receiver: receiverId },
                    { sender: receiverId, receiver: req.userId }
                ]
            });

            if (!match || match.status !== 'accepted') {
                return res.status(403).json({ 
                    message: 'Không thể gửi tin nhắn cho người này' 
                });
            }

            const message = new Message({
                sender: req.userId,
                receiver: receiverId,
                content
            });

            await message.save();
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    getMessages: async (req, res) => {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            const messages = await Message.find({
                $or: [
                    { sender: req.userId, receiver: userId },
                    { sender: userId, receiver: req.userId }
                ]
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

            await Message.updateMany(
                {
                    sender: userId,
                    receiver: req.userId,
                    read: false
                },
                { read: true }
            );

            const totalMessages = await Message.countDocuments({
                $or: [
                    { sender: req.userId, receiver: userId },
                    { sender: userId, receiver: req.userId }
                ]
            });

            res.json({
                messages: messages.reverse(),
                hasMore: skip + messages.length < totalMessages
            });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    getUnreadCount: async (req, res) => {
        try {
            const count = await Message.countDocuments({
                receiver: req.userId,
                read: false
            });

            res.json({ count });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    getLastMessage: async (req, res) => {
        try {
            const { userId } = req.params;
            
            const lastMessage = await Message.findOne({
                $or: [
                    { sender: req.userId, receiver: userId },
                    { sender: userId, receiver: req.userId }
                ]
            })
            .sort({ createdAt: -1 })
            .limit(1);

            res.json(lastMessage);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
};

module.exports = messageController; 