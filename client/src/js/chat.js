//import { API_URL, DEFAULT_AVATAR } from './constants.js';
//import videoCallService from './services/videoCall.js';

let currentChatUser = null;
let currentPage = 1;
let isLoadingMessages = false;
let hasMoreMessages = true;
let messageInterval = null;

let map;
let markers = [];
let currentUserLocation;
let otherUserLocation;
const OPENCAGE_API_KEY = 'aa5f4d7ebbe945ec8a1227beb9020ed2';
const GOOGLE_AI_API_KEY = 'AIzaSyA6-W9fSgwDFSjf2i-gnirXwfaiah6M2zg';

// Khởi tạo bản đồ Leaflet
function initMap() {
    const defaultLocation = [10.7769, 106.7009]; // Ho Chi Minh City
    map = L.map('placesMap').setView(defaultLocation, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Hiển thị modal gợi ý địa điểm
function suggestPlaces() {
    document.getElementById('placesSuggestionModal').style.display = 'flex';
    if (!map) {
        initMap();
    }
    getCurrentUserLocation();
    getOtherUserLocation();
}

// Đóng modal
function closePlacesModal() {
    document.getElementById('placesSuggestionModal').style.display = 'none';
}

// Lấy vị trí hiện tại của người dùng
function getCurrentUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentUserLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                searchNearbyPlaces();
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.');
            }
        );
    }
}

// Lấy vị trí của người dùng khác từ server
async function getOtherUserLocation() {
    try {
        // Lấy ID của người dùng hiện tại đang chat
        const chatUserId = document.getElementById('chatUserName').getAttribute('data-user-id');
        if (!chatUserId) return null;

        const response = await fetch(`${API_URL}/users/${chatUserId}/location`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        if (data.success && data.location) {
            return {
                lat: parseFloat(data.location.latitude),
                lng: parseFloat(data.location.longitude)
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting other user location:', error);
        return null;
    }
}

// Tìm địa điểm ở giữa hai người
async function searchNearbyPlaces() {
    if (!currentUserLocation) {
        alert('Không thể lấy được vị trí của bạn. Vui lòng cho phép truy cập vị trí.');
        return;
    }

    // Lấy vị trí người dùng kia
    otherUserLocation = await getOtherUserLocation();
    if (!otherUserLocation) {
        alert('Không thể lấy được vị trí của người kia. Sẽ chỉ tìm quanh vị trí của bạn.');
        otherUserLocation = currentUserLocation;
    }

    // Tính điểm giữa
    const midpoint = {
        lat: (currentUserLocation.lat + otherUserLocation.lat) / 2,
        lng: (currentUserLocation.lng + otherUserLocation.lng) / 2
    };

    // Tính khoảng cách giữa 2 người (theo km)
    const distance = calculateDistance(
        currentUserLocation.lat, currentUserLocation.lng,
        otherUserLocation.lat, otherUserLocation.lng
    );

    // Cập nhật vị trí bản đồ
    map.setView([midpoint.lat, midpoint.lng], getZoomLevel(distance));

    // Xóa markers cũ
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Thêm marker cho vị trí của 2 người
    const userMarker1 = L.marker([currentUserLocation.lat, currentUserLocation.lng])
        .bindPopup('Vị trí của bạn')
        .addTo(map);
    const userMarker2 = L.marker([otherUserLocation.lat, otherUserLocation.lng])
        .bindPopup('Vị trí người kia')
        .addTo(map);
    markers.push(userMarker1, userMarker2);

    // Vẽ đường nối giữa 2 người
    const line = L.polyline([
        [currentUserLocation.lat, currentUserLocation.lng],
        [otherUserLocation.lat, otherUserLocation.lng]
    ], {color: 'red', dashArray: '5, 10'}).addTo(map);
    markers.push(line);

    const placeType = document.getElementById('placeType').value;
    const priceLevel = document.getElementById('priceLevel').value;

    try {
        // Sử dụng OpenCage để lấy thông tin địa chỉ của điểm giữa
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${midpoint.lat}+${midpoint.lng}&key=${OPENCAGE_API_KEY}`);
        const data = await response.json();
        
        if (data.results && data.results[0]) {
            const location = data.results[0].formatted;
            
            // Tạo danh sách địa điểm xung quanh điểm giữa
            let suggestions = generateNearbyPlaces(midpoint, placeType, distance/2);

            // Lọc theo mức giá nếu có
            if (priceLevel) {
                suggestions = suggestions.map(place => ({
                    ...place,
                    description: place.description + (
                        priceLevel === '1' ? ' - Giá cả phải chăng' :
                        priceLevel === '2' ? ' - Giá trung bình' :
                        ' - Cao cấp'
                    )
                }));
            }

            displayPlaces(suggestions, midpoint);
            
            // Hiển thị thông tin khoảng cách
            const distanceInfo = document.createElement('div');
            distanceInfo.className = 'distance-info';
            distanceInfo.innerHTML = `
                <p>Khoảng cách giữa 2 người: ${distance.toFixed(1)}km</p>
                <p>Đang tìm địa điểm trong bán kính ${(distance/2).toFixed(1)}km từ điểm giữa</p>
            `;
            document.getElementById('placesList').prepend(distanceInfo);
        }
    } catch (error) {
        console.error('Error searching places:', error);
        alert('Có lỗi xảy ra khi tìm kiếm địa điểm: ' + error.message);
    }
}

// Tính khoảng cách giữa 2 điểm (theo km)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Xác định zoom level dựa trên khoảng cách
function getZoomLevel(distance) {
    if (distance <= 1) return 15;
    if (distance <= 3) return 14;
    if (distance <= 7) return 13;
    if (distance <= 15) return 12;
    return 11;
}

// Tạo danh sách địa điểm xung quanh một điểm
function generateNearbyPlaces(center, type, radius) {
    const places = [];
    const numPlaces = 5;
    const placeTypes = {
        restaurant: {
            names: ["Nhà hàng Phố Biển", "Nhà hàng Vườn Xanh", "La Maison", "Quán Ngon", "Nhà hàng Việt"],
            descriptions: [
                "Hải sản tươi sống, không gian lãng mạn",
                "Không gian sân vườn thoáng mát, món Việt Nam",
                "Ẩm thực Pháp tinh tế",
                "Món ăn đường phố đặc sắc",
                "Ẩm thực Việt Nam truyền thống"
            ]
        },
        cafe: {
            names: ["The Coffee House", "Highlands Coffee", "Cà phê Sân Vườn", "Trung Nguyên Legend", "Cà phê View Phố"],
            descriptions: [
                "Không gian hiện đại, cà phê đặc sản",
                "View đẹp, đồ uống đa dạng",
                "Không gian xanh mát, yên tĩnh",
                "Cà phê nguyên chất, không gian truyền thống",
                "View phố thị, không gian lãng mạn"
            ]
        },
        bar: {
            names: ["The Pub", "Skybar", "Wine & Dine", "Cocktail House", "Beer Club"],
            descriptions: [
                "Bar phong cách Anh, nhạc sống",
                "View toàn thành phố, cocktail đặc sắc",
                "Bar rượu vang sang trọng",
                "Cocktail sáng tạo, không gian hiện đại",
                "Bia thủ công, không gian sôi động"
            ]
        }
    };

    const selectedType = placeTypes[type];
    for (let i = 0; i < numPlaces; i++) {
        // Tạo vị trí ngẫu nhiên trong bán kính cho trước
        const angle = (2 * Math.PI * i) / numPlaces;
        const randomRadius = (Math.random() * 0.7 + 0.3) * radius; // 30-100% bán kính
        const lat = center.lat + (randomRadius / 111) * Math.cos(angle);
        const lng = center.lng + (randomRadius / 111) * Math.sin(angle);

        places.push({
            name: selectedType.names[i],
            address: `${Math.floor(Math.random() * 100 + 1)} ${generateStreetName()}, ${generateDistrict()}`,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0
            description: selectedType.descriptions[i],
            location: { lat, lng }
        });
    }

    return places;
}

// Tạo tên đường ngẫu nhiên
function generateStreetName() {
    const streets = [
        "Đường Lê Lợi", "Đường Nguyễn Huệ", "Đường Đồng Khởi",
        "Đường Lý Tự Trọng", "Đường Pasteur", "Đường Nam Kỳ Khởi Nghĩa",
        "Đường Nguyễn Du", "Đường Tôn Đức Thắng", "Đường Hai Bà Trưng"
    ];
    return streets[Math.floor(Math.random() * streets.length)];
}

// Tạo tên quận ngẫu nhiên
function generateDistrict() {
    const districts = [
        "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 10",
        "Quận Bình Thạnh", "Quận Phú Nhuận", "Quận Tân Bình"
    ];
    return districts[Math.floor(Math.random() * districts.length)];
}

// Hiển thị danh sách địa điểm
function displayPlaces(places, center) {
    const placesList = document.getElementById('placesList');
    placesList.innerHTML = '';

    places.forEach((place, index) => {
        // Tạo marker trên bản đồ (vị trí tương đối so với điểm giữa)
        const markerLatLng = [
            center.lat + (Math.random() - 0.5) * 0.01,
            center.lng + (Math.random() - 0.5) * 0.01
        ];
        
        const marker = L.marker(markerLatLng)
            .bindPopup(place.name)
            .addTo(map);
        markers.push(marker);

        // Tạo card hiển thị thông tin địa điểm
        const placeCard = document.createElement('div');
        placeCard.className = 'place-card';
        placeCard.innerHTML = `
            <div class="place-name">${index + 1}. ${place.name}</div>
            <div class="place-rating">
                ${'⭐'.repeat(Math.round(place.rating))}
                (${place.rating})
            </div>
            <div class="place-address">${place.address}</div>
            <div class="place-description">${place.description}</div>
        `;

        placeCard.addEventListener('click', () => {
            // Gửi địa điểm qua tin nhắn
            const message = `💡 Gợi ý địa điểm hẹn hò:\n${place.name}\nĐịa chỉ: ${place.address}\nĐánh giá: ${place.rating}⭐\nMô tả: ${place.description}`;
            document.getElementById('messageInput').value = message;
            closePlacesModal();
        });

        placesList.appendChild(placeCard);
    });
}

// Thêm event listeners
document.getElementById('placeType').addEventListener('change', searchNearbyPlaces);
document.getElementById('priceLevel').addEventListener('change', searchNearbyPlaces);

// Thêm vào window object để có thể gọi từ HTML
window.suggestPlaces = suggestPlaces;
window.closePlacesModal = closePlacesModal;

async function loadMatches() {
    try {
        console.log('Loading matches...');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_URL}/matches`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const matches = await response.json();
        console.log('Matches loaded:', matches);
        
        const acceptedMatches = matches.filter(match => match.status === 'accepted');
        
        const matchesWithLastMessage = await Promise.all(acceptedMatches.map(async match => {
            const otherUserId = match.sender._id === localStorage.getItem('userId') 
                ? match.receiver._id 
                : match.sender._id;
            
            try {
                const messageResponse = await fetch(`${API_URL}/messages/${otherUserId}/last`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                
                if (messageResponse.ok) {
                    const lastMessage = await messageResponse.json();
                    return { ...match, lastMessage };
                }
            } catch (error) {
                console.error('Error loading last message:', error);
            }
            return match;
        }));

        renderChatUsers(matchesWithLastMessage);
    } catch (error) {
        console.error('Error loading matches:', error);
        const errorMessage = error.response ? await error.response.text() : error.message;
        console.error('Detailed error:', errorMessage);
        alert('Có lỗi xảy ra khi tải danh sách chat');
    }
}

function renderChatUsers(matches) {
    const container = document.getElementById('chatUsersList');
    if (!container) return;

    container.innerHTML = '';

    if (!matches || matches.length === 0) {
        container.innerHTML = `
            <div class="no-chats">
                <i class="empty-icon">💬</i>
                <p>Chưa có cuộc trò chuyện nào</p>
            </div>`;
        return;
    }

    matches.forEach(match => {
        const otherUser = match.sender._id === localStorage.getItem('userId') 
            ? match.receiver 
            : match.sender;

        const userDiv = document.createElement('div');
        userDiv.className = 'chat-user';
        userDiv.dataset.userId = otherUser._id;
        
        const lastMessageClass = match.lastMessage ? 
            (match.lastMessage.sender === localStorage.getItem('userId') ? 'own-message' : 'other-message') 
            : '';

        userDiv.innerHTML = `
            <img src="${otherUser.avatar || DEFAULT_AVATAR}" alt="Avatar" class="clickable-avatar">
            <div class="chat-user-info">
                <h4>${otherUser.name || 'Người dùng'}</h4>
                <div class="user-status">Đang kiểm tra...</div>
                <p class="last-message ${lastMessageClass}">
                    ${match.lastMessage ? match.lastMessage.content : 'Chưa có tin nhắn'}
                </p>
            </div>
        `;

        userDiv.addEventListener('click', () => {
            selectChatUser(otherUser);
        });

        container.appendChild(userDiv);

        // Kiểm tra trạng thái online
        window.videoCallService.checkUserOnline(otherUser._id);
    });
}

function selectChatUser(user) {
    currentChatUser = user;
    currentPage = 1;
    hasMoreMessages = true;
    
    document.getElementById('chatUserAvatar').src = user.avatar || DEFAULT_AVATAR;
    document.getElementById('chatUserName').textContent = user.name;
    
    document.getElementById('userStatus').style.display = 'block';
    document.getElementById('chatControls').style.display = 'flex';

    document.querySelectorAll('.chat-user').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.userId === user._id) {
            el.classList.add('active');
        }
    });

    loadMessages(user._id);

    if (messageInterval) {
        clearInterval(messageInterval);
    }
    messageInterval = setInterval(() => {
        if (currentChatUser) {
            loadMessages(currentChatUser._id);
        }
    }, 5000);
}

async function loadMessages(userId, page = 1, append = false) {
    if (isLoadingMessages || (!hasMoreMessages && page > 1)) return;

    try {
        isLoadingMessages = true;
        const response = await fetch(
            `${API_URL}/messages/${userId}?page=${page}&limit=20`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            hasMoreMessages = data.hasMore;
            
            if (append) {
                prependMessages(data.messages);
            } else {
                renderMessages(data.messages);
            }
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    } finally {
        isLoadingMessages = false;
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageDiv = createMessageElement(message);
        container.appendChild(messageDiv);
    });

    scrollToBottom();
}

function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === localStorage.getItem('userId') ? 'sent' : 'received'}`;
    messageDiv.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-time">${formatMessageTime(message.createdAt)}</div>
    `;
    return messageDiv;
}

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN');
}

async function sendMessage() {
    if (!currentChatUser) {
        alert('Vui lòng chọn người để chat');
        return;
    }

    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content) return;

    try {
        const response = await fetch(`${API_URL}/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                receiverId: currentChatUser._id,
                content
            })
        });

        if (response.ok) {
            input.value = '';
            await loadMessages(currentChatUser._id);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Không thể gửi tin nhắn');
    }
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

function viewProfile() {
    if (currentChatUser) {
        window.location.href = `user-profile.html?id=${currentChatUser._id}`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Chat page loaded');
    
    // Đảm bảo videoCallService được khởi tạo với userId
    if (window.videoCallService && localStorage.getItem('userId')) {
        window.videoCallService.socket.emit('register-user', localStorage.getItem('userId'));
    }
    
    // Ẩn controls khi mới load trang
    document.getElementById('userStatus').style.display = 'none';
    document.getElementById('chatControls').style.display = 'none';
    
    // Load danh sách chat
    await loadMatches();
    
    // Setup message input
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Check URL params để mở chat với user cụ thể
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    if (userId) {
        const matches = document.querySelectorAll('.chat-user');
        matches.forEach(match => {
            if (match.dataset.userId === userId) {
                match.click();
            }
        });
    }
});

async function startVideoCall() {
    if (!currentChatUser) {
        alert('Vui lòng chọn người để gọi');
        return;
    }

    try {
        await videoCallService.startCall(currentChatUser._id, currentChatUser.name);
        videoCallService.showVideoCallModal();
    } catch (error) {
        console.error('Error starting video call:', error);
        alert('Không thể bắt đầu cuộc gọi video');
    }
}

// Export các functions cần thiết cho window object
window.startVideoCall = startVideoCall;
window.sendMessage = sendMessage;
window.viewProfile = viewProfile;

// Xử lý emoji picker
const emojiButton = document.getElementById('emojiButton');
const emojiPicker = document.getElementById('emojiPicker');
const messageInput = document.getElementById('messageInput');

emojiButton.addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
});

// Đóng emoji picker khi click ra ngoài
document.addEventListener('click', (e) => {
    if (!emojiButton.contains(e.target) && !emojiPicker.contains(e.target)) {
        emojiPicker.style.display = 'none';
    }
});

// Xử lý khi chọn emoji
document.querySelectorAll('.emoji-item').forEach(emoji => {
    emoji.addEventListener('click', () => {
        const emojiChar = emoji.getAttribute('data-emoji');
        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(cursorPos);
        
        messageInput.value = textBefore + emojiChar + textAfter;
        messageInput.focus();
        messageInput.setSelectionRange(cursorPos + emojiChar.length, cursorPos + emojiChar.length);
        
        emojiPicker.style.display = 'none';
    });
});