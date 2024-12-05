// Khởi tạo ma trận
let currentMatrix = 'occupation';
let matrices = {};

// Các label cho từng loại ma trận
const matrixLabels = {
    occupation: [
        'Kỹ sư phần mềm', 'Bác sĩ', 'Giáo viên', 'Luật sư', 'Thiết kế',
        'Kỹ sư xây dựng', 'Nhà báo', 'Kiến trúc sư', 'Marketing', 'Web Developer',
        'Tài chính', 'Tuyển dụng', 'Kỹ thuật viên', 'Dữ liệu', 'Nghệ sĩ'
    ],
    interests: [
        'Đọc sách', 'Nhạc cụ', 'Vẽ', 'Thể thao', 'Nấu ăn',
        'Chụp ảnh', 'Du lịch', 'Làm vườn', 'Game', 'Viết lách',
        'Sưu tầm', 'Gym', 'Xem phim', 'Ngoại ngữ', 'Yoga'
    ],
    lifestyle: [
        'Sống tối giản', 'Sống bền vững', 'Sống khỏe mạnh', 'Sống tự do du mục', 'Sống năng động',
        'Sống thư giãn', 'Sống hướng ngoại', 'Sống hướng nội', 'Sống gia đình', 'Sống phiêu lưu',
        'Sống nghệ thuật', 'Sống gần gũi thiên nhiên', 'Sống tập trung công việc', 'Sống hòa hợp', 'Sống vì cộng đồng'
    ],
    goals: [
        'Phát triển sự nghiệp', 'Xây dựng gia đình', 'Sở hữu nhà riêng', 'Du lịch khám phá', 'Tự do tài chính',
        'Sức khỏe thể chất', 'Kỹ năng mới', 'Bằng cấp cao hơn', 'Khi nghiệp', 'Cộng đồng',
        'Lãnh đạo', 'Sách ảnh', 'Quan hệ chất lượng', 'Chuyên gia', 'Từ thiện'
    ],
    values: [
        'Trung thực', 'Tôn trọng', 'Trách nhiệm', 'Trung thành', 'Tình yêu thương',
        'Sáng tạo', 'Kiên trì', 'Tự do', 'Cảm thông', 'Độc lập',
        'Hòa bình', 'Biết ơn', 'Công bằng', 'Chính trực', 'Bền bỉ'
    ]
};

let heatmapChart = null;

// Khởi tạo ma trận với giá trị mặc định
function initializeMatrix(type) {
    const size = matrixLabels[type].length;
    const matrix = Array(size).fill().map(() => Array(size).fill(0.5));
    // Đặt đường chéo chính = 1
    for (let i = 0; i < size; i++) {
        matrix[i][i] = 1.0;
    }
    return matrix;
}

// Khởi tạo tất cả ma trận
function initializeAllMatrices() {
    Object.keys(matrixLabels).forEach(type => {
        matrices[type] = initializeMatrix(type);
    });
}

// Tải ma trận từ server
async function loadMatrices() {
    try {
        const response = await fetch(`${API_URL}/admin/matrices`);
        if (response.ok) {
            const data = await response.json();
            // Kiểm tra và khởi tạo ma trận nếu thiếu
            Object.keys(matrixLabels).forEach(type => {
                if (!data[type] || !Array.isArray(data[type])) {
                    data[type] = initializeMatrix(type);
                }
            });
            matrices = data;
        } else {
            initializeAllMatrices();
        }
        displayMatrix(currentMatrix);
        updateHeatmap();
    } catch (error) {
        console.error('Error loading matrices:', error);
        initializeAllMatrices();
        displayMatrix(currentMatrix);
        updateHeatmap();
    }
}

// Hiển thị ma trận
function displayMatrix(type) {
    currentMatrix = type;
    const container = document.getElementById('matrixContainer');
    if (!container) {
        console.error('Matrix container not found');
        return;
    }

    const labels = matrixLabels[type];
    const matrix = matrices[type];

    if (!matrix) {
        console.error('Matrix data not found for type:', type);
        matrices[type] = initializeMatrix(type);
        matrix = matrices[type];
    }

    // Tạo bảng HTML
    let html = '<table class="matrix-table">';
    
    // Header row với labels
    html += '<tr><th></th>';
    labels.forEach(label => {
        html += `<th>${label}</th>`;
    });
    html += '</tr>';

    // Matrix rows
    labels.forEach((rowLabel, i) => {
        html += `<tr><th>${rowLabel}</th>`;
        labels.forEach((_, j) => {
            html += `<td>
                <input type="number" 
                    value="${matrix[i][j]}" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    onchange="updateMatrixValue(${i}, ${j}, this.value)"
                    ${i === j ? 'readonly' : ''}
                    style="background-color: ${getColorForValue(matrix[i][j])}"
                >
            </td>`;
        });
        html += '</tr>';
    });
    html += '</table>';

    container.innerHTML = html;
    updateHeatmap();
}

// Cập nhật giá trị trong ma trận
function updateMatrixValue(i, j, value) {
    value = Math.min(Math.max(parseFloat(value) || 0, 0), 1);
    matrices[currentMatrix][i][j] = value;
    matrices[currentMatrix][j][i] = value; // Ma trận đối xứng
    
    // Cập nhật màu nền của input
    const input = document.querySelector(`#matrixContainer table tr:nth-child(${i + 2}) td:nth-child(${j + 2}) input`);
    if (input) {
        input.style.backgroundColor = getColorForValue(value);
    }
    
    updateHeatmap();
}

// Khởi tạo biểu đồ heatmap
function initializeHeatmap() {
    const ctx = document.getElementById('heatmapChart').getContext('2d');
    
    if (heatmapChart) {
        heatmapChart.destroy();
    }

    const labels = matrixLabels[currentMatrix];
    const matrix = matrices[currentMatrix] || initializeMatrix(currentMatrix);
    const data = [];

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            data.push({
                x: j,
                y: i,
                v: matrix[i][j]
            });
        }
    }

    heatmapChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Compatibility Matrix',
                data: data,
                backgroundColor: function(context) {
                    const value = context.raw.v;
                    return getColorForValue(value);
                },
                pointRadius: 15,
                pointHoverRadius: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -0.5,
                    max: labels.length - 0.5,
                    ticks: {
                        callback: function(value) {
                            return labels[Math.round(value)];
                        },
                        maxRotation: 45,
                        autoSkip: true,
                        autoSkipPadding: 10
                    }
                },
                y: {
                    type: 'linear',
                    min: -0.5,
                    max: labels.length - 0.5,
                    ticks: {
                        callback: function(value) {
                            return labels[Math.round(value)];
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const x = Math.round(context[0].parsed.x);
                            const y = Math.round(context[0].parsed.y);
                            return `${labels[y]} - ${labels[x]}`;
                        },
                        label: function(context) {
                            return `Value: ${context.raw.v.toFixed(2)}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

// Cập nhật biểu đồ heatmap
function updateHeatmap() {
    if (!heatmapChart) {
        initializeHeatmap();
        return;
    }

    const labels = matrixLabels[currentMatrix];
    const matrix = matrices[currentMatrix];
    const data = [];

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            data.push({
                x: j,
                y: i,
                v: matrix[i][j]
            });
        }
    }

    heatmapChart.data.datasets[0].data = data;
    heatmapChart.update();
}

// Hàm chuyển đổi giá trị thành màu
function getColorForValue(value) {
    // Chuyển đổi giá trị từ 0-1 thành màu từ đỏ (0) đến xanh lá (1)
    const r = Math.round(255 * (1 - value));
    const g = Math.round(255 * value);
    return `rgba(${r}, ${g}, 0, 0.5)`;
}

// Lưu ma trận và cập nhật tham số ghép cặp
async function saveMatrix() {
    try {
        const response = await fetch(`${API_URL}/admin/matrices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(matrices)
        });

        if (!response.ok) {
            throw new Error('Failed to save matrices');
        }

        alert('Lưu ma trận thành công!');
    } catch (error) {
        console.error('Error saving matrices:', error);
        alert('Có lỗi xảy ra khi lưu ma trận');
    }
}

// Thêm event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo ma trận và load dữ liệu
    initializeAllMatrices();
    loadMatrices();

    // Xử lý chuyển đổi giữa các loại ma trận
    document.querySelectorAll('.matrix-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.matrix-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayMatrix(btn.dataset.matrix);
        });
    });

    // Xử lý nút lưu
    const saveBtn = document.getElementById('saveMatrix');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveMatrix);
    }
}); 