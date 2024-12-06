let currentUserLocation = null;

async function getCurrentLocation() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        currentUserLocation = {
            type: "Point",
            coordinates: [position.coords.longitude, position.coords.latitude]
        };
        
        // Cập nhật vị trí lên server
        await fetch(`${API_URL}/users/update-location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                location: currentUserLocation
            })
        });

        console.log('Current user location set:', currentUserLocation);
    } catch (error) {
        console.error('Error getting location:', error);
        currentUserLocation = null;
    }
}

function calculateDistance(location1, location2) {
    if (!location1 || !location2) return 0;

    const R = 6371; // Radius of the Earth in kilometers
    const lat1 = location1.lat * Math.PI / 180;
    const lat2 = location2.lat * Math.PI / 180;
    const dLat = (location2.lat - location1.lat) * Math.PI / 180;
    const dLon = (location2.lng - location1.lng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

function calculateDisplayDistance(location) {
    try {
        if (!currentUserLocation || !location) {
            console.log('Missing location data:', { currentUserLocation, location });
            return 'N/A';
        }
        
        if (!currentUserLocation.coordinates || !location.coordinates) {
            console.log('Missing coordinates:', { 
                currentUser: currentUserLocation.coordinates, 
                otherUser: location.coordinates 
            });
            return 'N/A';
        }

        const distance = calculateDistance(
            currentUserLocation.coordinates,
            location.coordinates
        );
        
        return distance ? Math.round(distance) : 'N/A';
    } catch (error) {
        console.error('Error calculating distance:', error);
        return 'N/A';
    }
}

function showLoading() {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Đang tìm kiếm người phù hợp...</p>
        </div>
    `;
}

async function loadPotentialMatches() {
    try {
        showLoading();
        await getCurrentLocation();

        const response = await fetch(`${API_URL}/matching/potential-matches`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Lỗi khi tải danh sách ghép cặp');
        }

        const matches = await response.json();
        console.log('Potential matches:', matches);

        renderMatches(matches.filter(match =>
            match.user.name &&
            match.user.interests &&
            match.user.interests.length > 0
        ));
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('matchesContainer').innerHTML = `
            <div class="error-message">
                <p>Có lỗi xảy ra khi tải danh sách ghép cặp</p>
                <button onclick="loadPotentialMatches()">Thử lại</button>
            </div>
        `;
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
                <p class="interests">${match.user.interests ? match.user.interests.join(', ') : 'Chưa cập nhật'}</p>
                <p class="distance">${calculateDisplayDistance(match.user.location) || 'N/A'} km</p>
            </div>
            <div class="match-score">
                <div class="score-bar">
                    <div class="score-fill" style="width: ${Math.round((match.score || 0) * 100)}%"></div>
                </div>
                <p>${Math.round((match.score || 0) * 100)}% phù hợp</p>
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

    .loading-container {
        text-align: center;
        padding: 40px;
    }

    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #ff4b6e;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error-message {
        text-align: center;
        padding: 20px;
    }

    .error-message button {
        background: #ff4b6e;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
    }

    .error-message button:hover {
        background: #ff3355;
    }
`;
document.head.appendChild(style);

loadPotentialMatches();