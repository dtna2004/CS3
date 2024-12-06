const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const { authenticateToken } = require('../middleware/auth');

router.get('/potential-matches', authenticateToken, matchingController.getPotentialMatches);

module.exports = router; 