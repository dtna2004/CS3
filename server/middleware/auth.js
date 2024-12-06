const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token không đúng định dạng' });
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Token rỗng' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (!decoded.userId) {
                return res.status(401).json({ message: 'Token không chứa ID người dùng' });
            }

            req.userId = decoded.userId;
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token đã hết hạn' });
            }
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Token không hợp lệ' });
            }
            throw jwtError;
        }
    } catch (error) {
        console.error('Lỗi xác thực:', error);
        res.status(500).json({ message: 'Lỗi server khi xác thực' });
    }
};

module.exports = { authenticateToken }; 