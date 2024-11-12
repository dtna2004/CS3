const WEIGHTS = {
    distance: 0.2,
    age: 0.15,
    occupation: 0.1,
    interests: 0.15,
    lifestyle: 0.15,
    goals: 0.1,
    values: 0.1,
    orientation: 0.05
};

const COMPATIBILITY_MATRICES = {
    occupation: {
        'Kỹ sư phần mềm': {
            'Kỹ sư phần mềm': 1.0,
            'Nhà phát triển web': 0.9,
            'Nhà phân tích dữ liệu': 0.8,
            'Kỹ thuật viên điện tử': 0.7
        },
        'Bác sĩ': {
            'Bác sĩ': 1.0,
            'Giáo viên': 0.6,
            'Luật sư': 0.5
        },
        'Giáo viên': {
            'Giáo viên': 1.0,
            'Bác sĩ': 0.6,
            'Nhà báo': 0.5
        }
    },
    interests: {
        'Đọc sách': {
            'Viết lách': 0.9,
            'Học ngoại ngữ': 0.7
        },
        'Chơi thể thao': {
            'Chạy bộ hoặc tập gym': 0.9,
            'Du lịch khám phá': 0.6
        }
    },
    lifestyle: {
        'Sống tối giản': {
            'Sống bền vững': 0.8,
            'Sống khỏe mạnh': 0.7
        },
        'Sống năng động': {
            'Sống phiêu lưu': 0.9,
            'Sống hướng ngoại': 0.8
        }
    },
    goals: {
        'Phát triển sự nghiệp vững chắc': {
            'Tự do tài chính': 0.8,
            'Khởi nghiệp và phát triển công ty riêng': 0.7
        },
        'Xây dựng gia đình hạnh phúc': {
            'Tìm kiếm và duy trì các mối quan hệ chất lượng': 0.9
        }
    },
    values: {
        'Trung thực': {
            'Tính chính trực': 0.9,
            'Trách nhiệm': 0.8
        },
        'Tự do': {
            'Độc lập': 0.9,
            'Sáng tạo': 0.7
        }
    }
};

const calculateDistance = (location1, location2) => {
    if (!location1 || !location2) return 0;
    const R = 6371;
    const lat1 = location1.lat * Math.PI / 180;
    const lat2 = location2.lat * Math.PI / 180;
    const dLat = (location2.lat - location1.lat) * Math.PI / 180;
    const dLon = (location2.lng - location1.lng) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.max(0, 1 - distance/100);
};

const calculateAgeScore = (age1, age2) => {
    const ageDiff = Math.abs(age1 - age2);
    return Math.max(0, 1 - ageDiff/20);
};

const calculateCompatibilityScore = (item1, item2, matrix) => {
    if (!matrix[item1] || !matrix[item2]) return 0.5;
    return matrix[item1][item2] || matrix[item2][item1] || 0.5;
};

const calculateArrayCompatibility = (arr1, arr2, matrix) => {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    
    let totalScore = 0;
    let comparisons = 0;

    arr1.forEach(item1 => {
        arr2.forEach(item2 => {
            totalScore += calculateCompatibilityScore(item1, item2, matrix);
            comparisons++;
        });
    });

    return comparisons > 0 ? totalScore / comparisons : 0;
};

exports.calculateMatchScore = (user1, user2) => {
    const distanceScore = calculateDistance(user1.location, user2.location);
    const ageScore = calculateAgeScore(user1.age, user2.age);
    
    const occupationScore = calculateCompatibilityScore(
        user1.occupation,
        user2.occupation,
        COMPATIBILITY_MATRICES.occupation
    );

    const interestsScore = calculateArrayCompatibility(
        user1.interests,
        user2.interests,
        COMPATIBILITY_MATRICES.interests
    );

    const lifestyleScore = calculateArrayCompatibility(
        user1.lifestyle,
        user2.lifestyle,
        COMPATIBILITY_MATRICES.lifestyle
    );

    const goalsScore = calculateArrayCompatibility(
        user1.goals,
        user2.goals,
        COMPATIBILITY_MATRICES.goals
    );

    const valuesScore = calculateArrayCompatibility(
        user1.values,
        user2.values,
        COMPATIBILITY_MATRICES.values
    );

    const orientationScore = user1.orientation === user2.orientation ? 1 : 0;

    const totalScore = 
        WEIGHTS.distance * distanceScore +
        WEIGHTS.age * ageScore +
        WEIGHTS.occupation * occupationScore +
        WEIGHTS.interests * interestsScore +
        WEIGHTS.lifestyle * lifestyleScore +
        WEIGHTS.goals * goalsScore +
        WEIGHTS.values * valuesScore +
        WEIGHTS.orientation * orientationScore;

    return totalScore;
}; 