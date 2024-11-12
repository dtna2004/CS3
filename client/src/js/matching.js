

async function loadPotentialMatches() {
    try {
        const response = await fetch(`${API_URL}/matching/potential-matches`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const matches = await response.json();
            renderMatches(matches);
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi tải danh sách ghép cặp');
    }
}

function renderMatches(matches) {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = '';

    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.innerHTML = `
            <img src="${match.user.avatar || '../images/default-avatar.png'}" alt="Avatar">
            <h3>${match.user.name}</h3>
            <p>${match.user.age} tuổi</p>
            <p>${match.user.occupation}</p>
            <p>Độ phù hợp: ${Math.round(match.score * 100)}%</p>
            <button onclick="sendMatchRequest('${match.user._id}')">Gửi lời mời kết nối</button>
        `;
        container.appendChild(matchCard);
    });
}

async function sendMatchRequest(userId) {
    try {
        const response = await fetch(`${API_URL}/matches/send-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ receiverId: userId })
        });

        if (response.ok) {
            alert('Đã gửi lời mời kết nối');
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi gửi lời mời kết nối');
    }
}

loadPotentialMatches(); 