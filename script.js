// Global State
let state = {
    numProcesses: 5,
    numResources: 3,
    allocation: [],
    maximum: [],
    available: [],
    need: [],
    safeSequence: [],
    isSafe: false,
    simulationStep: 0,
    simulationData: [],
    charts: {
        allocation: null,
        distribution: null
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupEventListeners();
    setupWelcomePage();
});

// ============================================================================
// THEME MANAGEMENT
// ============================================================================
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
}

function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

// ============================================================================
// WELCOME PAGE MANAGEMENT
// ============================================================================
function setupWelcomePage() {
    const startSimBtn = document.getElementById('startSimBtn');
    const learnBtn = document.querySelector('.btn-learn');

    if (startSimBtn) {
        startSimBtn.addEventListener('click', startSimulation);
    }

    if (learnBtn) {
        learnBtn.addEventListener('click', learnAboutAlgorithm);
    }
}

function startSimulation() {
    const welcomePage = document.getElementById('welcomePage');
    const simulatorPage = document.getElementById('simulatorPage');

    if (welcomePage) {
        welcomePage.classList.add('hidden');
    }

    if (simulatorPage) {
        simulatorPage.classList.remove('hidden');
    }
}

function learnAboutAlgorithm() {
    alert(`Banker's Algorithm - Quick Overview\n\n` +
        `The Banker's Algorithm is a deadlock avoidance algorithm used in operating systems.\n\n` +
        `Key Concepts:\n` +
        `• Allocation Matrix: Resources currently allocated to processes\n` +
        `• Maximum Matrix: Maximum resources each process may request\n` +
        `• Available Resources: Resources not yet allocated\n` +
        `• Need Matrix: Additional resources each process may still need\n\n` +
        `The algorithm checks if granting a resource will leave the system in a safe state,\n` +
        `where all processes can eventually finish execution without deadlock.\n\n` +
        `Safe Sequence: An order of process execution where all processes can complete.`);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
}

// ============================================================================
// TABLE GENERATION
// ============================================================================
function generateTables() {
    const numProcesses = parseInt(document.getElementById('numProcesses').value);
    const numResources = parseInt(document.getElementById('numResources').value);

    if (numProcesses < 1 || numResources < 1) {
        alert('Please enter valid numbers');
        return;
    }

    state.numProcesses = numProcesses;
    state.numResources = numResources;

    // Initialize matrices with zeros
    state.allocation = Array(numProcesses).fill(null).map(() => Array(numResources).fill(0));
    state.maximum = Array(numProcesses).fill(null).map(() => Array(numResources).fill(0));
    state.available = Array(numResources).fill(0);
    state.need = Array(numProcesses).fill(null).map(() => Array(numResources).fill(0));

    renderAllocationTable();
    renderMaximumTable();
    renderAvailableTable();
    renderNeedMatrix();

    // Enable buttons
    document.getElementById('calculateNeedBtn').disabled = false;
    document.getElementById('runAlgorithmBtn').disabled = false;
    document.getElementById('stepSimBtn').disabled = false;

    clearResults();
}

function renderAllocationTable() {
    const container = document.getElementById('allocationTableContainer');
    let html = '<table><tr><th>Process</th>';

    for (let j = 0; j < state.numResources; j++) {
        html += `<th>R${j}</th>`;
    }
    html += '</tr>';

    for (let i = 0; i < state.numProcesses; i++) {
        html += `<tr><td>P${i}</td>`;
        for (let j = 0; j < state.numResources; j++) {
            html += `<td><input type="number" min="0" value="${state.allocation[i][j]}" 
                    onchange="state.allocation[${i}][${j}] = parseInt(this.value) || 0; calculateNeedMatrix()"></td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    container.innerHTML = html;
}

function renderMaximumTable() {
    const container = document.getElementById('maximumTableContainer');
    let html = '<table><tr><th>Process</th>';

    for (let j = 0; j < state.numResources; j++) {
        html += `<th>R${j}</th>`;
    }
    html += '</tr>';

    for (let i = 0; i < state.numProcesses; i++) {
        html += `<tr><td>P${i}</td>`;
        for (let j = 0; j < state.numResources; j++) {
            html += `<td><input type="number" min="0" value="${state.maximum[i][j]}" 
                    onchange="state.maximum[${i}][${j}] = parseInt(this.value) || 0; calculateNeedMatrix()"></td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    container.innerHTML = html;
}

function renderAvailableTable() {
    const container = document.getElementById('availableTableContainer');
    let html = '<table><tr><th>Resource</th>';

    for (let j = 0; j < state.numResources; j++) {
        html += `<th>R${j}</th>`;
    }
    html += '</tr><tr><td>Available</td>';

    for (let j = 0; j < state.numResources; j++) {
        html += `<td><input type="number" min="0" value="${state.available[j]}" 
                onchange="state.available[${j}] = parseInt(this.value) || 0; calculateNeedMatrix()"></td>`;
    }
    html += '</tr></table>';
    container.innerHTML = html;
}

function renderNeedMatrix() {
    const container = document.getElementById('needTableContainer');
    let html = '<table><tr><th>Process</th>';

    for (let j = 0; j < state.numResources; j++) {
        html += `<th>R${j}</th>`;
    }
    html += '</tr>';

    for (let i = 0; i < state.numProcesses; i++) {
        html += `<tr><td>P${i}</td>`;
        for (let j = 0; j < state.numResources; j++) {
            html += `<td>${state.need[i][j]}</td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    container.innerHTML = html;
}

// ============================================================================
// NEED MATRIX CALCULATION
// ============================================================================
function calculateNeedMatrix() {
    // Need = Maximum - Allocation
    for (let i = 0; i < state.numProcesses; i++) {
        for (let j = 0; j < state.numResources; j++) {
            state.need[i][j] = state.maximum[i][j] - state.allocation[i][j];
        }
    }
    renderNeedMatrix();
}

// ============================================================================
// BANKER'S ALGORITHM
// ============================================================================
function runBankersAlgorithm() {
    clearResults();
    state.simulationData = [];
    state.simulationStep = 0;

    // Check if Need Matrix is valid
    for (let i = 0; i < state.numProcesses; i++) {
        for (let j = 0; j < state.numResources; j++) {
            if (state.need[i][j] < 0) {
                showUnsafeState('Invalid input: Need cannot be negative');
                return;
            }
        }
    }

    const result = findSafeSequence();
    state.isSafe = result.isSafe;
    state.safeSequence = result.sequence;
    state.simulationData = result.steps;

    if (result.isSafe) {
        showSafeState(result.sequence);
        renderCharts();
    } else {
        showUnsafeState('System is in UNSAFE state. Deadlock may occur.');
    }
}

function findSafeSequence() {
    const n = state.numProcesses;
    const m = state.numResources;

    // Initialize
    let work = [...state.available];
    let finish = Array(n).fill(false);
    let safeSequence = [];
    let steps = [];

    // Initial step
    steps.push({
        step: 0,
        title: 'Initialization',
        work: [...work],
        executing: -1,
        details: `Work initialized to Available resources: [${work.join(', ')}]`
    });

    let stepCount = 1;

    // Safety Algorithm
    while (safeSequence.length < n) {
        let found = false;

        for (let i = 0; i < n; i++) {
            if (finish[i]) continue;

            // Check if Need[i] <= Work
            let canExecute = true;
            for (let j = 0; j < m; j++) {
                if (state.need[i][j] > work[j]) {
                    canExecute = false;
                    break;
                }
            }

            if (canExecute) {
                found = true;

                // Record step
                steps.push({
                    step: stepCount++,
                    title: `Process P${i} can execute`,
                    work: [...work],
                    executing: i,
                    details: `Need[P${i}] = [${state.need[i].join(', ')}] ≤ Work = [${work.join(', ')}]`
                });

                // Release resources
                for (let j = 0; j < m; j++) {
                    work[j] += state.allocation[i][j];
                }

                steps.push({
                    step: stepCount++,
                    title: `Resources released by P${i}`,
                    work: [...work],
                    executing: i,
                    details: `Work updated to: [${work.join(', ')}]`
                });

                finish[i] = true;
                safeSequence.push(i);
                break;
            }
        }

        if (!found) {
            // No process can run
            return {
                isSafe: false,
                sequence: [],
                steps: steps
            };
        }
    }

    return {
        isSafe: true,
        sequence: safeSequence,
        steps: steps
    };
}

// ============================================================================
// STEP SIMULATION
// ============================================================================
function stepSimulation() {
    if (state.simulationData.length === 0) {
        alert('Please run the algorithm first');
        return;
    }

    if (state.simulationStep < state.simulationData.length) {
        displayStep(state.simulationData[state.simulationStep]);
        state.simulationStep++;
    }

    if (state.simulationStep >= state.simulationData.length) {
        document.getElementById('stepSimBtn').disabled = true;
    }
}

function displayStep(stepData) {
    const container = document.getElementById('simulationSteps');
    
    const stepElement = document.createElement('div');
    stepElement.className = 'step-item';
    if (stepData.executing !== -1 && stepData.step > 0) {
        stepElement.classList.add('executing');
    }
    
    stepElement.innerHTML = `
        <div class="step-title">Step ${stepData.step}: ${stepData.title}</div>
        <div class="step-detail">Work: [${stepData.work.join(', ')}]</div>
        <div class="step-detail">${stepData.details}</div>
        ${stepData.executing !== -1 ? `<div class="step-detail"><strong>Current Process: P${stepData.executing}</strong></div>` : ''}
    `;
    
    container.appendChild(stepElement);
    container.scrollTop = container.scrollHeight;
}

// ============================================================================
// RESULT DISPLAY
// ============================================================================
function showSafeState(sequence) {
    const resultOutput = document.getElementById('resultOutput');
    resultOutput.className = 'result-output safe';
    resultOutput.innerHTML = '<span style="color: var(--success-color); font-weight: 700;">✓ System is in SAFE state</span>';

    const safeSequenceOutput = document.getElementById('safeSequenceOutput');
    safeSequenceOutput.className = 'safe-sequence-output safe';
    let html = '';
    
    for (let i = 0; i < sequence.length; i++) {
        html += `<span class="process-badge">P${sequence[i]}</span>`;
        if (i < sequence.length - 1) {
            html += '<span class="arrow-separator">→</span>';
        }
    }
    
    safeSequenceOutput.innerHTML = html;
}

function showUnsafeState(message) {
    const resultOutput = document.getElementById('resultOutput');
    resultOutput.className = 'result-output unsafe';
    resultOutput.innerHTML = `<span style="color: var(--danger-color); font-weight: 700;">✗ ${message}</span>`;

    const safeSequenceOutput = document.getElementById('safeSequenceOutput');
    safeSequenceOutput.className = 'safe-sequence-output unsafe';
    safeSequenceOutput.innerHTML = '<span>No safe sequence exists</span>';
}

function clearResults() {
    document.getElementById('resultOutput').innerHTML = '<p class="placeholder-text">Run the algorithm to see results</p>';
    document.getElementById('safeSequenceOutput').innerHTML = '<p class="placeholder-text">Safe sequence will appear here</p>';
    document.getElementById('simulationSteps').innerHTML = '<p class="placeholder-text">Simulation steps will appear here</p>';
    document.getElementById('stepSimBtn').disabled = false;
}

// ============================================================================
// CHART VISUALIZATION
// ============================================================================
function renderCharts() {
    renderAllocationChart();
    renderDistributionChart();
}

function renderAllocationChart() {
    const ctx = document.getElementById('allocationChart');
    if (!ctx) return;

    // Destroy previous chart if exists
    if (state.charts.allocation) {
        state.charts.allocation.destroy();
    }

    const labels = Array.from({length: state.numProcesses}, (_, i) => `P${i}`);
    const datasets = [];

    // Create dataset for each resource
    for (let j = 0; j < state.numResources; j++) {
        const data = Array.from({length: state.numProcesses}, (_, i) => state.allocation[i][j]);
        datasets.push({
            label: `R${j}`,
            data: data,
            backgroundColor: getChartColor(j),
            borderColor: getChartBorderColor(j),
            borderWidth: 2,
            borderRadius: 5
        });
    }

    state.charts.allocation = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 12,
                            weight: '600'
                        },
                        padding: 15,
                        color: getTextColor()
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getTextColor(),
                        font: {
                            family: "'Poppins', sans-serif"
                        }
                    },
                    grid: {
                        color: getBorderColor()
                    }
                },
                x: {
                    ticks: {
                        color: getTextColor(),
                        font: {
                            family: "'Poppins', sans-serif",
                            weight: '600'
                        }
                    },
                    grid: {
                        color: getBorderColor()
                    }
                }
            }
        }
    });
}

function renderDistributionChart() {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) return;

    // Destroy previous chart if exists
    if (state.charts.distribution) {
        state.charts.distribution.destroy();
    }

    // Calculate total allocated, available, and need per resource
    const labels = Array.from({length: state.numResources}, (_, i) => `R${i}`);
    
    const allocated = Array(state.numResources).fill(0);
    for (let i = 0; i < state.numProcesses; i++) {
        for (let j = 0; j < state.numResources; j++) {
            allocated[j] += state.allocation[i][j];
        }
    }

    const available = [...state.available];
    const total = allocated.map((a, i) => a + available[i]);

    state.charts.distribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Allocated', 'Available'],
            datasets: labels.map((label, idx) => ({
                label: label,
                data: [allocated[idx], available[idx]],
                backgroundColor: [
                    getChartColor(idx),
                    getChartColor(idx, 0.3)
                ],
                borderColor: getChartBorderColor(idx),
                borderWidth: 2
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 11,
                            weight: '600'
                        },
                        padding: 15,
                        color: getTextColor()
                    }
                },
                tooltip: {
                    titleFont: {
                        family: "'Poppins', sans-serif"
                    },
                    bodyFont: {
                        family: "'Poppins', sans-serif"
                    }
                }
            }
        }
    });
}

function getChartColor(index, alpha = 1) {
    const colors = [
        `rgba(99, 102, 241, ${alpha})`,      // Indigo
        `rgba(139, 92, 246, ${alpha})`,      // Purple
        `rgba(16, 185, 129, ${alpha})`,      // Green
        `rgba(59, 130, 246, ${alpha})`,      // Blue
        `rgba(245, 158, 11, ${alpha})`       // Amber
    ];
    return colors[index % colors.length];
}

function getChartBorderColor(index) {
    const colors = [
        'rgb(99, 102, 241)',
        'rgb(139, 92, 246)',
        'rgb(16, 185, 129)',
        'rgb(59, 130, 246)',
        'rgb(245, 158, 11)'
    ];
    return colors[index % colors.length];
}

function getTextColor() {
    return document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#1f2937';
}

function getBorderColor() {
    return document.body.classList.contains('dark-mode') ? '#374151' : '#e5e7eb';
}

// ============================================================================
// PRESET DATA
// ============================================================================
function loadPreset() {
    // Preset data: 5 processes, 3 resources
    state.numProcesses = 5;
    state.numResources = 3;

    state.allocation = [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2]
    ];

    state.maximum = [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3]
    ];

    state.available = [3, 3, 2];

    // Update input fields
    document.getElementById('numProcesses').value = state.numProcesses;
    document.getElementById('numResources').value = state.numResources;

    // Render all tables
    renderAllocationTable();
    renderMaximumTable();
    renderAvailableTable();
    calculateNeedMatrix();

    // Enable buttons
    document.getElementById('calculateNeedBtn').disabled = false;
    document.getElementById('runAlgorithmBtn').disabled = false;
    document.getElementById('stepSimBtn').disabled = false;

    clearResults();
    alert('Preset data loaded! You can now run the Banker\'s Algorithm.');
}

// ============================================================================
// RESET
// ============================================================================
function resetSimulation() {
    state = {
        numProcesses: 5,
        numResources: 3,
        allocation: [],
        maximum: [],
        available: [],
        need: [],
        safeSequence: [],
        isSafe: false,
        simulationStep: 0,
        simulationData: [],
        charts: {
            allocation: null,
            distribution: null
        }
    };

    document.getElementById('numProcesses').value = 5;
    document.getElementById('numResources').value = 3;
    document.getElementById('allocationTableContainer').innerHTML = '<p class="placeholder-text">Generate tables to start</p>';
    document.getElementById('maximumTableContainer').innerHTML = '<p class="placeholder-text">Generate tables to start</p>';
    document.getElementById('availableTableContainer').innerHTML = '<p class="placeholder-text">Generate tables to start</p>';
    document.getElementById('needTableContainer').innerHTML = '<p class="placeholder-text">Generate tables to start</p>';
    document.getElementById('resultOutput').innerHTML = '<p class="placeholder-text">Run the algorithm to see results</p>';
    document.getElementById('safeSequenceOutput').innerHTML = '<p class="placeholder-text">Safe sequence will appear here</p>';
    document.getElementById('simulationSteps').innerHTML = '<p class="placeholder-text">Simulation steps will appear here</p>';

    document.getElementById('calculateNeedBtn').disabled = true;
    document.getElementById('runAlgorithmBtn').disabled = true;
    document.getElementById('stepSimBtn').disabled = true;

    // Destroy charts
    if (state.charts.allocation) {
        state.charts.allocation.destroy();
    }
    if (state.charts.distribution) {
        state.charts.distribution.destroy();
    }

    alert('Simulation reset successfully!');
}
