document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo các biến
    const weightSliders = document.querySelectorAll('.weight-item input[type="range"]');
    let weightChart = null;
    let isAdjusting = false;

    // Khởi tạo weights mặc định
    const defaultWeights = {
        distance: 15,
        age: 15,
        occupation: 10,
        interests: 20,
        lifestyle: 15,
        goals: 15,
        values: 10
    };

    // Khởi tạo biểu đồ
    function initializeChart() {
        const ctx = document.getElementById('weightChart');
        if (!ctx) {
            console.error('Canvas element not found');
            return;
        }

        weightChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Khoảng cách', 'Độ tuổi', 'Nghề nghiệp', 'Sở thích', 'Lối sống', 'Mục tiêu', 'Giá trị'],
                datasets: [{
                    data: Object.values(defaultWeights),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#7CBA3B'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Phân phối trọng số',
                        font: {
                            size: 14
                        }
                    }
                }
            }
        });
    }

    // Load weights from server
    async function loadWeights() {
        try {
            const response = await fetch(`${API_URL}/admin/weights`);
            if (!response.ok) throw new Error('Failed to load weights');
            
            const weights = await response.json();
            // Chuyển đổi từ decimal sang phần trăm
            Object.keys(weights).forEach(key => {
                const value = Math.round(weights[key] * 100);
                const slider = document.getElementById(key);
                if (slider) {
                    slider.value = value;
                    const valueDisplay = slider.parentElement.querySelector('.weight-value');
                    if (valueDisplay) {
                        valueDisplay.textContent = `${value}%`;
                    }
                }
            });
        } catch (error) {
            console.error('Error loading weights:', error);
            // Sử dụng weights mặc định
            Object.keys(defaultWeights).forEach(key => {
                const slider = document.getElementById(key);
                if (slider) {
                    slider.value = defaultWeights[key];
                    const valueDisplay = slider.parentElement.querySelector('.weight-value');
                    if (valueDisplay) {
                        valueDisplay.textContent = `${defaultWeights[key]}%`;
                    }
                }
            });
        }
        updateTotalWeight();
        updateChart();
    }

    // Update chart with current weights
    function updateChart() {
        if (!weightChart) return;
        
        const values = Array.from(weightSliders).map(slider => parseInt(slider.value) || 0);
        weightChart.data.datasets[0].data = values;
        weightChart.update();
    }

    // Calculate and display total weight
    function updateTotalWeight() {
        const total = Array.from(weightSliders).reduce((sum, slider) => {
            return sum + (parseInt(slider.value) || 0);
        }, 0);
        
        const totalDisplay = document.querySelector('.total-weight');
        if (!totalDisplay) {
            const container = document.querySelector('.weights-container');
            const div = document.createElement('div');
            div.className = 'total-weight';
            div.innerHTML = `Tổng: <span style="color: ${total === 100 ? 'green' : 'red'}">${total}%</span>`;
            container.appendChild(div);
        } else {
            totalDisplay.innerHTML = `Tổng: <span style="color: ${total === 100 ? 'green' : 'red'}">${total}%</span>`;
        }
    }

    // Auto-balance remaining weights
    function balanceWeights(changedSlider) {
        if (isAdjusting) return;
        isAdjusting = true;

        const currentValue = parseInt(changedSlider.value) || 0;
        const otherSliders = Array.from(weightSliders).filter(s => s !== changedSlider);
        
        // Tính tổng các trọng số khác
        const otherTotal = otherSliders.reduce((sum, slider) => sum + (parseInt(slider.value) || 0), 0);
        const targetOtherTotal = 100 - currentValue;

        if (otherTotal > 0) {
            // Điều chỉnh các trọng số khác theo tỷ lệ
            const ratio = targetOtherTotal / otherTotal;
            let allocatedTotal = 0;

            otherSliders.forEach((slider, index) => {
                const oldValue = parseInt(slider.value) || 0;
                let newValue;

                if (index === otherSliders.length - 1) {
                    // Slider cuối cùng sẽ lấy phần còn lại để đảm bảo tổng = 100
                    newValue = targetOtherTotal - allocatedTotal;
                } else {
                    newValue = Math.round(oldValue * ratio);
                    allocatedTotal += newValue;
                }

                slider.value = Math.max(0, newValue);
                const valueDisplay = slider.parentElement.querySelector('.weight-value');
                if (valueDisplay) {
                    valueDisplay.textContent = `${slider.value}%`;
                }
            });
        } else {
            // Nếu các trọng số khác = 0, chia đều phần còn lại
            const equalShare = Math.floor(targetOtherTotal / otherSliders.length);
            let remaining = targetOtherTotal;

            otherSliders.forEach((slider, index) => {
                const value = index === otherSliders.length - 1 ? remaining : equalShare;
                slider.value = value;
                remaining -= value;

                const valueDisplay = slider.parentElement.querySelector('.weight-value');
                if (valueDisplay) {
                    valueDisplay.textContent = `${value}%`;
                }
            });
        }

        updateTotalWeight();
        updateChart();
        isAdjusting = false;
    }

    // Add event listeners to sliders
    weightSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 0;
            // Giới hạn giá trị từ 0-100
            e.target.value = Math.min(100, Math.max(0, value));

            const valueDisplay = e.target.parentElement.querySelector('.weight-value');
            if (valueDisplay) {
                valueDisplay.textContent = `${e.target.value}%`;
            }

            balanceWeights(e.target);
        });
    });

    // Save weights
    document.getElementById('saveWeights').addEventListener('click', async () => {
        // Convert to decimal
        const newWeights = {};
        weightSliders.forEach(slider => {
            newWeights[slider.id] = parseFloat((parseInt(slider.value) || 0) / 100).toFixed(2);
        });

        try {
            const response = await fetch(`${API_URL}/admin/weights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newWeights)
            });

            if (!response.ok) {
                throw new Error('Failed to save weights');
            }

            alert('Lưu trọng số thành công!');
        } catch (error) {
            console.error('Error saving weights:', error);
            alert('Có lỗi xảy ra khi lưu trọng số');
        }
    });

    // Initialize chart and load weights
    initializeChart();
    loadWeights();
}); 