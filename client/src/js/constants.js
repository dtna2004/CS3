const API_URL = 'http://localhost:3000/api';
const CLOUDINARY_URL='cloudinary://894487861293555:n9Xuwgk7KLqSwcIIEHBT1C8izgQ@djkesszqc';
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';
const DEFAULT_AVATAR = '../images/default-avatar.png';

const OPTIONS = {
    occupations: [
        'Kỹ sư phần mềm', 'Bác sĩ', 'Giáo viên', 'Luật sư', 'Nhà thiết kế đồ họa',
        'Kỹ sư xây dựng', 'Nhà báo', 'Kiến trúc sư', 'Chuyên viên marketing',
        'Nhà phát triển web', 'Nhân viên tài chính', 'Chuyên viên tuyển dụng',
        'Kỹ thuật viên điện tử', 'Nhà phân tích dữ liệu', 'Nghệ sĩ'
    ],
    interests: [
        'Đọc sách', 'Chơi nhạc cụ', 'Vẽ tranh', 'Chơi thể thao', 'Nấu ăn',
        'Chụp ảnh', 'Du lịch khám phá', 'Làm vườn', 'Chơi game', 'Viết lách',
        'Sưu tầm đồ vật', 'Chạy bộ hoặc tập gym', 'Xem phim', 'Học ngoại ngữ',
        'Thiền và yoga'
    ],
    lifestyle: [
        'Sống tối giản', 'Sống bền vững', 'Sống khỏe mạnh', 'Sống tự do du mục',
        'Sống năng động', 'Sống thư giãn', 'Sống hướng ngoại', 'Sống hướng nội',
        'Sống gia đình', 'Sống phiêu lưu', 'Sống nghệ thuật', 'Sống gần gũi với thiên nhiên',
        'Sống tập trung công việc', 'Sống hòa hợp', 'Sống vì cộng đồng'
    ],
    goals: [
        'Phát triển sự nghiệp vững chắc', 'Xây dựng gia đình hạnh phúc',
        'Sở hữu ngôi nhà riêng', 'Khám phá thế giới qua du lịch',
        'Tự do tài chính', 'Cải thiện sức khỏe thể chất và tinh thần',
        'Học hỏi kỹ năng mới', 'Đạt được bằng cấp hoặc chứng chỉ cao hơn',
        'Khởi nghiệp và phát triển công ty riêng', 'Tham gia và hỗ trợ cộng đồng',
        'Thăng tiến lên vị trí lãnh đạo', 'Viết và xuất bản một cuốn sách',
        'Tìm kiếm và duy trì các mối quan hệ chất lượng',
        'Trở thành chuyên gia trong lĩnh vực mình yêu thích',
        'Đóng góp vào công tác từ thiện và nhân đạo'
    ],
    values: [
        'Trung thực', 'Tôn trọng', 'Trách nhiệm', 'Lòng trung thành',
        'Tình yêu thương', 'Sáng tạo', 'Tính kiên trì', 'Tự do',
        'Cảm thông', 'Độc lập', 'Hòa bình', 'Lòng biết ơn',
        'Công bằng', 'Tính chính trực', 'Tính bền bỉ'
    ]
};

const MATCH_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    BLOCKED: 'blocked'
};

const GENDER = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other'
};

const MESSAGE_REFRESH_INTERVAL = 5000; // 5 seconds
const NOTIFICATION_REFRESH_INTERVAL = 30000; // 30 seconds

const ERROR_MESSAGES = {
    LOGIN_FAILED: 'Đăng nhập thất bại',
    REGISTER_FAILED: 'Đăng ký thất bại',
    NETWORK_ERROR: 'Lỗi kết nối mạng',
    SERVER_ERROR: 'Lỗi máy chủ',
    UNAUTHORIZED: 'Vui lòng đăng nhập lại'
};

const SUCCESS_MESSAGES = {
    PROFILE_UPDATED: 'Cập nhật thông tin thành công',
    MATCH_SENT: 'Đã gửi lời mời kết nối',
    MATCH_ACCEPTED: 'Đã chấp nhận lời mời kết nối',
    MATCH_REJECTED: 'Đã từ chối lời mời kết nối'
}; 