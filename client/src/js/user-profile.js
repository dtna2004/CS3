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
        displayUserProfile(user);
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

    const interestsContainer = document.getElementById('userInterests');
    if (interestsContainer) {
        interestsContainer.innerHTML = user.interests?.map(interest => 
            `<span class="tag">${interest}</span>`
        ).join('') || 'Chưa cập nhật';
    }

    const lifestyleContainer = document.getElementById('userLifestyle');
    if (lifestyleContainer) {
        lifestyleContainer.innerHTML = user.lifestyle?.map(style => 
            `<span class="tag">${style}</span>`
        ).join('') || 'Chưa cập nhật';
    }

    const goalsContainer = document.getElementById('userGoals');
    if (goalsContainer) {
        goalsContainer.innerHTML = user.goals?.map(goal => 
            `<span class="tag">${goal}</span>`
        ).join('') || 'Chưa cập nhật';
    }

    const valuesContainer = document.getElementById('userValues');
    if (valuesContainer) {
        valuesContainer.innerHTML = user.values?.map(value => 
            `<span class="tag">${value}</span>`
        ).join('') || 'Chưa cập nhật';
    }

    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.onclick = () => sendMatchRequest(user._id);
    }

    const messageBtn = document.getElementById('messageBtn');
    if (messageBtn) {
        messageBtn.onclick = () => {
            window.location.href = `chat.html?userId=${user._id}`;
        };
    }
}

document.addEventListener('DOMContentLoaded', loadUserProfile); 