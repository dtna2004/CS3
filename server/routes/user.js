const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.get('/profile', authenticateToken, userController.getProfile);
router.get('/:id', authenticateToken, userController.getUserProfile);
router.put('/update', authenticateToken, userController.updateProfile);
router.put('/avatar', authenticateToken, userController.updateAvatar);
router.put('/location', authenticateToken, userController.updateLocation);
// Thêm route cập nhật vị trí
router.post('/update-location', authenticateToken, userController.updateLocation);

module.exports = router; 