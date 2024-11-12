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
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Lỗi đăng nhập');
    }
    return data;
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