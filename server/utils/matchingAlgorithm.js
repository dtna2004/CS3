// Export các biến để có thể chỉnh sửa từ bên ngoài
exports.WEIGHTS = {
    distance: 0.15,
    age: 0.15,
    occupation: 0.1,
    interests: 0.2,
    lifestyle: 0.15,
    goals: 0.15,
    values: 0.1
};

exports.COMPATIBILITY_MATRICES = {
    occupation: [
        //KSP   Bác   GV    LS    TK    KSX   NB    KT    MKT   Web   TC    TD    KTV   DL    NS
        [1.0,  0.4,  0.5,  0.4,  0.6,  0.5,  0.4,  0.5,  0.5,  0.9,  0.5,  0.4,  0.7,  0.8,  0.3], // Kỹ sư phần mềm
        [0.4,  1.0,  0.7,  0.6,  0.3,  0.4,  0.4,  0.4,  0.4,  0.3,  0.5,  0.5,  0.4,  0.5,  0.5], // Bác sĩ
        [0.5,  0.7,  1.0,  0.6,  0.6,  0.5,  0.7,  0.6,  0.6,  0.5,  0.5,  0.7,  0.5,  0.6,  0.7], // Giáo viên
        [0.4,  0.6,  0.6,  1.0,  0.4,  0.5,  0.7,  0.5,  0.6,  0.4,  0.7,  0.7,  0.4,  0.5,  0.4], // Luật sư
        [0.6,  0.3,  0.6,  0.4,  1.0,  0.7,  0.6,  0.8,  0.7,  0.7,  0.4,  0.5,  0.5,  0.5,  0.8], // Thiết kế
        [0.5,  0.4,  0.5,  0.5,  0.7,  1.0,  0.5,  0.9,  0.5,  0.5,  0.6,  0.4,  0.7,  0.5,  0.6], // Kỹ sư xây dựng
        [0.4,  0.4,  0.7,  0.7,  0.6,  0.5,  1.0,  0.5,  0.7,  0.4,  0.5,  0.6,  0.4,  0.5,  0.7], // Nhà báo
        [0.5,  0.4,  0.6,  0.5,  0.8,  0.9,  0.5,  1.0,  0.5,  0.5,  0.5,  0.4,  0.6,  0.5,  0.7], // Kiến trúc sư
        [0.5,  0.4,  0.6,  0.6,  0.7,  0.5,  0.7,  0.5,  1.0,  0.6,  0.7,  0.8,  0.4,  0.6,  0.6], // Marketing
        [0.9,  0.3,  0.5,  0.4,  0.7,  0.5,  0.4,  0.5,  0.6,  1.0,  0.5,  0.4,  0.7,  0.8,  0.5], // Web Developer
        [0.5,  0.5,  0.5,  0.7,  0.4,  0.6,  0.5,  0.5,  0.7,  0.5,  1.0,  0.7,  0.4,  0.7,  0.4], // Tài chính
        [0.4,  0.5,  0.7,  0.7,  0.5,  0.4,  0.6,  0.4,  0.8,  0.4,  0.7,  1.0,  0.4,  0.5,  0.5], // Tuyển dụng
        [0.7,  0.4,  0.5,  0.4,  0.5,  0.7,  0.4,  0.6,  0.4,  0.7,  0.4,  0.4,  1.0,  0.7,  0.5], // Kỹ thuật viên
        [0.8,  0.5,  0.6,  0.5,  0.5,  0.5,  0.5,  0.5,  0.6,  0.8,  0.7,  0.5,  0.7,  1.0,  0.4], // Dữ liệu
        [0.3,  0.5,  0.7,  0.4,  0.8,  0.6,  0.7,  0.7,  0.6,  0.5,  0.4,  0.5,  0.5,  0.4,  1.0], // Nghệ sĩ
    ],

    interests: [
        //Đọc   Nhạc  Vẽ    TT    Nấu   Ảnh   DL    Vườn  Game  Viết  Sưu   Gym   Phim  NN    Yoga
        [1.0,  0.6,  0.6,  0.3,  0.4,  0.5,  0.6,  0.4,  0.4,  0.9,  0.5,  0.3,  0.7,  0.8,  0.5], // Đọc sách
        [0.6,  1.0,  0.7,  0.4,  0.3,  0.6,  0.5,  0.3,  0.4,  0.6,  0.6,  0.3,  0.6,  0.6,  0.5], // Nhạc cụ
        [0.6,  0.7,  1.0,  0.3,  0.4,  0.8,  0.5,  0.4,  0.4,  0.7,  0.6,  0.3,  0.6,  0.5,  0.5], // Vẽ
        [0.3,  0.4,  0.3,  1.0,  0.4,  0.5,  0.6,  0.5,  0.5,  0.3,  0.4,  0.9,  0.4,  0.4,  0.7], // Thể thao
        [0.4,  0.3,  0.4,  0.4,  1.0,  0.6,  0.6,  0.8,  0.3,  0.5,  0.4,  0.4,  0.5,  0.5,  0.5], // Nấu ăn
        [0.5,  0.6,  0.8,  0.5,  0.6,  1.0,  0.8,  0.6,  0.4,  0.6,  0.6,  0.4,  0.7,  0.6,  0.5], // Chụp ảnh
        [0.6,  0.5,  0.5,  0.6,  0.6,  0.8,  1.0,  0.5,  0.4,  0.6,  0.5,  0.5,  0.7,  0.8,  0.6], // Du lịch
        [0.4,  0.3,  0.4,  0.5,  0.8,  0.6,  0.5,  1.0,  0.3,  0.4,  0.5,  0.4,  0.4,  0.4,  0.6], // Làm vườn
        [0.4,  0.4,  0.4,  0.5,  0.3,  0.4,  0.4,  0.3,  1.0,  0.5,  0.7,  0.5,  0.8,  0.5,  0.3], // Game
        [0.9,  0.6,  0.7,  0.3,  0.5,  0.6,  0.6,  0.4,  0.5,  1.0,  0.5,  0.3,  0.7,  0.7,  0.4], // Viết lách
        [0.5,  0.6,  0.6,  0.4,  0.4,  0.6,  0.5,  0.5,  0.7,  0.5,  1.0,  0.4,  0.6,  0.5,  0.4], // Sưu tầm
        [0.3,  0.3,  0.3,  0.9,  0.4,  0.4,  0.5,  0.4,  0.5,  0.3,  0.4,  1.0,  0.4,  0.4,  0.8], // Gym
        [0.7,  0.6,  0.6,  0.4,  0.5,  0.7,  0.7,  0.4,  0.8,  0.7,  0.6,  0.4,  1.0,  0.6,  0.4], // Xem phim
        [0.8,  0.6,  0.5,  0.4,  0.5,  0.6,  0.8,  0.4,  0.5,  0.7,  0.5,  0.4,  0.6,  1.0,  0.5], // Ngoại ngữ
        [0.5,  0.5,  0.5,  0.7,  0.5,  0.5,  0.6,  0.6,  0.3,  0.4,  0.4,  0.8,  0.4,  0.5,  1.0], // Yoga
    ],

    lifestyle: [
        //TG    BV    KM    TDM   ND    TR    HN    HT    GD    PA    NT    TN    CV    HH    CD
        [1.0,  0.8,  0.7,  0.6,  0.4,  0.6,  0.4,  0.8,  0.5,  0.4,  0.6,  0.7,  0.5,  0.7,  0.5], // Sống tối giản
        [0.8,  1.0,  0.8,  0.5,  0.5,  0.6,  0.5,  0.7,  0.6,  0.5,  0.6,  0.9,  0.4,  0.8,  0.8], // Sống bền vững
        [0.7,  0.8,  1.0,  0.5,  0.8,  0.7,  0.6,  0.6,  0.7,  0.7,  0.5,  0.8,  0.6,  0.7,  0.6], // Sống khỏe mạnh
        [0.6,  0.5,  0.5,  1.0,  0.7,  0.4,  0.7,  0.4,  0.3,  0.9,  0.7,  0.6,  0.4,  0.5,  0.5], // Sống tự do du mục
        [0.4,  0.5,  0.8,  0.7,  1.0,  0.5,  0.9,  0.3,  0.5,  0.8,  0.6,  0.6,  0.7,  0.6,  0.7], // Sống năng động
        [0.6,  0.6,  0.7,  0.4,  0.5,  1.0,  0.4,  0.7,  0.7,  0.4,  0.7,  0.7,  0.5,  0.8,  0.6], // Sống thư giãn
        [0.4,  0.5,  0.6,  0.7,  0.9,  0.4,  1.0,  0.3,  0.5,  0.8,  0.6,  0.5,  0.7,  0.5,  0.7], // Sống hướng ngoại
        [0.8,  0.7,  0.6,  0.4,  0.3,  0.7,  0.3,  1.0,  0.6,  0.3,  0.7,  0.6,  0.6,  0.7,  0.5], // Sống hướng nội
        [0.5,  0.6,  0.7,  0.3,  0.5,  0.7,  0.5,  0.6,  1.0,  0.4,  0.5,  0.6,  0.6,  0.8,  0.7], // Sống gia đình
        [0.4,  0.5,  0.7,  0.9,  0.8,  0.4,  0.8,  0.3,  0.4,  1.0,  0.7,  0.6,  0.5,  0.5,  0.6], // Sống phiêu lưu
        [0.6,  0.6,  0.5,  0.7,  0.6,  0.7,  0.6,  0.7,  0.5,  0.7,  1.0,  0.7,  0.5,  0.7,  0.6], // Sống nghệ thuật
        [0.7,  0.9,  0.8,  0.6,  0.6,  0.7,  0.5,  0.6,  0.6,  0.6,  0.7,  1.0,  0.4,  0.8,  0.7], // Sống gần gũi thiên nhiên
        [0.5,  0.4,  0.6,  0.4,  0.7,  0.5,  0.7,  0.6,  0.6,  0.5,  0.5,  0.4,  1.0,  0.6,  0.5], // Sống tập trung công việc
        [0.7,  0.8,  0.7,  0.5,  0.6,  0.8,  0.5,  0.7,  0.8,  0.5,  0.7,  0.8,  0.6,  1.0,  0.8], // Sống hòa hợp
        [0.5,  0.8,  0.6,  0.5,  0.7,  0.6,  0.7,  0.5,  0.7,  0.6,  0.6,  0.7,  0.5,  0.8,  1.0], // Sống vì cộng đồng
    ],

    goals: [
        //SN    GD    NH    DL    TC    SK    KN    BC    KN    CĐ    LĐ    SA    QH    CG    TT
        [1.0,  0.5,  0.6,  0.4,  0.8,  0.6,  0.7,  0.7,  0.8,  0.5,  0.9,  0.5,  0.6,  0.8,  0.5], // Phát triển sự nghiệp
        [0.5,  1.0,  0.8,  0.4,  0.6,  0.7,  0.5,  0.5,  0.4,  0.6,  0.5,  0.4,  0.9,  0.5,  0.6], // Xây dựng gia đình
        [0.6,  0.8,  1.0,  0.4,  0.7,  0.6,  0.5,  0.5,  0.6,  0.5,  0.5,  0.4,  0.7,  0.5,  0.5], // Sở hữu nhà riêng
        [0.4,  0.4,  0.4,  1.0,  0.6,  0.6,  0.7,  0.5,  0.5,  0.6,  0.4,  0.6,  0.5,  0.6,  0.6], // Du lịch khám phá
        [0.8,  0.6,  0.7,  0.6,  1.0,  0.5,  0.6,  0.6,  0.8,  0.5,  0.7,  0.5,  0.6,  0.7,  0.5], // Tự do tài chính
        [0.6,  0.7,  0.6,  0.6,  0.5,  1.0,  0.7,  0.6,  0.5,  0.6,  0.5,  0.5,  0.7,  0.6,  0.6], // Sức khỏe thể chất
        [0.7,  0.5,  0.5,  0.7,  0.6,  0.7,  1.0,  0.8,  0.7,  0.6,  0.6,  0.7,  0.6,  0.8,  0.6], // Kỹ năng mới
        [0.7,  0.5,  0.5,  0.5,  0.6,  0.6,  0.8,  1.0,  0.7,  0.5,  0.7,  0.6,  0.5,  0.8,  0.5], // Bằng cấp cao hơn
        [0.8,  0.4,  0.6,  0.5,  0.8,  0.5,  0.7,  0.7,  1.0,  0.6,  0.8,  0.6,  0.5,  0.7,  0.6], // Khởi nghiệp
        [0.5,  0.6,  0.5,  0.6,  0.5,  0.6,  0.6,  0.5,  0.6,  1.0,  0.7,  0.6,  0.7,  0.6,  0.9], // Cộng đồng
        [0.9,  0.5,  0.5,  0.4,  0.7,  0.5,  0.6,  0.7,  0.8,  0.7,  1.0,  0.6,  0.6,  0.7,  0.7], // Lãnh đạo
        [0.5,  0.4,  0.4,  0.6,  0.5,  0.5,  0.7,  0.6,  0.6,  0.6,  0.6,  1.0,  0.5,  0.7,  0.6], // Sách ảnh
        [0.6,  0.9,  0.7,  0.5,  0.6,  0.7,  0.6,  0.5,  0.5,  0.7,  0.6,  0.5,  1.0,  0.6,  0.7], // Quan hệ chất lượng
        [0.8,  0.5,  0.5,  0.6,  0.7,  0.6,  0.8,  0.8,  0.7,  0.6,  0.7,  0.7,  0.6,  1.0,  0.6], // Chuyên gia
        [0.5,  0.6,  0.5,  0.6,  0.5,  0.6,  0.6,  0.5,  0.6,  0.9,  0.7,  0.6,  0.7,  0.6,  1.0], // Từ thiện
    ],

    values: [
        //TT    TR    TN    TrTh  TY    ST    KT    TD    CT    DL    HB    BO    CB    CT    BB
        [1.0,  0.8,  0.8,  0.9,  0.6,  0.5,  0.7,  0.5,  0.7,  0.5,  0.7,  0.7,  0.8,  0.9,  0.7], // Trung thực
        [0.8,  1.0,  0.8,  0.7,  0.8,  0.6,  0.6,  0.6,  0.8,  0.6,  0.8,  0.8,  0.8,  0.7,  0.6], // Tôn trọng
        [0.8,  0.8,  1.0,  0.7,  0.7,  0.6,  0.8,  0.5,  0.7,  0.6,  0.7,  0.7,  0.7,  0.8,  0.8], // Trách nhiệm
        [0.9,  0.7,  0.7,  1.0,  0.7,  0.5,  0.6,  0.5,  0.6,  0.5,  0.7,  0.8,  0.7,  0.8,  0.7], // Trung thành
        [0.6,  0.8,  0.7,  0.7,  1.0,  0.7,  0.6,  0.6,  0.9,  0.6,  0.8,  0.8,  0.7,  0.6,  0.6], // Tình yêu thương
        [0.5,  0.6,  0.6,  0.5,  0.7,  1.0,  0.7,  0.8,  0.7,  0.8,  0.7,  0.6,  0.6,  0.5,  0.7], // Sáng tạo
        [0.7,  0.6,  0.8,  0.6,  0.6,  0.7,  1.0,  0.7,  0.6,  0.7,  0.6,  0.6,  0.7,  0.7,  0.9], // Kiên trì
        [0.5,  0.6,  0.5,  0.5,  0.6,  0.8,  0.7,  1.0,  0.6,  0.9,  0.7,  0.5,  0.6,  0.5,  0.7], // Tự do
        [0.7,  0.8,  0.7,  0.6,  0.9,  0.7,  0.6,  0.6,  1.0,  0.6,  0.8,  0.8,  0.7,  0.6,  0.6], // Cảm thông
        [0.5,  0.6,  0.6,  0.5,  0.6,  0.8,  0.7,  0.9,  0.6,  1.0,  0.7,  0.5,  0.6,  0.5,  0.7], // Độc lập
        [0.7,  0.8,  0.7,  0.7,  0.8,  0.7,  0.6,  0.7,  0.8,  0.7,  1.0,  0.7,  0.8,  0.7,  0.6], // Hòa bình
        [0.7,  0.8,  0.7,  0.8,  0.8,  0.6,  0.6,  0.5,  0.8,  0.5,  0.7,  1.0,  0.7,  0.7,  0.6], // Biết ơn
        [0.8,  0.8,  0.7,  0.7,  0.7,  0.6,  0.7,  0.6,  0.7,  0.6,  0.8,  0.7,  1.0,  0.8,  0.7], // Công bằng
        [0.9,  0.7,  0.8,  0.8,  0.6,  0.5,  0.7,  0.5,  0.6,  0.5,  0.7,  0.7,  0.8,  1.0,  0.7], // Chính trực
        [0.7,  0.6,  0.8,  0.7,  0.6,  0.7,  0.9,  0.7,  0.6,  0.7,  0.6,  0.6,  0.7,  0.7,  1.0], // Bền bỉ
    ]
};

function calculateDistance(location1, location2) {
    if (!location1?.coordinates || !location2?.coordinates) return 0;
    
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
    
    // Chuẩn hóa điểm số từ 0-1, với 100km là khoảng cách tối đa
    return Math.max(0, 1 - distance/100);
}

function calculateAgeScore(age1, age2) {
    const ageDiff = Math.abs(age1 - age2);
    return Math.max(0, 1 - ageDiff/20);
}

function calculateCompatibilityScore(item1, item2, matrix) {
    if (!matrix[item1] || !matrix[item2]) {
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

    return count > 0 ? totalScore / count : 0;
}

exports.calculateMatchScore = (user1, user2) => {
    let totalScore = 0;
    let totalWeight = 0;

    // Tính điểm khoảng cách
    if (user1.location?.coordinates && user2.location?.coordinates) {
        const distanceScore = calculateDistance(user1.location, user2.location);
        totalScore += distanceScore * WEIGHTS.distance;
        totalWeight += WEIGHTS.distance;
        
        console.log('Distance score:', {
            user1Location: user1.location.coordinates,
            user2Location: user2.location.coordinates,
            distanceScore
        });
    }

    // Tính điểm tuổi tác
    if (user1.age && user2.age) {
        const ageDiff = Math.abs(user1.age - user2.age);
        const ageScore = 1 - Math.min(ageDiff / 10, 1);
        totalScore += ageScore * WEIGHTS.age;
        totalWeight += WEIGHTS.age;
    }

    // Tính điểm nghề nghiệp
    if (user1.occupation && user2.occupation) {
        const occupationScore = calculateCompatibilityScore(
            user1.occupation, 
            user2.occupation, 
            COMPATIBILITY_MATRICES.occupation
        );
        totalScore += occupationScore * WEIGHTS.occupation;
        totalWeight += WEIGHTS.occupation;
    }

    // Tính điểm sở thích
    if (user1.interests?.length && user2.interests?.length) {
        const interestScore = calculateArrayCompatibility(user1.interests, user2.interests, 'interests');
        totalScore += interestScore * WEIGHTS.interests;
        totalWeight += WEIGHTS.interests;
    }

    // Tính điểm lối sống
    if (user1.lifestyle?.length && user2.lifestyle?.length) {
        const lifestyleScore = calculateArrayCompatibility(
            user1.lifestyle, 
            user2.lifestyle, 
            'lifestyle'
        );
        totalScore += lifestyleScore * WEIGHTS.lifestyle;
        totalWeight += WEIGHTS.lifestyle;
    }

    // Tính điểm mục tiêu
    if (user1.goals?.length && user2.goals?.length) {
        const goalsScore = calculateArrayCompatibility(
            user1.goals,
            user2.goals,
            'goals'
        );
        totalScore += goalsScore * WEIGHTS.goals;
        totalWeight += WEIGHTS.goals;
    }

    // Tính điểm giá trị sống
    if (user1.values?.length && user2.values?.length) {
        const valuesScore = calculateArrayCompatibility(
            user1.values,
            user2.values,
            'values'
        );
        totalScore += valuesScore * WEIGHTS.values;
        totalWeight += WEIGHTS.values;
    }

    // Chuẩn hóa điểm số
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    console.log('Score details:', {
        users: [user1.name, user2.name],
        totalScore,
        totalWeight,
        finalScore
    });
    
    return finalScore;
}; 