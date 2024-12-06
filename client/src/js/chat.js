//import { API_URL, DEFAULT_AVATAR } from './constants.js';
//import videoCallService from './services/videoCall.js';

let currentChatUser = null;
let currentPage = 1;
let isLoadingMessages = false;
let hasMoreMessages = true;
let messageInterval = null;

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

// Hàm xử lý modal địa điểm
function showLocationModal() {
    // Tạo modal nếu chưa có
    let modal = document.getElementById('locationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'locationModal';
        modal.className = 'location-modal';
        modal.innerHTML = `
            <div class="location-modal-content">
                <span class="close-modal">&times;</span>
                <h3>Gợi ý địa điểm hẹn hò</h3>
                <div id="mapContainer"></div>
                <div id="locationAnalysis"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Xử lý đóng modal
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => modal.style.display = 'none';
        
        // Click ngoài modal để đóng
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };

        // Khởi tạo bản đồ
        if (window.dateLocationSuggester) {
            window.dateLocationSuggester.init();
        }
    }

    modal.style.display = 'block';
}

function initChatControls() {
    const chatControls = document.getElementById('chatControls');
    if (!chatControls) return;

    // Xóa các nút và container cũ
    const oldElements = chatControls.querySelectorAll('.emoji-button, .location-button, .emoji-container');
    oldElements.forEach(el => el.remove());

    // Thêm nút emoji
    const emojiButton = document.createElement('button');
    emojiButton.className = 'emoji-button';
    emojiButton.innerHTML = '😊';
    emojiButton.onclick = (e) => {
        e.preventDefault();
        const emojiContainer = document.querySelector('.emoji-container');
        if (emojiContainer) {
            emojiContainer.style.display = emojiContainer.style.display === 'none' ? 'flex' : 'none';
        }
    };

    // Thêm container emoji
    const emojiContainer = document.createElement('div');
    emojiContainer.className = 'emoji-container';
    emojiContainer.style.display = 'none';

    // Thêm các emoji phổ biến
    const commonEmojis = [
        '😊', '😂', '🥰', '😍', '😘', '😭', '😅', '😉', '😎', '🥳',
        '👍', '❤️', '😋', '🤗', '😴', '🤔', '😇', '😜', '😡', '😱',
        '🎉', '✨', '💕', '💖', '💝', '💓', '💗', '💞', '💘', '💌'
    ];

    commonEmojis.forEach(emoji => {
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'emoji-item';
        emojiSpan.textContent = emoji;
        emojiSpan.onclick = () => {
            const messageInput = document.getElementById('messageInput');
            messageInput.value += emoji;
            emojiContainer.style.display = 'none';
        };
        emojiContainer.appendChild(emojiSpan);
    });

    // Thêm nút địa điểm
    const locationButton = document.createElement('button');
    locationButton.className = 'location-button';
    locationButton.innerHTML = '📍';
    locationButton.onclick = (e) => {
        e.preventDefault();
        showLocationModal();
    };

    // Thêm các phần tử vào DOM
    const messageInput = document.getElementById('messageInput');
    if (messageInput && messageInput.parentNode) {
        messageInput.parentNode.insertBefore(emojiButton, messageInput);
        messageInput.parentNode.insertBefore(locationButton, messageInput);
        messageInput.parentNode.appendChild(emojiContainer);
    }

    // Đóng emoji picker khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!emojiContainer.contains(e.target) && !emojiButton.contains(e.target)) {
            emojiContainer.style.display = 'none';
        }
    });
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chat page loaded');
    initChatControls();
    
    // Load script dateLocation.js
    const script = document.createElement('script');
    script.src = '/CS3/client/src/js/dateLocation.js';
    script.onload = () => {
        console.log('DateLocation script loaded');
    };
    document.head.appendChild(script);
});

// Chỉ gọi initChatControls một lần khi trang được load
document.addEventListener('DOMContentLoaded', initChatControls);

// Không cần gọi lại initChatControls trong selectChatUser
window.selectChatUser = function(user) {
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
};

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