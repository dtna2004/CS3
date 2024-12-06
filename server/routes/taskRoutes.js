const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// Middleware để validate request body cho claim reward
const validateClaimReward = (req, res, next) => {
    const { taskType } = req.body;
    
    if (!taskType) {
        return res.status(400).json({ message: 'Thiếu thông tin loại nhiệm vụ' });
    }

    const validTaskTypes = ['daily-login', 'messages', 'profile-visits', 'avatar-change', 'dating'];
    if (!validTaskTypes.includes(taskType)) {
        return res.status(400).json({ message: 'Loại nhiệm vụ không hợp lệ' });
    }

    next();
};

// Middleware để validate request body cho exchange reward
const validateExchangeReward = (req, res, next) => {
    const { amount, coins } = req.body;
    
    if (!amount || !coins) {
        return res.status(400).json({ message: 'Thiếu thông tin số xu hoặc số tiền' });
    }

    if ((coins !== 300 || amount !== 50000) && (coins !== 500 || amount !== 100000)) {
        return res.status(400).json({ message: 'Số xu hoặc số tiền không hợp lệ' });
    }

    next();
};

// Lấy trạng thái nhiệm vụ
router.get('/status', authenticateToken, taskController.getTaskStatus);

// Nhận thưởng nhiệm vụ
router.post('/claim', authenticateToken, validateClaimReward, taskController.claimReward);

// Đổi thưởng
router.post('/exchange', authenticateToken, validateExchangeReward, taskController.exchangeReward);

module.exports = router; 