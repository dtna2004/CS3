function initializeForm() {
    // Thêm options cho occupation
    const occupationSelect = document.getElementById('occupation');
    OPTIONS.occupations.forEach(occupation => {
        const option = document.createElement('option');
        option.value = occupation;
        option.textContent = occupation;
        occupationSelect.appendChild(option);
    });

    // Thêm checkboxes cho interests
    const interestsContainer = document.getElementById('interestsContainer');
    OPTIONS.interests.forEach(interest => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${interest}">
            ${interest}
        `;
        interestsContainer.appendChild(label);
    });

    // Thêm checkboxes cho lifestyle
    const lifestyleContainer = document.getElementById('lifestyleContainer');
    OPTIONS.lifestyle.forEach(lifestyle => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${lifestyle}">
            ${lifestyle}
        `;
        lifestyleContainer.appendChild(label);
    });

    // Thêm checkboxes cho goals
    const goalsContainer = document.getElementById('goalsContainer');
    OPTIONS.goals.forEach(goal => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${goal}">
            ${goal}
        `;
        goalsContainer.appendChild(label);
    });

    // Thêm checkboxes cho values
    const valuesContainer = document.getElementById('valuesContainer');
    OPTIONS.values.forEach(value => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${value}">
            ${value}
        `;
        valuesContainer.appendChild(label);
    });
}

// Upload ảnh lên Cloudinary
async function uploadImage(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'dating_app');
        formData.append('cloud_name', 'djkesszqc');

        console.log('Uploading to:', CLOUDINARY_URL);
        console.log('Upload preset:', 'dating_app');
        console.log('Cloud name:', 'djkesszqc');

        const response = await fetch('https://api.cloudinary.com/v1_1/djkesszqc/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Upload error response:', errorData);
            throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Upload success:', data);
        return data.secure_url;
    } catch (error) {
        console.error('Full upload error:', error);
        throw error;
    }
}

// Xử lý submit form
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userData = {
        name: document.getElementById('name').value,
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        occupation: document.getElementById('occupation').value,
        interests: Array.from(document.querySelectorAll('#interestsContainer input:checked'))
            .map(input => input.value),
        lifestyle: Array.from(document.querySelectorAll('#lifestyleContainer input:checked'))
            .map(input => input.value),
        goals: Array.from(document.querySelectorAll('#goalsContainer input:checked'))
            .map(input => input.value),
        values: Array.from(document.querySelectorAll('#valuesContainer input:checked'))
            .map(input => input.value)
    };

    try {
        const response = await fetch(`${API_URL}/users/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            window.location.href = '../pages/profile.html';
        } else {
            alert('Có lỗi xảy ra khi cập nhật thông tin');
        }
    } catch (error) {
        alert('Có lỗi xảy ra khi cập nhật thông tin');
    }
});

// Thêm event listeners cho upload avatar
document.getElementById('avatarInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Hiển thị preview
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatarPreview').src = e.target.result;
        }
        reader.readAsDataURL(file);
        
        // Enable nút upload
        document.getElementById('uploadAvatarBtn').disabled = false;
    }
});

// Xử lý upload avatar
document.getElementById('uploadAvatarBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('avatarInput');
    const file = fileInput.files[0];
    
    if (file) {
        try {
            const uploadBtn = document.getElementById('uploadAvatarBtn');
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="btn-icon">🔄</i> Đang tải lên...';

            console.log('Starting upload for file:', file.name);
            const imageUrl = await uploadImage(file);
            console.log('Upload successful, URL:', imageUrl);
            
            if (imageUrl) {
                const response = await fetch(`${API_URL}/users/avatar`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ avatar: imageUrl })
                });

                if (response.ok) {
                    document.getElementById('avatarPreview').src = imageUrl;
                    alert('Cập nhật avatar thành công');
                } else {
                    const errorData = await response.json();
                    throw new Error(`Cập nhật avatar thất bại: ${errorData.message}`);
                }
            }
        } catch (error) {
            console.error('Full error details:', error);
            alert('Có lỗi xảy ra khi cập nhật avatar: ' + error.message);
        } finally {
            const uploadBtn = document.getElementById('uploadAvatarBtn');
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="btn-icon">🔄</i> Cập nhật ảnh đại diện';
        }
    } else {
        alert('Vui lòng chọn ảnh');
    }
});

// Disable nút upload ban đầu
document.getElementById('uploadAvatarBtn').disabled = true;

// Load thông tin người dùng
async function loadUserData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                window.location.href = 'login.html';
                return;
            }
            const data = await response.json();
            throw new Error(data.message || 'Lỗi khi tải thông tin người dùng');
        }

        const user = await response.json();
        document.getElementById('name').value = user.name || '';
        document.getElementById('age').value = user.age || '';
        document.getElementById('gender').value = user.gender || 'male';
        document.getElementById('occupation').value = user.occupation || '';
        document.getElementById('avatarPreview').src = user.avatar || DEFAULT_AVATAR;

        if (user.interests) {
            user.interests.forEach(interest => {
                const checkbox = document.querySelector(`#interestsContainer input[value="${interest}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        if (user.lifestyle) {
            user.lifestyle.forEach(item => {
                const checkbox = document.querySelector(`#lifestyleContainer input[value="${item}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        if (user.goals) {
            user.goals.forEach(goal => {
                const checkbox = document.querySelector(`#goalsContainer input[value="${goal}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        if (user.values) {
            user.values.forEach(value => {
                const checkbox = document.querySelector(`#valuesContainer input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Có lỗi xảy ra khi tải thông tin người dùng');
    }
}

// Khởi tạo form và load dữ liệu
initializeForm();
loadUserData(); 