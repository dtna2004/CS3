let currentChatUser = null;
let currentPage = 1;
let isLoadingMessages = false;
let hasMoreMessages = true;
let messageInterval = null;

async function loadMatches() {
    try {
        const response = await fetch(`${API_URL}/matches`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const matches = await response.json();
            const matchesWithLastMessage = await Promise.all(matches.map(async match => {
                const otherUserId = match.sender._id === localStorage.getItem('userId') 
                    ? match.receiver._id 
                    : match.sender._id;
                
                const messageResponse = await fetch(`${API_URL}/messages/${otherUserId}/last`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (messageResponse.ok) {
                    const lastMessage = await messageResponse.json();
                    return { ...match, lastMessage };
                }
                return match;
            }));
            renderChatUsers(matchesWithLastMessage);
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        alert('Có lỗi xảy ra khi tải danh sách chat');
    }
}

function renderChatUsers(matches) {
    const container = document.getElementById('chatUsersList');
    if (!container) return;

    container.innerHTML = '';

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
                <h4>${otherUser.name}</h4>
                <p class="last-message ${lastMessageClass}">
                    ${match.lastMessage ? match.lastMessage.content : 'Chưa có tin nhắn'}
                </p>
            </div>
        `;

        userDiv.querySelector('.clickable-avatar').addEventListener('click', () => {
            window.location.href = `user-profile.html?id=${otherUser._id}`;
        });
        
        userDiv.querySelector('.chat-user-info').addEventListener('click', () => {
            selectChatUser(otherUser);
        });

        container.appendChild(userDiv);
    });
}

function selectChatUser(user) {
    currentChatUser = user;
    currentPage = 1;
    hasMoreMessages = true;
    
    document.getElementById('chatUserAvatar').src = user.avatar || DEFAULT_AVATAR;
    document.getElementById('chatUserName').textContent = user.name;

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
    await loadMatches();
    
    // Setup message input
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    if (userId) {
        const matches = document.querySelectorAll('.chat-user');
        matches.forEach(match => {
            if (match.dataset.userId === userId) {
                match.querySelector('.chat-user-info').click();
            }
        });
    }
});