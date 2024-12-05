const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Routes cho weights
router.get('/weights', adminController.getWeights);
router.post('/weights', adminController.updateWeights);

// Routes cho matrices
router.get('/matrix/:type', adminController.getMatrix);
router.post('/matrix/:type', adminController.updateMatrix);

// Routes cho phân tích và xuất dữ liệu
router.get('/analysis', adminController.getAnalysis);
router.get('/users/export', adminController.exportUsers);

module.exports = router;
