async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async position => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    try {
                        await updateUserLocation(location);
                        resolve(location);
                    } catch (error) {
                        console.error('Error updating location:', error);
                        resolve(null);
                    }
                },
                error => {
                    console.error('Error getting location:', error);
                    resolve(null);
                }
            );
        } else {
            console.error('Geolocation is not supported');
            resolve(null);
        }
    });
}

async function updateUserLocation(location) {
    const response = await fetch(`${API_URL}/users/location`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ location })
    });

    if (!response.ok) {
        throw new Error('Failed to update location');
    }
}

async function register(userData) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Lỗi đăng ký');
    }
    return data;
}

async function login(credentials) {
    try {
        const response = await fetch(`${window.API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Đăng nhập thất bại');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            const data = await register(userData);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                await getUserLocation();
                window.location.href = 'settings.html';
            } else {
                alert('Đăng ký thất bại');
            }
        } catch (error) {
            alert(error.message || 'Đã có lỗi xảy ra khi đăng ký');
        }
    });
}

if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const credentials = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            const data = await login(credentials);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                window.location.href = 'profile.html';
            } else {
                alert('Đăng nhập thất bại');
            }
        } catch (error) {
            alert(error.message || 'Đã có lỗi xảy ra khi đăng nhập');
        }
    });
} 