

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
            document.getElementById('userLocation').textContent = user.location?.address || 'Chưa cập nhật';
            document.getElementById('userAge').textContent = user.age || 'Chưa cập nhật';
            document.getElementById('userGender').textContent = translateGender(user.gender) || 'Chưa cập nhật';
            document.getElementById('userOccupation').textContent = user.occupation || 'Chưa cập nhật';

            renderTags('userInterests', user.interests);
            renderTags('userLifestyle', user.lifestyle);
            renderTags('userGoals', user.goals);
            renderTags('userValues', user.values);
        }
    } catch (error) {
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