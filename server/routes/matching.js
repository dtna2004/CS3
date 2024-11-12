const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const auth = require('../middleware/auth');

router.get('/potential-matches', auth, matchingController.getPotentialMatches);

module.exports = router; 