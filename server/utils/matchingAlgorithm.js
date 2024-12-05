const fs = require('fs');
const path = require('path');

// Đường dẫn đến các file JSON
const weightsPath = path.join(__dirname, '../data/weights.json');
const matricesPath = path.join(__dirname, '../data/matrices.json');

// Hàm đọc file JSON
function readJsonFile(filePath, defaultValue) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
    }
    return defaultValue;
}

// Khởi tạo weights và matrices mặc định
const DEFAULT_WEIGHTS = {
    distance: 0.15,
    age: 0.15,
    occupation: 0.1,
    interests: 0.2,
    lifestyle: 0.15,
    goals: 0.15,
    values: 0.1
};

// Đọc weights và matrices
let WEIGHTS = readJsonFile(weightsPath, DEFAULT_WEIGHTS);
let COMPATIBILITY_MATRICES = readJsonFile(matricesPath, {
    occupation: [],
    interests: [],
    lifestyle: [],
    goals: [],
    values: []
});

// Hàm cập nhật weights và matrices khi có thay đổi
function updateWeightsAndMatrices() {
    WEIGHTS = readJsonFile(weightsPath, DEFAULT_WEIGHTS);
    COMPATIBILITY_MATRICES = readJsonFile(matricesPath, COMPATIBILITY_MATRICES);
}

function calculateDistance(location1, location2) {
    if (!location1?.coordinates || !location2?.coordinates) {
        console.log('Missing coordinates:', {
            location1: location1?.coordinates,
            location2: location2?.coordinates
        });
        return 0;
    }
    
    const R = 6371; // Bán kính trái đất tính bằng km
    
    // Lấy tọa độ từ GeoJSON format (longitude, latitude)
    const lon1 = location1.coordinates[0];
    const lat1 = location1.coordinates[1];
    const lon2 = location2.coordinates[0];
    const lat2 = location2.coordinates[1];
    
    // Chuyển đổi sang radian
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    // Công thức haversine
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Khoảng cách tính bằng km
    
    // Chuẩn hóa điểm số từ 0-1, với 50km là khoảng cách tối đa
    const score = Math.max(0, 1 - distance/50);
    
    console.log('Distance calculation:', {
        coordinates1: [lon1, lat1],
        coordinates2: [lon2, lat2],
        distance: distance.toFixed(2) + ' km',
        score: (score * 100).toFixed(0) + '%'
    });
    
    return score;
}

function calculateAgeScore(age1, age2) {
    if (!age1 || !age2) return 0;
    
    const ageDiff = Math.abs(age1 - age2);
    const score = Math.max(0, 1 - ageDiff/10); // 10 tuổi chênh lệch = 0 điểm
    
    console.log('Age score:', {
        age1,
        age2,
        difference: ageDiff,
        score: (score * 100).toFixed(0) + '%'
    });
    
    return score;
}

function calculateCompatibilityScore(item1, item2, matrix) {
    if (!matrix || !matrix[item1] || !matrix[item2]) {
        if (item1 === item2) return 1;
        return 0.5;
    }
    return matrix[item1][item2] || matrix[item2][item1] || 0.5;
}

function calculateArrayCompatibility(arr1, arr2, matrixType) {
    if (!arr1?.length || !arr2?.length) return 0;
    
    const matrix = COMPATIBILITY_MATRICES[matrixType];
    if (!matrix) return 0;

    let totalScore = 0;
    let count = 0;

    for (let i = 0; i < arr1.length; i++) {
        for (let j = 0; j < arr2.length; j++) {
            const score = calculateCompatibilityScore(arr1[i], arr2[j], matrix);
            if (score !== undefined) {
                totalScore += score;
                count++;
            }
        }
    }

    const finalScore = count > 0 ? totalScore / count : 0;
    
    console.log(`${matrixType} compatibility:`, {
        items1: arr1,
        items2: arr2,
        score: (finalScore * 100).toFixed(0) + '%'
    });
    
    return finalScore;
}

function calculateMatchScore(user1, user2) {
    // Đảm bảo weights được cập nhật
    updateWeightsAndMatrices();

    let totalScore = 0;
    let totalWeight = 0;

    console.log('Calculating match score between:', {
        user1: user1?.name || 'Unknown',
        user2: user2?.name || 'Unknown'
    });

    // Tính điểm khoảng cách
    if (user1?.location && user2?.location) {
        const distanceScore = calculateDistance(user1.location, user2.location);
        totalScore += Number(distanceScore) * Number(WEIGHTS.distance);
        totalWeight += Number(WEIGHTS.distance);
    }

    // Tính điểm tuổi tác
    if (user1?.age && user2?.age) {
        const ageScore = calculateAgeScore(user1.age, user2.age);
        totalScore += Number(ageScore) * Number(WEIGHTS.age);
        totalWeight += Number(WEIGHTS.age);
    }

    // Tính điểm nghề nghiệp
    if (user1?.occupation && user2?.occupation) {
        const occupationScore = calculateCompatibilityScore(
            user1.occupation, 
            user2.occupation, 
            COMPATIBILITY_MATRICES.occupation
        );
        totalScore += Number(occupationScore) * Number(WEIGHTS.occupation);
        totalWeight += Number(WEIGHTS.occupation);
        
        console.log('Occupation score:', {
            occupation1: user1.occupation,
            occupation2: user2.occupation,
            score: (occupationScore * 100).toFixed(0) + '%'
        });
    }

    // Tính điểm sở thích
    if (user1?.interests?.length && user2?.interests?.length) {
        const interestScore = calculateArrayCompatibility(user1.interests, user2.interests, 'interests');
        totalScore += Number(interestScore) * Number(WEIGHTS.interests);
        totalWeight += Number(WEIGHTS.interests);
    }

    // Tính điểm lối sống
    if (user1?.lifestyle?.length && user2?.lifestyle?.length) {
        const lifestyleScore = calculateArrayCompatibility(
            user1.lifestyle, 
            user2.lifestyle, 
            'lifestyle'
        );
        totalScore += Number(lifestyleScore) * Number(WEIGHTS.lifestyle);
        totalWeight += Number(WEIGHTS.lifestyle);
    }

    // Tính điểm mục tiêu
    if (user1?.goals?.length && user2?.goals?.length) {
        const goalsScore = calculateArrayCompatibility(
            user1.goals,
            user2.goals,
            'goals'
        );
        totalScore += Number(goalsScore) * Number(WEIGHTS.goals);
        totalWeight += Number(WEIGHTS.goals);
    }

    // Tính điểm giá trị sống
    if (user1?.values?.length && user2?.values?.length) {
        const valuesScore = calculateArrayCompatibility(
            user1.values,
            user2.values,
            'values'
        );
        totalScore += Number(valuesScore) * Number(WEIGHTS.values);
        totalWeight += Number(WEIGHTS.values);
    }

    // Đảm bảo totalScore và totalWeight là số
    totalScore = Number(totalScore);
    totalWeight = Number(totalWeight);

    // Chuẩn hóa điểm số
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    try {
        console.log('Final score:', {
            totalScore: (totalScore * 100).toFixed(0) + '%',
            totalWeight: totalWeight.toFixed(2),
            finalScore: (finalScore * 100).toFixed(0) + '%'
        });
    } catch (error) {
        console.error('Error logging scores:', {
            totalScore,
            totalWeight,
            finalScore,
            error: error.message
        });
    }
    
    return finalScore;
}

module.exports = {
    calculateMatchScore,
    updateWeightsAndMatrices,
    WEIGHTS,
    COMPATIBILITY_MATRICES
}; 