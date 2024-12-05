document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    let trainingChart = null;
    let usersData = null;
    let matchesData = null;

    // Elements
    const usersFileInput = document.getElementById('usersData');
    const matchesFileInput = document.getElementById('matchesData');
    const usersFileName = document.getElementById('usersFileName');
    const matchesFileName = document.getElementById('matchesFileName');
    const clearFileBtn = document.getElementById('clearFile');
    const startTrainingBtn = document.getElementById('startTraining');
    const applyWeightsBtn = document.getElementById('applyWeights');
    const progressBar = document.getElementById('trainingProgress');
    const currentLoss = document.getElementById('currentLoss');
    const currentAccuracy = document.getElementById('currentAccuracy');
    const currentEpoch = document.getElementById('currentEpoch');
    const optimizedWeightsDiv = document.getElementById('optimizedWeights');

    // Initialize chart
    function initChart() {
        const ctx = document.getElementById('trainingChart').getContext('2d');
        
        trainingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Loss',
                        data: [],
                        borderColor: '#FF6384',
                        tension: 0.1
                    },
                    {
                        label: 'Accuracy',
                        data: [],
                        borderColor: '#36A2EB',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Handle users file upload
    usersFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        usersFileName.textContent = file.name;
        
        try {
            const data = await parseCSV(file);
            if (data.length > 0 && data[0].hasOwnProperty('email')) {
                usersData = data;
                console.log('Users data loaded:', usersData.length, 'records');
                checkStartTraining();
            } else {
                throw new Error('Invalid users data format');
            }
        } catch (error) {
            console.error('Error parsing users CSV:', error);
            alert('Error parsing users CSV file. Please check the format.');
            clearUsersFile();
        }
    });

    // Handle matches file upload
    matchesFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        matchesFileName.textContent = file.name;
        
        try {
            const data = await parseCSV(file);
            if (data.length > 0 && data[0].hasOwnProperty('sender')) {
                matchesData = data;
                console.log('Matches data loaded:', matchesData.length, 'records');
                checkStartTraining();
            } else {
                throw new Error('Invalid matches data format');
            }
        } catch (error) {
            console.error('Error parsing matches CSV:', error);
            alert('Error parsing matches CSV file. Please check the format.');
            clearMatchesFile();
        }
    });

    // Check if both files are loaded to enable training
    function checkStartTraining() {
        startTrainingBtn.disabled = !(usersData && matchesData);
    }

    // Parse CSV file
    async function parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const rows = text.split('\n');
                    const headers = rows[0].split(',');
                    
                    const data = rows.slice(1)
                        .filter(row => row.trim())
                        .map(row => {
                            const values = row.split(',');
                            const item = {};
                            headers.forEach((header, i) => {
                                // Handle nested arrays and objects in CSV
                                if (header.includes('[')) {
                                    const baseKey = header.split('[')[0];
                                    const index = parseInt(header.split('[')[1]);
                                    if (!item[baseKey]) item[baseKey] = [];
                                    if (values[i]?.trim()) {
                                        item[baseKey][index] = values[i]?.trim();
                                    }
                                } else if (header.includes('.')) {
                                    const [objKey, subKey] = header.split('.');
                                    if (!item[objKey]) item[objKey] = {};
                                    item[objKey][subKey] = values[i]?.trim();
                                } else {
                                    item[header.trim()] = values[i]?.trim();
                                }
                            });
                            return item;
                        });
                    
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Clear users file
    function clearUsersFile() {
        usersFileInput.value = '';
        usersFileName.textContent = 'No file selected';
        usersData = null;
        checkStartTraining();
    }

    // Clear matches file
    function clearMatchesFile() {
        matchesFileInput.value = '';
        matchesFileName.textContent = 'No file selected';
        matchesData = null;
        checkStartTraining();
    }

    // Clear all files
    clearFileBtn.addEventListener('click', () => {
        clearUsersFile();
        clearMatchesFile();
        startTrainingBtn.disabled = true;
    });

    // Calculate similarity between two users
    function calculateSimilarity(user1, user2) {
        let similarity = 0;
        let totalWeight = 0;

        // Calculate age similarity (0-1)
        if (user1.age && user2.age) {
            const ageDiff = Math.abs(parseInt(user1.age) - parseInt(user2.age));
            const ageSimilarity = Math.max(0, 1 - ageDiff / 20); // Normalize by 20 years difference
            similarity += ageSimilarity * 0.15;
            totalWeight += 0.15;
        }

        // Calculate interests similarity (0-1)
        if (user1.interests && user2.interests) {
            const commonInterests = user1.interests.filter(i => i && user2.interests.includes(i)).length;
            const maxInterests = Math.max(
                user1.interests.filter(i => i).length,
                user2.interests.filter(i => i).length
            );
            if (maxInterests > 0) {
                similarity += (commonInterests / maxInterests) * 0.2;
                totalWeight += 0.2;
            }
        }

        // Calculate lifestyle similarity
        if (user1.lifestyle && user2.lifestyle) {
            const commonLifestyle = user1.lifestyle.filter(l => l && user2.lifestyle.includes(l)).length;
            const maxLifestyle = Math.max(
                user1.lifestyle.filter(l => l).length,
                user2.lifestyle.filter(l => l).length
            );
            if (maxLifestyle > 0) {
                similarity += (commonLifestyle / maxLifestyle) * 0.15;
                totalWeight += 0.15;
            }
        }

        // Calculate values similarity
        if (user1.values && user2.values) {
            const commonValues = user1.values.filter(v => v && user2.values.includes(v)).length;
            const maxValues = Math.max(
                user1.values.filter(v => v).length,
                user2.values.filter(v => v).length
            );
            if (maxValues > 0) {
                similarity += (commonValues / maxValues) * 0.1;
                totalWeight += 0.1;
            }
        }

        // Calculate goals similarity
        if (user1.goals && user2.goals) {
            const commonGoals = user1.goals.filter(g => g && user2.goals.includes(g)).length;
            const maxGoals = Math.max(
                user1.goals.filter(g => g).length,
                user2.goals.filter(g => g).length
            );
            if (maxGoals > 0) {
                similarity += (commonGoals / maxGoals) * 0.15;
                totalWeight += 0.15;
            }
        }

        // Calculate location similarity
        if (user1.location?.coordinates && user2.location?.coordinates) {
            const distance = calculateDistance(
                parseFloat(user1.location.coordinates[1]),
                parseFloat(user1.location.coordinates[0]),
                parseFloat(user2.location.coordinates[1]),
                parseFloat(user2.location.coordinates[0])
            );
            const locationSimilarity = Math.max(0, 1 - distance / 100); // Normalize by 100km
            similarity += locationSimilarity * 0.15;
            totalWeight += 0.15;
        }

        // Calculate occupation similarity
        if (user1.occupation && user2.occupation) {
            const occupationSimilarity = user1.occupation === user2.occupation ? 1 : 0;
            similarity += occupationSimilarity * 0.1;
            totalWeight += 0.1;
        }

        return totalWeight > 0 ? similarity / totalWeight : 0;
    }

    // Calculate distance between two points using Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Start training
    startTrainingBtn.addEventListener('click', async () => {
        if (!usersData || !matchesData) {
            alert('Please upload both users and matches data first');
            return;
        }

        const epochs = parseInt(document.getElementById('epochs').value);
        const learningRate = parseFloat(document.getElementById('learningRate').value);
        const batchSize = parseInt(document.getElementById('batchSize').value);

        startTrainingBtn.disabled = true;
        progressBar.style.width = '0%';
        
        try {
            const optimizedWeights = await trainModel(usersData, matchesData, {
                epochs,
                learningRate,
                batchSize
            });

            displayOptimizedWeights(optimizedWeights);
            applyWeightsBtn.disabled = false;
        } catch (error) {
            console.error('Training error:', error);
            alert('Error during training. Please try again.');
        } finally {
            startTrainingBtn.disabled = false;
        }
    });

    // Train model
    async function trainModel(users, matches, params) {
        const { epochs, learningRate, batchSize } = params;
        
        // Reset chart data
        trainingChart.data.labels = [];
        trainingChart.data.datasets[0].data = [];
        trainingChart.data.datasets[1].data = [];
        trainingChart.update();

        // Initialize weights với giá trị từ file weights.json
        let weights = {
            age: 0.15,
            interests: 0.2,
            lifestyle: 0.15,
            values: 0.1,
            goals: 0.15,
            location: 0.15,
            occupation: 0.1
        };

        // Create training pairs
        const trainingPairs = matches.map(match => {
            const sender = users.find(u => u._id === match.sender);
            const receiver = users.find(u => u._id === match.receiver);
            if (!sender || !receiver) return null;

            return {
                sender,
                receiver,
                label: match.status === 'accepted' ? 1 : (match.status === 'rejected' ? 0 : 0.5)
            };
        }).filter(pair => pair !== null);

        // Training loop
        for (let epoch = 1; epoch <= epochs; epoch++) {
            let totalLoss = 0;
            let correctPredictions = 0;
            
            // Process each batch
            for (let i = 0; i < trainingPairs.length; i += batchSize) {
                const batch = trainingPairs.slice(i, i + batchSize);
                const gradients = {
                    age: 0,
                    interests: 0,
                    lifestyle: 0,
                    values: 0,
                    goals: 0,
                    location: 0,
                    occupation: 0
                };
                
                batch.forEach(pair => {
                    // Calculate feature similarities
                    const similarities = {
                        age: calculateAgeSimilarity(pair.sender, pair.receiver),
                        interests: calculateInterestsSimilarity(pair.sender, pair.receiver),
                        lifestyle: calculateLifestyleSimilarity(pair.sender, pair.receiver),
                        values: calculateValuesSimilarity(pair.sender, pair.receiver),
                        goals: calculateGoalsSimilarity(pair.sender, pair.receiver),
                        location: calculateLocationSimilarity(pair.sender, pair.receiver),
                        occupation: calculateOccupationSimilarity(pair.sender, pair.receiver)
                    };

                    // Calculate predicted score using current weights
                    let predictedScore = 0;
                    Object.keys(weights).forEach(key => {
                        predictedScore += similarities[key] * weights[key];
                    });

                    // Calculate error
                    const error = predictedScore - pair.label;
                    totalLoss += error * error;

                    // Update gradients
                    Object.keys(gradients).forEach(key => {
                        gradients[key] += error * similarities[key];
                    });

                    // Check if prediction is correct (within threshold)
                    if (Math.abs(error) < 0.2) {
                        correctPredictions++;
                    }
                });

                // Update weights using accumulated gradients
                Object.keys(weights).forEach(key => {
                    weights[key] -= (learningRate * gradients[key]) / batch.length;
                    // Ensure weights stay positive and not too small
                    weights[key] = Math.max(0.05, weights[key]);
                });

                // Normalize weights to sum to 1
                const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
                Object.keys(weights).forEach(key => {
                    weights[key] = weights[key] / totalWeight;
                });
            }

            // Calculate epoch metrics
            const epochLoss = totalLoss / trainingPairs.length;
            const epochAccuracy = correctPredictions / trainingPairs.length;

            // Update progress
            const progress = (epoch / epochs) * 100;
            progressBar.style.width = `${progress}%`;
            currentEpoch.textContent = epoch;
            currentLoss.textContent = epochLoss.toFixed(4);
            currentAccuracy.textContent = (epochAccuracy * 100).toFixed(2) + '%';

            // Update chart
            trainingChart.data.labels.push(epoch);
            trainingChart.data.datasets[0].data.push(epochLoss);
            trainingChart.data.datasets[1].data.push(epochAccuracy);
            trainingChart.update();

            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        return weights;
    }

    // Helper functions for calculating similarities
    function calculateAgeSimilarity(user1, user2) {
        if (!user1.age || !user2.age) return 0;
        const ageDiff = Math.abs(parseInt(user1.age) - parseInt(user2.age));
        return Math.max(0, 1 - ageDiff / 20); // Normalize by 20 years difference
    }

    function calculateInterestsSimilarity(user1, user2) {
        if (!user1.interests || !user2.interests) return 0;
        const interests1 = user1.interests.filter(i => i);
        const interests2 = user2.interests.filter(i => i);
        if (interests1.length === 0 || interests2.length === 0) return 0;
        
        const commonInterests = interests1.filter(i => interests2.includes(i)).length;
        return commonInterests / Math.max(interests1.length, interests2.length);
    }

    function calculateLifestyleSimilarity(user1, user2) {
        if (!user1.lifestyle || !user2.lifestyle) return 0;
        const lifestyle1 = user1.lifestyle.filter(l => l);
        const lifestyle2 = user2.lifestyle.filter(l => l);
        if (lifestyle1.length === 0 || lifestyle2.length === 0) return 0;
        
        const commonLifestyle = lifestyle1.filter(l => lifestyle2.includes(l)).length;
        return commonLifestyle / Math.max(lifestyle1.length, lifestyle2.length);
    }

    function calculateValuesSimilarity(user1, user2) {
        if (!user1.values || !user2.values) return 0;
        const values1 = user1.values.filter(v => v);
        const values2 = user2.values.filter(v => v);
        if (values1.length === 0 || values2.length === 0) return 0;
        
        const commonValues = values1.filter(v => values2.includes(v)).length;
        return commonValues / Math.max(values1.length, values2.length);
    }

    function calculateGoalsSimilarity(user1, user2) {
        if (!user1.goals || !user2.goals) return 0;
        const goals1 = user1.goals.filter(g => g);
        const goals2 = user2.goals.filter(g => g);
        if (goals1.length === 0 || goals2.length === 0) return 0;
        
        const commonGoals = goals1.filter(g => goals2.includes(g)).length;
        return commonGoals / Math.max(goals1.length, goals2.length);
    }

    function calculateLocationSimilarity(user1, user2) {
        if (!user1.location?.coordinates || !user2.location?.coordinates) return 0;
        const distance = calculateDistance(
            parseFloat(user1.location.coordinates[1]),
            parseFloat(user1.location.coordinates[0]),
            parseFloat(user2.location.coordinates[1]),
            parseFloat(user2.location.coordinates[0])
        );
        return Math.max(0, 1 - distance / 100); // Normalize by 100km
    }

    function calculateOccupationSimilarity(user1, user2) {
        if (!user1.occupation || !user2.occupation) return 0;
        return user1.occupation === user2.occupation ? 1 : 0;
    }

    // Display optimized weights
    function displayOptimizedWeights(weights) {
        optimizedWeightsDiv.innerHTML = '';
        
        Object.entries(weights).forEach(([key, value]) => {
            const weightItem = document.createElement('div');
            weightItem.className = 'weight-item';
            weightItem.innerHTML = `
                <div class="label">${key}</div>
                <div class="value">${(value * 100).toFixed(1)}%</div>
            `;
            optimizedWeightsDiv.appendChild(weightItem);
        });
    }

    // Apply optimized weights
    applyWeightsBtn.addEventListener('click', async () => {
        const weights = {};
        optimizedWeightsDiv.querySelectorAll('.weight-item').forEach(item => {
            const key = item.querySelector('.label').textContent;
            const value = parseFloat(item.querySelector('.value').textContent) / 100;
            weights[key] = value;
        });

        try {
            const response = await fetch(`${API_URL}/admin/weights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(weights)
            });

            if (!response.ok) throw new Error('Failed to apply weights');
            alert('Weights applied successfully!');
        } catch (error) {
            console.error('Error applying weights:', error);
            alert('Failed to apply weights. Please try again.');
        }
    });

    // Initialize
    initChart();
}); 