const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
    register: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email đã tồn tại' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            const user = new User({
                email,
                password: hashedPassword
            });

            await user.save();
            
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            res.status(201).json({ token, userId: user._id });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Email không tồn tại' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Mật khẩu không đúng' });
            }

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
            res.json({ token, userId: user._id });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
};

module.exports = authController; 