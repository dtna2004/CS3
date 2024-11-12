

async function loadMatchRequests() {
    try {
        const response = await fetch(`${API_URL}/matches/pending`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const requests = await response.json();
            renderMatchRequests(requests);
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi tải lời mời kết nối');
    }
}

function renderMatchRequests(requests) {
    const container = document.getElementById('matchRequestsList');
    container.innerHTML = '';

    requests.forEach(request => {
        const card = document.createElement('div');
        card.className = 'notification-card';
        card.innerHTML = `
            <img src="${request.sender.avatar || '../images/default-avatar.png'}" alt="Avatar">
            <div class="notification-content">
                <h3>${request.sender.name}</h3>
                <p>Muốn kết nối với bạn</p>
                <div class="notification-time">${formatTime(request.createdAt)}</div>
            </div>
            <div class="notification-actions">
                <button class="btn-accept" onclick="respondToMatch('${request._id}', 'accepted')">
                    Chấp nhận
                </button>
                <button class="btn-reject" onclick="respondToMatch('${request._id}', 'rejected')">
                    Từ chối
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function respondToMatch(matchId, status) {
    try {
        const response = await fetch(`${API_URL}/matches/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ matchId, status })
        });

        if (response.ok) {
            loadMatchRequests();
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi xử lý lời mời kết nối');
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
        return 'Vừa xong';
    } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)} phút trước`;
    } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)} giờ trước`;
    } else {
        return date.toLocaleDateString('vi-VN');
    }
}

document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

loadMatchRequests();
setInterval(loadMatchRequests, 30000); 