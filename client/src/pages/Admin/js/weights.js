document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    const weightSliders = document.querySelectorAll('.weight-slider input');
    const weightValues = document.querySelectorAll('.weight-value');
    let weightChart = null;
    let isAdjusting = false; // Tránh vòng lặp vô hạn khi điều chỉnh

    // Load weights
    async function loadWeights() {
        try {
            const response = await fetch(`${API_URL}/admin/weights`);
            if (!response.ok) throw new Error('Failed to load weights');
            
            const weights = await response.json();
            
            // Update sliders
            weightSliders.forEach(slider => {
                const name = slider.id;
                if (weights[name] !== undefined) {
                    const value = Math.round(weights[name] * 100);
                    slider.value = value;
                    slider.nextElementSibling.textContent = value + '%';
                }
            });
            
            // Update chart
            updateChart();
        } catch (error) {
            console.error('Error loading weights:', error);
            alert('Failed to load weights');
        }
    }

    // Initialize chart
    function initChart() {
        const ctx = document.getElementById('weightChart').getContext('2d');
        const labels = Array.from(weightSliders).map(slider => 
            slider.previousElementSibling.textContent.replace(':', '')
        );
        const data = Array.from(weightSliders).map(slider => slider.value);

        weightChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // Update chart
    function updateChart() {
        const data = Array.from(weightSliders).map(slider => slider.value);
        weightChart.data.datasets[0].data = data;
        weightChart.update();
    }

    // Tự động điều chỉnh các weights khác khi một weight thay đổi
    function adjustOtherWeights(changedSlider, oldValue) {
        if (isAdjusting) return;
        isAdjusting = true;

        const newValue = parseInt(changedSlider.value);
        const difference = newValue - oldValue;
        
        if (difference === 0) {
            isAdjusting = false;
            return;
        }

        // Lấy tổng các weights khác
        const otherSliders = Array.from(weightSliders).filter(slider => slider !== changedSlider);
        const otherTotal = otherSliders.reduce((sum, slider) => sum + parseInt(slider.value), 0);
        
        if (otherTotal === 0) {
            changedSlider.value = oldValue;
            isAdjusting = false;
            return;
        }

        // Điều chỉnh các weights khác tỷ lệ với giá trị hiện tại của chúng
        otherSliders.forEach(slider => {
            const currentValue = parseInt(slider.value);
            const ratio = currentValue / otherTotal;
            const adjustment = Math.round(difference * ratio * -1);
            const newValue = currentValue + adjustment;
            
            if (newValue < 0) {
                slider.value = 0;
            } else {
                slider.value = newValue;
            }
            slider.nextElementSibling.textContent = slider.value + '%';
        });

        // Đảm bảo tổng đúng 100%
        const total = Array.from(weightSliders).reduce((sum, slider) => sum + parseInt(slider.value), 0);
        if (total !== 100) {
            const lastSlider = otherSliders[otherSliders.length - 1];
            const currentValue = parseInt(lastSlider.value);
            lastSlider.value = currentValue + (100 - total);
            lastSlider.nextElementSibling.textContent = lastSlider.value + '%';
        }

        updateChart();
        isAdjusting = false;
    }

    // Initialize sliders and values
    weightSliders.forEach((slider, index) => {
        const valueSpan = weightValues[index];
        
        slider.addEventListener('input', (e) => {
            const oldValue = parseInt(valueSpan.textContent);
            const newValue = parseInt(slider.value);
            
            // Giới hạn giá trị từ 0-100
            if (newValue < 0) slider.value = 0;
            if (newValue > 100) slider.value = 100;
            
            valueSpan.textContent = slider.value + '%';
            adjustOtherWeights(slider, oldValue);
        });
    });

    // Save weights
    document.getElementById('saveWeights').addEventListener('click', async () => {
        // Convert to decimal
        const weights = {};
        weightSliders.forEach(slider => {
            weights[slider.id] = parseFloat((parseInt(slider.value) / 100).toFixed(2));
        });

        try {
            const response = await fetch(`${API_URL}/admin/weights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(weights)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save weights');
            }

            alert('Weights saved successfully!');
        } catch (error) {
            console.error('Error saving weights:', error);
            alert(error.message);
        }
    });

    // Initialize
    initChart();
    loadWeights();
}); 