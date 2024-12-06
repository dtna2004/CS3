const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { updateWeightsAndMatrices } = require('../utils/matchingAlgorithm');

// Đường dẫn đến file JSON
const weightsPath = path.join(__dirname, '../data/weights.json');
const matricesPath = path.join(__dirname, '../data/matrices.json');

// Route để lấy weights
router.get('/weights', (req, res) => {
    try {
        const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
        res.json(weights);
    } catch (error) {
        console.error('Error reading weights:', error);
        res.status(500).json({ message: 'Lỗi khi đọc weights' });
    }
});

// Route để lưu weights
router.post('/weights', (req, res) => {
    try {
        fs.writeFileSync(weightsPath, JSON.stringify(req.body, null, 2));
        updateWeightsAndMatrices();
        res.json({ message: 'Lưu weights thành công' });
    } catch (error) {
        console.error('Error saving weights:', error);
        res.status(500).json({ message: 'Lỗi khi lưu weights' });
    }
});

// Route để lấy matrices
router.get('/matrices', (req, res) => {
    try {
        const matrices = JSON.parse(fs.readFileSync(matricesPath, 'utf8'));
        res.json(matrices);
    } catch (error) {
        console.error('Error reading matrices:', error);
        res.status(500).json({ message: 'Lỗi khi đọc matrices' });
    }
});

// Route để lưu matrices
router.post('/matrices', (req, res) => {
    try {
        fs.writeFileSync(matricesPath, JSON.stringify(req.body, null, 2));
        updateWeightsAndMatrices();
        res.json({ message: 'Lưu matrices thành công' });
    } catch (error) {
        console.error('Error saving matrices:', error);
        res.status(500).json({ message: 'Lỗi khi lưu matrices' });
    }
});

// Route để cập nhật weights và matrices
router.post('/update-matching-params', async (req, res) => {
    try {
        updateWeightsAndMatrices();
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Error updating matching parameters:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật tham số ghép cặp' });
    }
});

module.exports = router; 