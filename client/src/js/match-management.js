let currentTab = 'matches';

async function loadAllMatches() {
    await Promise.all([
        loadMatches(),
        loadBlockedUsers(),
        loadUnmatchedUsers()
    ]);
}

async function loadMatches() {
    try {
        const response = await fetch(`${API_URL}/matches`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const matches = await response.json();
            renderMatchList(matches);
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        alert('Có lỗi xảy ra khi tải danh sách bạn bè');
    }
}

function renderMatchList(matches) {
    const container = document.getElementById('matchesContainer');
    if (!container) return;

    container.innerHTML = '';

    matches.forEach(match => {
        const otherUser = match.sender._id === localStorage.getItem('userId') 
            ? match.receiver 
            : match.sender;

        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <img src="${otherUser.avatar || DEFAULT_AVATAR}" 
                alt="Avatar" 
                class="clickable-avatar">
            <h3>${otherUser.name}</h3>
            <div class="match-actions">
                <button class="btn-chat" onclick="goToChat('${otherUser._id}')">
                    <i class="btn-icon">💬</i>
                    Nhắn tin
                </button>
                <button class="btn-unmatch" onclick="unmatchUser('${otherUser._id}', '${otherUser.name}')">
                    <i class="btn-icon">💔</i>
                    Hủy kết nối
                </button>
                <button class="btn-block" onclick="blockUser('${otherUser._id}', '${otherUser.name}')">
                    <i class="btn-icon">🚫</i>
                    Chặn
                </button>
            </div>
        `;

        card.querySelector('.clickable-avatar').addEventListener('click', () => {
            window.location.href = `user-profile.html?id=${otherUser._id}`;
        });

        container.appendChild(card);
    });
}

function goToChat(userId) {
    window.location.href = `chat.html?userId=${userId}`;
}

async function unmatchUser(userId, userName) {
    if (!confirm(`Bạn có chắc muốn hủy kết nối với ${userName}?`)) return;

    try {
        const response = await fetch(`${API_URL}/matches/unmatch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            alert('Đã hủy kết nối thành công');
            loadAllMatches();
        } else {
            const data = await response.json();
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error unmatching user:', error);
        alert(error.message || 'Có lỗi xảy ra khi hủy kết nối');
    }
}

async function blockUser(userId, userName) {
    if (!confirm(`Bạn có chắc muốn chặn ${userName}?`)) return;

    try {
        const response = await fetch(`${API_URL}/matches/block`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            alert('Đã chặn người dùng thành công');
            loadAllMatches();
        } else {
            const data = await response.json();
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        alert(error.message || 'Có lỗi xảy ra khi chặn người dùng');
    }
}

async function loadBlockedUsers() {
    try {
        const response = await fetch(`${API_URL}/matches/status/blocked`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const blockedUsers = await response.json();
            renderBlockedUsers(blockedUsers);
        }
    } catch (error) {
        console.error('Error loading blocked users:', error);
    }
}

async function loadUnmatchedUsers() {
    try {
        const response = await fetch(`${API_URL}/matches/status/rejected`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const unmatchedUsers = await response.json();
            renderUnmatchedUsers(unmatchedUsers);
        }
    } catch (error) {
        console.error('Error loading unmatched users:', error);
    }
}

function renderBlockedUsers(users) {
    const container = document.getElementById('blockedContainer');
    if (!container) return;

    container.innerHTML = '';

    users.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <img src="${match.otherUser.avatar || DEFAULT_AVATAR}" 
                alt="Avatar" 
                class="clickable-avatar">
            <h3>${match.otherUser.name}</h3>
            <div class="match-actions">
                <button class="btn-unblock" onclick="unblockUser('${match.otherUser._id}', '${match.otherUser.name}')">
                    <i class="btn-icon">🔓</i>
                    Bỏ chặn
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

function renderUnmatchedUsers(users) {
    const container = document.getElementById('unmatchedContainer');
    if (!container) return;

    container.innerHTML = '';

    users.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <img src="${match.otherUser.avatar || DEFAULT_AVATAR}" 
                alt="Avatar" 
                class="clickable-avatar">
            <h3>${match.otherUser.name}</h3>
            <div class="match-actions">
                <button class="btn-rematch" onclick="rematchUser('${match.otherUser._id}', '${match.otherUser.name}')">
                    <i class="btn-icon">💝</i>
                    Kết nối lại
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

async function unblockUser(userId, userName) {
    if (!confirm(`Bạn có chắc muốn bỏ chặn ${userName}?`)) return;

    try {
        const response = await fetch(`${API_URL}/matches/unblock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            alert('Đã bỏ chặn người dùng');
            loadAllMatches();
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        alert('Có lỗi xảy ra khi bỏ chặn người dùng');
    }
}

async function rematchUser(userId, userName) {
    if (!confirm(`Bạn có muốn kết nối lại với ${userName}?`)) return;

    try {
        const response = await fetch(`${API_URL}/matches/rematch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            alert('Đã gửi lời mời kết nối');
            loadAllMatches();
        }
    } catch (error) {
        console.error('Error rematching user:', error);
        alert('Có lỗi xảy ra khi gửi lời mời kết nối');
    }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        const tabId = button.dataset.tab;
        document.getElementById(tabId).classList.add('active');
        currentTab = tabId;
    });
});

// Thêm các hàm vào window object để có thể gọi từ onclick
window.goToChat = goToChat;
window.unmatchUser = unmatchUser;
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.rematchUser = rematchUser;

// Initialize
document.addEventListener('DOMContentLoaded', loadAllMatches);

// Thêm CSS
const matchStyle = document.createElement('style');
matchStyle.textContent = `
    .clickable-avatar {
        cursor: pointer;
        transition: transform 0.2s;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 15px;
    }

    .clickable-avatar:hover {
        transform: scale(1.1);
    }
`;
document.head.appendChild(matchStyle);