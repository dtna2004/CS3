// API URL
const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    await updateTaskStatus();
    setupEventListeners();
});

async function updateTaskStatus() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Chưa đăng nhập');
        }

        const response = await fetch(`${API_URL}/tasks/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Không thể lấy trạng thái nhiệm vụ');
        }
        
        const data = await response.json();
        console.log('Task status data:', data);
        updateUI(data);
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        showToast('error', error.message);
    }
}

function updateUI(data) {
    // Cập nhật số xu
    document.getElementById('coin-balance').textContent = data.coins;
    
    // Cập nhật nút nhận thưởng
    updateTaskButton('daily-login', !data.dailyLogin);
    updateTaskButton('messages', data.messages >= 5);
    updateTaskButton('profile-visits', data.profileVisits > 0);
    updateTaskButton('avatar-change', data.avatarChanges >= 1);
    updateTaskButton('dating', data.dating >= 1);
    
    // Cập nhật số liệu
    document.getElementById('messages-count').textContent = `${data.messages}/5`;
    document.getElementById('profile-visits-count').textContent = data.profileVisits;
    document.getElementById('avatar-changes-count').textContent = data.avatarChanges;
    document.getElementById('dating-count').textContent = data.dating;
}

function updateTaskButton(taskId, canClaim) {
    const button = document.querySelector(`[data-task="${taskId}"]`);
    if (button) {
        button.disabled = !canClaim;
        button.classList.toggle('btn-primary', canClaim);
        button.classList.toggle('btn-secondary', !canClaim);
    }
}

function setupEventListeners() {
    // Xử lý nhận thưởng nhiệm vụ
    document.querySelectorAll('.claim-reward').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (e.target.disabled) {
                return; // Không làm gì nếu nút bị disable
            }

            const taskType = e.target.dataset.task;
            console.log('Claiming reward for task:', taskType);
            
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Chưa đăng nhập');
                }

                const response = await fetch(`${API_URL}/tasks/claim`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ taskType })
                });
                
                console.log('Claim response status:', response.status);
                const data = await response.json();
                console.log('Claim response data:', data);
                
                if (!response.ok) {
                    throw new Error(data.message || 'Không thể nhận thưởng');
                }
                
                showToast('success', `Nhận thưởng thành công! +${data.reward} xu`);
                await updateTaskStatus();
            } catch (error) {
                console.error('Lỗi khi nhận thưởng:', error);
                showToast('error', error.message);
            }
        });
    });

    // Xử lý đổi thưởng
    document.querySelectorAll('.exchange-reward').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (e.target.disabled) {
                return; // Không làm gì nếu nút bị disable
            }

            const amount = parseInt(e.target.dataset.amount);
            const coins = parseInt(e.target.dataset.coins);
            
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Chưa đăng nhập');
                }

                const response = await fetch(`${API_URL}/tasks/exchange`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ amount, coins })
                });
                
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Không thể đổi thưởng');
                }
                
                showToast('success', data.message);
                await updateTaskStatus();
            } catch (error) {
                console.error('Lỗi khi đổi thưởng:', error);
                showToast('error', error.message);
            }
        });
    });
}

function showToast(type, message) {
    // Xóa toast cũ nếu có
    const oldToast = document.querySelector('.toast');
    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Tự động xóa toast sau 3 giây
    setTimeout(() => {
        toast.remove();
    }, 3000);
} 