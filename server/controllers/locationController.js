const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo Google AI
const genAI = new GoogleGenerativeAI('AIzaSyA6-W9fSgwDFSjf2i-gnirXwfaiah6M2zg');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

exports.analyzeLocation = async (req, res) => {
    try {
        const { location, currentLocation } = req.body;

        // Tạo prompt cho AI
        const prompt = `Hãy phân tích địa điểm sau cho một buổi hẹn hò:
Tên địa điểm: ${location.name}
Loại địa điểm: ${location.details.amenity || location.details.leisure || location.details.tourism || 'Không xác định'}
Khoảng cách: ${calculateDistance(currentLocation, location)} km

Hãy đánh giá và gợi ý theo các tiêu chí:
1. Mức độ phù hợp cho hẹn hò (thang điểm 1-5)
2. Các lý do địa điểm này phù hợp cho hẹn hò
3. Gợi ý các hoạt động có thể thực hiện ở đây
4. Thời điểm thích hợp để đến

Trả về kết quả theo định dạng JSON với các trường: rating, reasons, activities, bestTime`;

        // Gọi AI để phân tích
        const result = await model.generateContent(prompt);
        const response = result.response;
        let analysis = JSON.parse(response.text());

        // Chuẩn hóa kết quả
        analysis = {
            rating: Math.min(5, Math.max(1, analysis.rating)), // Đảm bảo rating từ 1-5
            reasons: analysis.reasons.slice(0, 5), // Giới hạn 5 lý do
            activities: analysis.activities.slice(0, 5), // Giới hạn 5 hoạt động
            bestTime: analysis.bestTime
        };

        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing location:', error);
        res.status(500).json({ 
            message: 'Lỗi khi phân tích địa điểm',
            error: error.message 
        });
    }
};

// Hàm tính khoảng cách giữa 2 điểm
function calculateDistance(point1, point2) {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);
    const lat1 = toRad(point1.lat);
    const lat2 = toRad(point2.lat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
}

function toRad(value) {
    return value * Math.PI / 180;
} 