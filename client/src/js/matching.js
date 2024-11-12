let currentUserLocation = null;

async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    currentUserLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    resolve(currentUserLocation);
                },
                error => {
                    console.error('Error getting location:', error);
                    currentUserLocation = { lat: 0, lng: 0 };
                    resolve(currentUserLocation);
                }
            );
        } else {
            console.error('Geolocation is not supported');
            currentUserLocation = { lat: 0, lng: 0 };
            resolve(currentUserLocation);
        }
    });
}

function calculateDistance(location1, location2) {
    if (!location1 || !location2) return 0;
    
    const R = 6371; // Radius of the Earth in kilometers
    const lat1 = location1.lat * Math.PI / 180;
    const lat2 = location2.lat * Math.PI / 180;
    const dLat = (location2.lat - location1.lat) * Math.PI / 180;
    const dLon = (location2.lng - location1.lng) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}

function calculateDisplayDistance(location) {
    if (!currentUserLocation || !location) return "N/A";
    return Math.round(calculateDistance(currentUserLocation, location));
}

async function loadPotentialMatches() {
    try {
        await getCurrentLocation(); // Get user's location first

        const response = await fetch(`${API_URL}/matching/potential-matches`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Lỗi khi tải danh sách ghép cặp');
        }

        const matches = await response.json();
        renderMatches(matches.filter(match => 
            match.user.name && 
            match.user.interests && 
            match.user.interests.length > 0
        ));
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi tải danh sách ghép cặp');
    }
}

function renderMatches(matches) {
    const container = document.getElementById('matchesContainer');
    if (!container) return;

    container.innerHTML = '';

    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.innerHTML = `
            <div class="avatar-container">
                <img src="${match.user.avatar || DEFAULT_AVATAR}" alt="Avatar">
            </div>
            <h3>${match.user.name}</h3>
            <div class="match-info">
                <p class="interests">${match.user.interests.join(', ')}</p>
                <p class="distance">${calculateDisplayDistance(match.user.location)} km</p>
            </div>
            <div class="match-score">
                <div class="score-bar">
                    <div class="score-fill" style="width: ${Math.round(match.score * 100)}%"></div>
                </div>
                <p>${Math.round(match.score * 100)}% phù hợp</p>
            </div>
            <div class="match-actions">
                <button class="btn-view">Xem chi tiết</button>
                <button class="btn-connect">Kết nối</button>
            </div>
        `;

        matchCard.querySelector('.avatar-container').addEventListener('click', () => {
            viewProfile(match.user._id);
        });
        
        matchCard.querySelector('.btn-view').addEventListener('click', () => {
            viewProfile(match.user._id);
        });
        
        matchCard.querySelector('.btn-connect').addEventListener('click', () => {
            sendMatchRequest(match.user._id);
        });

        container.appendChild(matchCard);
    });
}

function viewProfile(userId) {
    if (userId) {
        window.location.href = `user-profile.html?id=${userId}`;
    }
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

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }

        alert('Đã gửi lời mời kết nối');
        loadPotentialMatches();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Có lỗi xảy ra khi gửi lời mời kết nối');
    }
}

const style = document.createElement('style');
style.textContent = `
    .match-card {
        background: white;
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        transition: transform 0.2s;
    }

    .match-card:hover {
        transform: translateY(-5px);
    }

    .avatar-container {
        cursor: pointer;
        position: relative;
        overflow: hidden;
        width: 150px;
        height: 150px;
        border-radius: 50%;
        margin: 0 auto 15px;
    }

    .avatar-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .match-info {
        margin: 15px 0;
    }

    .interests {
        color: #666;
        font-size: 14px;
        margin: 5px 0;
    }

    .distance {
        color: #888;
        font-size: 13px;
    }

    .match-score {
        margin: 15px 0;
    }

    .score-bar {
        width: 100%;
        height: 6px;
        background: #eee;
        border-radius: 3px;
        overflow: hidden;
    }

    .score-fill {
        height: 100%;
        background: #ff4b6e;
        transition: width 0.3s ease;
    }

    .match-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }

    .btn-view, .btn-connect {
        flex: 1;
        padding: 8px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s;
    }

    .btn-view {
        background: #f0f0f0;
        color: #333;
    }

    .btn-connect {
        background: #ff4b6e;
        color: white;
    }

    .btn-view:hover {
        background: #e0e0e0;
    }

    .btn-connect:hover {
        background: #ff3356;
    }
`;
document.head.appendChild(style);

loadPotentialMatches();