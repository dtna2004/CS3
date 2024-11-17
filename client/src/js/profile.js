async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            
            document.getElementById('userAvatar').src = user.avatar || '../images/default-avatar.png';
            document.getElementById('userName').textContent = user.name || 'Chưa cập nhật';
            document.getElementById('userAge').textContent = user.age || 'Chưa cập nhật';
            document.getElementById('userGender').textContent = translateGender(user.gender) || 'Chưa cập nhật';
            document.getElementById('userOccupation').textContent = user.occupation || 'Chưa cập nhật';

            document.querySelector('.stat-item .stat-value').textContent = user.friendCount || 0;
            document.getElementById('friendCount').textContent = user.friendCount || 0;

            renderTags('userInterests', user.interests);
            renderTags('userLifestyle', user.lifestyle);
            renderTags('userGoals', user.goals);
            renderTags('userValues', user.values);

            await loadFriendsPreview(user._id);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi tải thông tin người dùng');
    }
}

function renderTags(containerId, items = []) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    items.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = item;
        container.appendChild(tag);
    });
}

function translateGender(gender) {
    const translations = {
        'male': 'Nam',
        'female': 'Nữ',
        'other': 'Khác'
    };
    return translations[gender] || gender;
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
});

loadUserProfile();

// Thêm event listener cho quick-stats
document.querySelector('.quick-stats').addEventListener('click', () => {
    loadFriendsList(localStorage.getItem('userId'));
});

// Thêm biến để lưu userId hiện tại
let currentUserId = localStorage.getItem('userId');

async function loadFriendsList() {
    try {
        const response = await fetch(`${API_URL}/matches/friends/${currentUserId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const friends = await response.json();
            displayFriendsList(friends);
            openFriendsModal();
        }
    } catch (error) {
        console.error('Error loading friends:', error);
        alert('Có lỗi xảy ra khi tải danh sách bạn bè');
    }
}

function displayFriendsList(friends) {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '';

    if (friends.length === 0) {
        friendsList.innerHTML = '<p style="text-align: center; color: #fff;">Chưa có bạn bè</p>';
        return;
    }

    friends.forEach(friend => {
        const friendCard = document.createElement('div');
        friendCard.className = 'friend-card';
        friendCard.innerHTML = `
            <img src="${friend.avatar || DEFAULT_AVATAR}" alt="Avatar" class="friend-avatar">
            <h3 class="friend-name">${friend.name}</h3>
            <button class="btn-view-profile" onclick="viewFriendProfile('${friend._id}')">
                Xem hồ sơ
            </button>
        `;
        friendsList.appendChild(friendCard);
    });
}

function openFriendsModal() {
    const modal = document.getElementById('friendsModal');
    modal.style.display = 'block';
    // Ngăn scroll của body khi modal mở
    document.body.style.overflow = 'hidden';
}

function closeFriendsModal() {
    const modal = document.getElementById('friendsModal');
    modal.style.display = 'none';
    // Cho phép scroll lại khi đóng modal
    document.body.style.overflow = 'auto';
}

function viewFriendProfile(userId) {
    window.location.href = `user-profile.html?id=${userId}`;
}

// Đóng modal khi click bên ngoài
window.onclick = function(event) {
    const modal = document.getElementById('friendsModal');
    if (event.target === modal) {
        closeFriendsModal();
    }
}

async function loadFriendsPreview(userId) {
    try {
        const response = await fetch(`${API_URL}/matches/friends/${userId}?limit=8`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const friends = await response.json();
            displayFriendsPreview(friends);
        }
    } catch (error) {
        console.error('Error loading friends preview:', error);
    }
}

function displayFriendsPreview(friends) {
    const grid = document.getElementById('friendsPreviewGrid');
    if (!grid) return;

    grid.innerHTML = '';

    if (friends.length === 0) {
        grid.innerHTML = '<p class="no-friends-message">Chưa có bạn bè</p>';
        return;
    }

    friends.forEach((friend, index) => {
        const friendPreview = document.createElement('div');
        friendPreview.className = 'friend-preview';
        friendPreview.style.setProperty('--index', index);
        friendPreview.innerHTML = `
            <img 
                src="${friend.avatar || DEFAULT_AVATAR}" 
                alt="${friend.name}" 
                class="friend-preview-avatar"
                onclick="viewFriendProfile('${friend._id}')"
            >
            <div class="friend-preview-name">${friend.name}</div>
        `;
        grid.appendChild(friendPreview);
    });
} 