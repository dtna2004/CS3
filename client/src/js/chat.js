
let currentChatUser = null;
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
            renderChatUsers(matches);
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi tải danh sách chat');
    }
}

function renderChatUsers(matches) {
    const container = document.getElementById('chatUsersList');
    container.innerHTML = '';

    matches.forEach(match => {
        const otherUser = match.sender._id === localStorage.getItem('userId') 
            ? match.receiver 
            : match.sender;

        const userDiv = document.createElement('div');
        userDiv.className = 'chat-user';
        userDiv.innerHTML = `
            <img src="${otherUser.avatar || '../images/default-avatar.png'}" alt="Avatar">
            <div class="chat-user-info">
                <h4>${otherUser.name}</h4>
            </div>
        `;

        userDiv.addEventListener('click', () => selectChatUser(otherUser));
        container.appendChild(userDiv);
    });
}

function selectChatUser(user) {
    currentChatUser = user;
    document.getElementById('chatUserAvatar').src = user.avatar || '../images/default-avatar.png';
    document.getElementById('chatUserName').textContent = user.name;

    document.querySelectorAll('.chat-user').forEach(el => {
        el.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    loadMessages(user._id);

    if (messageInterval) {
        clearInterval(messageInterval);
    }
    messageInterval = setInterval(() => loadMessages(user._id), 5000);
}

async function loadMessages(userId) {
    try {
        const response = await fetch(`${API_URL}/messages/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const messages = await response.json();
            renderMessages(messages);
        }
    } catch (error) {
        console.error('Lỗi khi tải tin nhắn:', error);
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';

    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender === localStorage.getItem('userId') ? 'sent' : 'received'}`;
        messageDiv.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${new Date(message.createdAt).toLocaleTimeString()}</div>
        `;
        container.appendChild(messageDiv);
    });

    container.scrollTop = container.scrollHeight;
}

document.getElementById('sendMessageBtn').addEventListener('click', async () => {
    if (!currentChatUser) {
        alert('Vui lòng chọn người để chat');
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

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
            messageInput.value = '';
            loadMessages(currentChatUser._id);
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi gửi tin nhắn');
    }
});

document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('sendMessageBtn').click();
    }
});

loadMatches(); 