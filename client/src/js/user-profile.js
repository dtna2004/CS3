function renderTags(containerId, items = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    items.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = item;
        container.appendChild(tag);
    });
}

let currentUser = null;
let currentFriendsPage = 0;
let allFriends = [];
const friendsPerPage = 8;

async function loadUserProfile() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');
        
        if (!userId) {
            alert('Không tìm thấy thông tin người dùng');
            window.location.href = 'matching.html';
            return;
        }

        const response = await fetch(`${API_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Không thể tải thông tin người dùng');
        }

        const user = await response.json();
        currentUser = user;
        displayUserProfile(user);
        
        await loadAllFriends(userId);
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Có lỗi xảy ra khi tải thông tin người dùng');
    }
}

function displayUserProfile(user) {
    const avatarElement = document.getElementById('userAvatar');
    if (avatarElement) {
        avatarElement.src = user.avatar || DEFAULT_AVATAR;
    }

    const nameElement = document.getElementById('userName');
    if (nameElement) {
        nameElement.textContent = user.name || 'Chưa cập nhật';
    }

    const ageElement = document.getElementById('userAge');
    if (ageElement) {
        ageElement.textContent = user.age || 'Chưa cập nhật';
    }

    const occupationElement = document.getElementById('userOccupation');
    if (occupationElement) {
        occupationElement.textContent = user.occupation || 'Chưa cập nhật';
    }

    const friendCountElement = document.querySelector('.stat-item .stat-value');
    if (friendCountElement) {
        friendCountElement.textContent = user.friendCount || 0;
    }

    const friendCountMainElement = document.getElementById('friendCount');
    if (friendCountMainElement) {
        friendCountMainElement.textContent = user.friendCount || 0;
    }

    renderTags('userInterests', user.interests);
    renderTags('userLifestyle', user.lifestyle);
    renderTags('userGoals', user.goals);
    renderTags('userValues', user.values);
}

async function loadAllFriends(userId) {
    try {
        const response = await fetch(`${API_URL}/matches/friends/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            allFriends = await response.json();
            displayFriendsPage(currentFriendsPage);
            updateNavigationButtons();
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

function displayFriendsPage(page) {
    const grid = document.getElementById('friendsPreviewGrid');
    if (!grid) return;

    const start = page * friendsPerPage;
    const end = start + friendsPerPage;
    const friendsToShow = allFriends.slice(start, end);

    grid.innerHTML = '';

    if (friendsToShow.length === 0) {
        grid.innerHTML = '<p class="no-friends-message">Chưa có bạn bè</p>';
        return;
    }

    friendsToShow.forEach((friend, index) => {
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

function navigateFriends(direction) {
    if (direction === 'next' && (currentFriendsPage + 1) * friendsPerPage < allFriends.length) {
        currentFriendsPage++;
    } else if (direction === 'prev' && currentFriendsPage > 0) {
        currentFriendsPage--;
    }
    
    displayFriendsPage(currentFriendsPage);
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = currentFriendsPage === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = (currentFriendsPage + 1) * friendsPerPage >= allFriends.length;
    }
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

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', loadUserProfile);

// Export các hàm cần thiết để sử dụng trong HTML
window.navigateFriends = navigateFriends;
window.viewFriendProfile = viewFriendProfile;
window.renderTags = renderTags; 