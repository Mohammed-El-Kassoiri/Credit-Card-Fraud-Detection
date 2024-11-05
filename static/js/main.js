// script.js
document.addEventListener('DOMContentLoaded', function() {
    const trainButton = document.getElementById('train-button');
    const loadingDiv = document.getElementById('loading');
    const trainingResult = document.getElementById('training-result');
    const statsContainer = document.querySelector('.stats-container');
    const predictionForm = document.getElementById('prediction-form');
    const predictionResult = document.getElementById('prediction-result');

    function createConfusionMatrix(matrix) {
        const total = matrix[0][0] + matrix[0][1] + matrix[1][0] + matrix[1][1];
        const getPercentage = (value) => ((value / total) * 100).toFixed(1);
        
        return `
            <div class="confusion-matrix mt-4">
                <h5 class="text-center mb-3">Matrice de Confusion</h5>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th class="matrix-header"></th>
                                <th class="matrix-header text-center" colspan="2">Prédiction</th>
                            </tr>
                            <tr>
                                <th class="matrix-header"></th>
                                <th class="matrix-header">Non-Fraude</th>
                                <th class="matrix-header">Fraude</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th class="matrix-header">Non-Fraude</th>
                                <td class="matrix-cell true-negative">
                                    ${matrix[0][0]}<br>
                                    <small>(${getPercentage(matrix[0][0])}%)</small>
                                </td>
                                <td class="matrix-cell false-positive">
                                    ${matrix[0][1]}<br>
                                    <small>(${getPercentage(matrix[0][1])}%)</small>
                                </td>
                            </tr>
                            <tr>
                                <th class="matrix-header">Fraude</th>
                                <td class="matrix-cell false-negative">
                                    ${matrix[1][0]}<br>
                                    <small>(${getPercentage(matrix[1][0])}%)</small>
                                </td>
                                <td class="matrix-cell true-positive">
                                    ${matrix[1][1]}<br>
                                    <small>(${getPercentage(matrix[1][1])}%)</small>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function updateStats(stats) {
        if (!stats) return;
        
        document.getElementById('total-transactions').textContent = stats.total_transactions.toLocaleString();
        document.getElementById('fraud-transactions').textContent = stats.fraud_transactions.toLocaleString();
        document.getElementById('legitimate-transactions').textContent = stats.legitimate_transactions.toLocaleString();
        document.getElementById('model-accuracy').textContent = (stats.test_accuracy * 100).toFixed(2) + '%';
    }

    function showError(message) {
        return `<div class="alert alert-danger" role="alert">${message}</div>`;
    }

    function showSuccess(message) {
        return `<div class="alert alert-success" role="alert">${message}</div>`;
    }

    if (trainButton) {
        trainButton.addEventListener('click', async function() {
            try {
                loadingDiv.classList.remove('d-none');
                trainButton.disabled = true;
                trainingResult.innerHTML = ''; // Clear previous results
                
                // Show stats container but clear values
                statsContainer.style.display = 'block';
                updateStats({
                    total_transactions: '-',
                    fraud_transactions: '-',
                    legitimate_transactions: '-',
                    test_accuracy: '-'
                });

                const response = await fetch('/train');
                const data = await response.json();

                if (data.status === 'success') {
                    // First update stats if available
                    if (data.data_stats) {
                        updateStats({
                            total_transactions: data.data_stats.total_transactions,
                            fraud_transactions: data.data_stats.fraud_transactions,
                            legitimate_transactions: data.data_stats.legitimate_transactions,
                            test_accuracy: data.test_accuracy
                        });
                    }

                    // Then add success message and confusion matrix to training result
                    let resultHTML = showSuccess(data.message);
                    if (data.confusion_matrix) {
                        resultHTML += createConfusionMatrix(data.confusion_matrix);
                    }
                    trainingResult.innerHTML = resultHTML;
                } else {
                    trainingResult.innerHTML = showError(data.message);
                }
            } catch (error) {
                trainingResult.innerHTML = showError('Erreur lors de l\'entraînement: ' + error.message);
            } finally {
                loadingDiv.classList.add('d-none');
                trainButton.disabled = false;
            }
        });
    }

    function createPredictionCurve(fraudProbability) {
        // Convert probability to decimal if it's a percentage
        const probability = fraudProbability > 1 ? fraudProbability / 100 : fraudProbability;
        
        // Generate data points for the curve
        function generateCurveData() {
            const data = [];
            for (let i = 0; i <= 100; i += 2) {
                const x = i / 100;
                // Create a bell curve centered around the fraud probability
                const y = Math.exp(-Math.pow(x - probability, 2) / 0.02);
                data.push({x: x, y: y});
            }
            return data;
        }
    
        // Get color based on probability
        function getColor(prob) {
            if (prob < 0.3) return 'rgba(34, 197, 94, 0.8)';  // Green
            if (prob < 0.7) return 'rgba(234, 179, 8, 0.8)';  // Yellow
            return 'rgba(239, 68, 68, 0.8)';                   // Red
        }
    
        const color = getColor(probability);
        const ctx = document.getElementById('predictionCurve').getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.predictionChart) {
            window.predictionChart.destroy();
        }
    
        window.predictionChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Niveau de Confiance',
                    data: generateCurveData(),
                    borderColor: color,
                    backgroundColor: color.replace('0.8', '0.2'),
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Confiance: ${(context.parsed.y * 100).toFixed(1)}%`;
                            },
                            title: function(context) {
                                return `Probabilité: ${(context.raw.x * 100).toFixed(1)}%`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Probabilité de Fraude (%)',
                            color: '#666'
                        },
                        ticks: {
                            callback: function(value) {
                                return value * 100 + '%';
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Niveau de Confiance',
                            color: '#666'
                        },
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(0) + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gérer la soumission du formulaire de prédiction
    if (predictionForm) {
        predictionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(predictionForm);
            const jsonData = {};
            
            formData.forEach((value, key) => {
                jsonData[key] = Number(value);
            });

            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(jsonData)
                });

                const data = await response.json();

                if (data.status === 'success') {
                    // Modified result HTML to include the curve container
                    const resultHTML = `
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title ${data.is_fraud ? 'text-danger' : 'text-success'}">
                                    ${data.is_fraud ? 'Transaction Frauduleuse Détectée!' : 'Transaction Légitime'}
                                </h5>
                                <div class="row mt-3">
                                    <div class="col-md-6">
                                        <p><strong>Probabilité de fraude:</strong> ${(data.fraud_probability * 100).toFixed(2)}%</p>
                                        <p><strong>Confiance de la prédiction:</strong> ${(data.confidence * 100).toFixed(2)}%</p>
                                    </div>
                                </div>
                                
                                <!-- Add the prediction curve container -->
                                <div class="prediction-curve-container">
                                    <h3 class="curve-title">Distribution de Confiance</h3>
                                    <canvas id="predictionCurve"></canvas>
                                </div>
    
                                <div class="mt-3">
                                    <h6>Importance des caractéristiques:</h6>
                                    <div class="row">
                                        ${Object.entries(data.feature_importance)
                                            .sort(([,a], [,b]) => b - a)
                                            .map(([feature, importance]) => `
                                                <div class="col-md-6">
                                                    <div class="progress mb-2" style="height: 20px;">
                                                        <div class="progress-bar" role="progressbar" 
                                                             style="width: ${(importance * 100).toFixed(2)}%"
                                                             aria-valuenow="${(importance * 100).toFixed(2)}" 
                                                             aria-valuemin="0" 
                                                             aria-valuemax="100">
                                                            ${feature}: ${(importance * 100).toFixed(2)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    predictionResult.innerHTML = resultHTML;
                    
                    // Create the prediction curve after adding the HTML
                    createPredictionCurve(data.fraud_probability);
                } else {
                    predictionResult.innerHTML = showError(data.message);
                }
            } catch (error) {
                predictionResult.innerHTML = showError('Erreur lors de la prédiction: ' + error.message);
            }
        });
    }
});
document.getElementById('train-model').addEventListener('click', async () => {
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('training-result');
    
    loadingDiv.classList.remove('d-none');
    resultDiv.innerHTML = '';
    
    try {
        const response = await fetch('/train');
        const data = await response.json();
        
        if (data.status === 'success') {
            // Mise à jour des statistiques
            document.getElementById('total-transactions').textContent = data.data_stats.total_transactions.toLocaleString();
            document.getElementById('fraud-transactions').textContent = data.data_stats.fraud_transactions.toLocaleString();
            document.getElementById('legitimate-transactions').textContent = data.data_stats.legitimate_transactions.toLocaleString();
            document.getElementById('model-accuracy').textContent = `${(data.test_accuracy * 100).toFixed(1)}%`;

            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <h4>Modèle entraîné avec succès!</h4>
                    <div class="stats-container">
                        <p>Score de clustering (${data.best_clustering_model}): ${data.clustering_score.toFixed(4)}</p>
                        <p>Précision entraînement: ${(data.train_accuracy * 100).toFixed(2)}%</p>
                        <p>Précision test: ${(data.test_accuracy * 100).toFixed(2)}%</p>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Erreur:</h4>
                    <p>${data.message}</p>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <h4>Erreur:</h4>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        loadingDiv.classList.add('d-none');
    }
});

document.getElementById('prediction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const resultDiv = document.getElementById('prediction-result');
    
    const data = {};
    formData.forEach((value, key) => {
        data[key] = Number(value);
    });
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            const fraudClass = result.is_fraud ? 'danger' : 'success';
            const fraudText = result.is_fraud ? 'FRAUDULEUSE' : 'LÉGITIME';
            
            resultDiv.innerHTML = `
                <div class="alert alert-${fraudClass}">
                    <h4>Prédiction: Transaction ${fraudText}</h4>
                    <p>Probabilité de fraude: ${(result.fraud_probability * 100).toFixed(2)}%</p>
                    <p>Confiance: ${(result.confidence * 100).toFixed(2)}%</p>
                </div>
            `;
            const resultHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title ${data.is_fraud ? 'text-danger' : 'text-success'}">
                            ${data.is_fraud ? 'Transaction Frauduleuse Détectée!' : 'Transaction Légitime'}
                        </h5>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <p><strong>Probabilité de fraude:</strong> ${(data.fraud_probability * 100).toFixed(2)}%</p>
                                <p><strong>Confiance de la prédiction:</strong> ${(data.confidence * 100).toFixed(2)}%</p>
                            </div>
                        </div>
                        
                        <!-- Add the prediction curve container -->
                        <div class="prediction-curve-container">
                            <h3 class="curve-title">Distribution de Confiance</h3>
                            <canvas id="predictionCurve"></canvas>
                        </div>

                        <div class="mt-3">
                            <h6>Importance des caractéristiques:</h6>
                            <!-- Your existing feature importance code -->
                        </div>
                    </div>
                </div>
            `;
            
            predictionResult.innerHTML = resultHTML;
            
            // Create the prediction curve after adding the HTML
            createPredictionCurve(data.fraud_probability);
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Erreur:</h4>
                    <p>${result.message}</p>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <h4>Erreur:</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
    
});
