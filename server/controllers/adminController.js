const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const Match = require('../models/Match');
const { COMPATIBILITY_MATRICES, WEIGHTS } = require('../utils/matchingAlgorithm');

// Đường dẫn đến file chứa weights và matrices
const WEIGHTS_FILE = path.join(__dirname, '../data/weights.json');
const MATRICES_DIR = path.join(__dirname, '../data/matrices');

// Đảm bảo thư mục tồn tại
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

// Khởi tạo file nếu chưa tồn tại
async function initializeFiles() {
    await ensureDirectoryExists(MATRICES_DIR);

    // Khởi tạo weights mặc định
    try {
        await fs.access(WEIGHTS_FILE);
    } catch {
        await fs.writeFile(WEIGHTS_FILE, JSON.stringify(WEIGHTS, null, 2));
    }

    // Khởi tạo matrices mặc định
    const matrixTypes = ['occupation', 'interests', 'lifestyle', 'goals', 'values'];
    for (const type of matrixTypes) {
        const matrixPath = path.join(MATRICES_DIR, `${type}.json`);
        try {
            await fs.access(matrixPath);
        } catch {
            await fs.writeFile(
                matrixPath, 
                JSON.stringify(COMPATIBILITY_MATRICES[type], null, 2)
            );
        }
    }
}

// Khởi tạo files khi server starts
initializeFiles().catch(console.error);

// Controllers
exports.getWeights = async (req, res) => {
    try {
        const weights = await fs.readFile(WEIGHTS_FILE, 'utf8');
        res.json(JSON.parse(weights));
    } catch (error) {
        console.error('Error reading weights:', error);
        res.status(500).json({ error: 'Failed to read weights' });
    }
};

exports.updateWeights = async (req, res) => {
    try {
        const weights = req.body;
        
        // Validate weights
        const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
        if (Math.abs(total - 1) > 0.01) {
            return res.status(400).json({ 
                error: 'Total weights must equal 1' 
            });
        }

        await fs.writeFile(WEIGHTS_FILE, JSON.stringify(weights, null, 2));
        
        // Cập nhật WEIGHTS trong matchingAlgorithm
        Object.assign(WEIGHTS, weights);
        
        res.json({ message: 'Weights updated successfully' });
    } catch (error) {
        console.error('Error updating weights:', error);
        res.status(500).json({ error: 'Failed to update weights' });
    }
};

exports.getMatrix = async (req, res) => {
    try {
        const { type } = req.params;
        const matrixPath = path.join(MATRICES_DIR, `${type}.json`);
        const matrix = await fs.readFile(matrixPath, 'utf8');
        res.json(JSON.parse(matrix));
    } catch (error) {
        console.error('Error reading matrix:', error);
        res.status(500).json({ error: 'Failed to read matrix' });
    }
};

exports.updateMatrix = async (req, res) => {
    try {
        const { type } = req.params;
        const matrix = req.body;

        // Validate matrix
        if (!matrix || typeof matrix !== 'object') {
            return res.status(400).json({
                error: 'Invalid matrix format'
            });
        }

        const matrixPath = path.join(MATRICES_DIR, `${type}.json`);
        await fs.writeFile(matrixPath, JSON.stringify(matrix, null, 2));
        
        // Cập nhật COMPATIBILITY_MATRICES trong matchingAlgorithm
        COMPATIBILITY_MATRICES[type] = matrix;
        
        res.json({ message: 'Matrix updated successfully' });
    } catch (error) {
        console.error('Error updating matrix:', error);
        res.status(500).json({ error: 'Failed to update matrix' });
    }
};

exports.getAnalysis = async (req, res) => {
    try {
        // Tổng số người dùng
        const totalUsers = await User.countDocuments();

        // Số lượng match đang hoạt động
        const activeMatches = await Match.countDocuments({ status: 'active' });

        // Tỷ lệ thành công
        const successfulMatches = await Match.countDocuments({ status: 'success' });
        const totalMatches = await Match.countDocuments();
        const successRate = totalMatches > 0 ? 
            (successfulMatches / totalMatches) * 100 : 0;

        // Điểm matching trung bình
        const matches = await Match.find().select('score');
        const averageScore = matches.reduce((sum, m) => sum + (m.score || 0), 0) / 
            (matches.length || 1);

        // Phân phối điểm matching
        const scoreDistribution = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0
        };

        matches.forEach(match => {
            const score = Math.floor(match.score * 100);
            if (score <= 20) scoreDistribution['0-20']++;
            else if (score <= 40) scoreDistribution['21-40']++;
            else if (score <= 60) scoreDistribution['41-60']++;
            else if (score <= 80) scoreDistribution['61-80']++;
            else scoreDistribution['81-100']++;
        });

        res.json({
            totalUsers,
            activeMatches,
            successfulMatches,
            successRate: successRate.toFixed(1) + '%',
            averageScore: (averageScore * 100).toFixed(1) + '%',
            scoreDistribution
        });
    } catch (error) {
        console.error('Error getting analysis:', error);
        res.status(500).json({ error: 'Failed to get analysis data' });
    }
};

exports.exportUsers = async (req, res) => {
    try {
        // Lấy danh sách users với thông tin cơ bản
        const users = await User.find()
            .select('name email age gender occupation location interests lifestyle goals values createdAt')
            .lean();

        // Lấy thông tin matches cho mỗi user
        const matches = await Match.find().lean();
        const userMatches = {};
        
        matches.forEach(match => {
            const user1Id = match.user1.toString();
            const user2Id = match.user2.toString();
            
            if (!userMatches[user1Id]) userMatches[user1Id] = [];
            if (!userMatches[user2Id]) userMatches[user2Id] = [];
            
            userMatches[user1Id].push(match);
            userMatches[user2Id].push(match);
        });

        // Format dữ liệu export
        const exportData = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            age: user.age,
            gender: user.gender,
            occupation: user.occupation,
            location: user.location?.coordinates?.join(', '),
            interests: user.interests?.join('; '),
            lifestyle: user.lifestyle?.join('; '),
            goals: user.goals?.join('; '),
            values: user.values?.join('; '),
            matchCount: userMatches[user._id.toString()]?.length || 0,
            successRate: calculateSuccessRate(userMatches[user._id.toString()]),
            joinDate: user.createdAt
        }));

        res.json(exportData);
    } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).json({ error: 'Failed to export user data' });
    }
};

// Helper function
function calculateSuccessRate(matches) {
    if (!matches?.length) return '0%';
    const successful = matches.filter(m => m.status === 'success').length;
    return ((successful / matches.length) * 100).toFixed(1) + '%';
}