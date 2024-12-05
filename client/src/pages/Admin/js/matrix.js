document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    const matrixTabs = document.querySelectorAll('.matrix-tab');
    const matrixTable = document.getElementById('matrixTable');
    let currentMatrix = 'occupation';
    let heatmapChart = null;

    // Load matrix data
    async function loadMatrix(type) {
        try {
            const response = await fetch(`${API_URL}/admin/matrix/${type}`);
            if (!response.ok) throw new Error('Failed to load matrix');
            
            const data = await response.json();
            renderMatrix(data);
            
            // Convert data for heatmap
            const heatmapData = [];
            const labels = Object.keys(data);
            
            labels.forEach((row, i) => {
                labels.forEach((col, j) => {
                    heatmapData.push({
                        x: col,
                        y: row,
                        v: data[row][col] || 0
                    });
                });
            });
            
            initHeatmap(heatmapData, labels);
        } catch (error) {
            console.error('Error loading matrix:', error);
            alert('Failed to load matrix data');
        }
    }

    // Save matrix
    async function saveMatrix(matrix) {
        try {
            const response = await fetch(`${API_URL}/admin/matrix/${currentMatrix}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(matrix)
            });

            if (!response.ok) throw new Error('Failed to save matrix');
            alert('Matrix saved successfully!');
        } catch (error) {
            console.error('Error saving matrix:', error);
            alert('Failed to save matrix. Please try again.');
        }
    }

    // Initialize heatmap
    function initHeatmap(data, labels) {
        const ctx = document.getElementById('heatmapChart').getContext('2d');
        
        if (heatmapChart) {
            heatmapChart.destroy();
        }

        // Convert data for scatter plot
        const scatterData = data.map(point => ({
            x: labels.indexOf(point.x),
            y: labels.indexOf(point.y),
            v: point.v
        }));

        heatmapChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    data: scatterData,
                    pointBackgroundColor: scatterData.map(point => 
                        `rgba(0, 123, 255, ${point.v})`
                    ),
                    pointRadius: 10,
                    pointHoverRadius: 12
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
                            }
                        },
                        grid: {
                            display: false
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
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return `${labels[point.x]} - ${labels[point.y]}: ${point.v.toFixed(2)}`;
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

    // Render matrix table
    function renderMatrix(data) {
        const labels = Object.keys(data);
        matrixTable.innerHTML = '';

        // Header row
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th></th>' + labels.map(label => 
            `<th>${label}</th>`
        ).join('');
        matrixTable.appendChild(headerRow);

        // Data rows
        labels.forEach(rowLabel => {
            const row = document.createElement('tr');
            row.innerHTML = `<th>${rowLabel}</th>` + 
                labels.map(colLabel => 
                    `<td><input type="number" min="0" max="1" step="0.1" 
                        value="${data[rowLabel][colLabel] || 0}"
                        data-row="${rowLabel}" 
                        data-col="${colLabel}"
                    ></td>`
                ).join('');
            matrixTable.appendChild(row);
        });

        // Add input event listeners
        matrixTable.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => {
                const row = input.dataset.row;
                const col = input.dataset.col;
                const value = parseFloat(input.value);
                
                if (isNaN(value) || value < 0 || value > 1) {
                    alert('Please enter a value between 0 and 1');
                    input.value = data[row][col] || 0;
                    return;
                }

                data[row][col] = value;
                // Update heatmap
                const heatmapData = [];
                const labels = Object.keys(data);
                
                labels.forEach((r, i) => {
                    labels.forEach((c, j) => {
                        heatmapData.push({
                            x: c,
                            y: r,
                            v: data[r][c] || 0
                        });
                    });
                });
                
                initHeatmap(heatmapData, labels);
            });
        });
    }

    // Matrix tab switching
    matrixTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            matrixTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMatrix = tab.dataset.matrix;
            loadMatrix(currentMatrix);
        });
    });

    // Save button
    document.getElementById('saveMatrix').addEventListener('click', () => {
        const matrix = {};
        matrixTable.querySelectorAll('tr').forEach((row, i) => {
            if (i === 0) return; // Skip header row
            
            const rowLabel = row.querySelector('th').textContent;
            matrix[rowLabel] = {};
            
            row.querySelectorAll('input').forEach((input, j) => {
                const colLabel = matrixTable.querySelector(`tr:first-child th:nth-child(${j + 2})`).textContent;
                matrix[rowLabel][colLabel] = parseFloat(input.value) || 0;
            });
        });
        
        saveMatrix(matrix);
    });

    // Load initial matrix
    loadMatrix('occupation');
}); 