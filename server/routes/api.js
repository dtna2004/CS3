const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware');

// Route phân tích địa điểm
router.post('/analyze-location', authMiddleware, locationController.analyzeLocation);

module.exports = router; 