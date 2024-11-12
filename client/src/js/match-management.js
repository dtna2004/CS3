

async function loadMatches() {
    try {
        const response = await fetch(`${API_URL}/matches`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const matches = await response.json();
            renderMatches(matches);
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi tải danh sách bạn bè');
    }
}

function renderMatches(matches) {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = '';

    matches.forEach(match => {
        const otherUser = match.sender._id === localStorage.getItem('userId') 
            ? match.receiver 
            : match.sender;

        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <img src="${otherUser.avatar || '../images/default-avatar.png'}" alt="Avatar">
            <h3>${otherUser.name}</h3>
            <div class="match-actions">
                <button class="btn-chat" onclick="goToChat('${otherUser._id}')">
                    Nhắn tin
                </button>
                <button class="btn-unmatch" onclick="unmatchUser('${match._id}')">
                    Hủy kết nối
                </button>
                <button class="btn-block" onclick="blockUser('${otherUser._id}')">
                    Chặn
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function goToChat(userId) {
    window.location.href = `/chat.html?userId=${userId}`;
}

async function unmatchUser(matchId) {
    if (!confirm('Bạn có chắc muốn hủy kết nối với người này?')) return;

    try {
        const response = await fetch(`${API_URL}/matches/${matchId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            loadMatches();
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi hủy kết nối');
    }
}

async function blockUser(userId) {
    if (!confirm('Bạn có chắc muốn chặn người này?')) return;

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
            loadMatches();
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi chặn người dùng');
    }
}

loadMatches(); 