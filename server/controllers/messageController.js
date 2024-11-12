const Message = require('../models/Message');
const Match = require('../models/Match');

exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        const match = await Match.findOne({
            $or: [
                { sender: req.userId, receiver: receiverId },
                { sender: receiverId, receiver: req.userId }
            ],
            status: 'accepted'
        });

        if (!match) {
            return res.status(403).json({ message: 'Chưa kết nối với người này' });
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
};

exports.getMessages = async (req, res) => {
    try {
        const { userId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: req.userId, receiver: userId },
                { sender: userId, receiver: req.userId }
            ]
        }).sort({ createdAt: 1 });

        await Message.updateMany(
            {
                sender: userId,
                receiver: req.userId,
                read: false
            },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.userId,
            read: false
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getLastMessage = async (req, res) => {
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
}; 