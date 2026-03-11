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

// ============================================================================
// PDF DOWNLOAD FUNCTIONALITY
// ============================================================================
function downloadResultsAsPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    let yPosition = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 15;
    const contentWidth = pageWidth - 30;

    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(99, 102, 241);
    pdf.setFont(undefined, 'bold');
    pdf.text("Banker's Algorithm Simulator Results", marginLeft, yPosition);
    yPosition += 12;

    // Timestamp
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont(undefined, 'normal');
    const timestamp = new Date().toLocaleString();
    pdf.text(`Generated: ${timestamp}`, marginLeft, yPosition);
    yPosition += 8;

    // Separator
    pdf.setDrawColor(229, 231, 235);
    pdf.line(marginLeft, yPosition, pageWidth - marginLeft, yPosition);
    yPosition += 8;

    // Configuration Section
    pdf.setFontSize(13);
    pdf.setTextColor(31, 41, 55);
    pdf.setFont(undefined, 'bold');
    pdf.text('Configuration', marginLeft, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(75, 85, 99);
    pdf.text(`Number of Processes: ${state.numProcesses}`, marginLeft + 5, yPosition);
    yPosition += 6;
    pdf.text(`Number of Resources: ${state.numResources}`, marginLeft + 5, yPosition);
    yPosition += 10;

    // Matrices Section
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('System State Matrices', marginLeft, yPosition);
    yPosition += 8;

    // Allocation Matrix
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(75, 85, 99);
    pdf.text('Allocation Matrix:', marginLeft + 5, yPosition);
    yPosition += 6;
    yPosition = addMatrixToPDF(pdf, state.allocation, yPosition, marginLeft + 10, 'P', 'R');

    // Maximum Matrix
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(75, 85, 99);
    pdf.text('Maximum Matrix:', marginLeft + 5, yPosition);
    yPosition += 6;
    yPosition = addMatrixToPDF(pdf, state.maximum, yPosition, marginLeft + 10, 'P', 'R');

    // Available Resources
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(75, 85, 99);
    pdf.text('Available Resources:', marginLeft + 5, yPosition);
    yPosition += 6;
    const availableRow = [['Resource', ...Array(state.numResources).fill(0).map((_, i) => `R${i}`)]];
    for (let j = 0; j < state.numResources; j++) {
        availableRow[0].push(state.available[j]);
    }
    yPosition = addMatrixToPDF(pdf, [state.available], yPosition, marginLeft + 10, 'Avail.', 'R');

    // Need Matrix
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(75, 85, 99);
    pdf.text('Need Matrix:', marginLeft + 5, yPosition);
    yPosition += 6;
    yPosition = addMatrixToPDF(pdf, state.need, yPosition, marginLeft + 10, 'P', 'R');

    // Check if new page needed
    if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 15;
    }

    // Results Section
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Algorithm Results', marginLeft, yPosition);
    yPosition += 8;

    // System State
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(75, 85, 99);
    const systemState = state.isSafe ? 'SAFE' : 'UNSAFE';
    const stateColor = state.isSafe ? [16, 185, 129] : [239, 68, 68];
    pdf.setTextColor(...stateColor);
    pdf.text(`System State: ${systemState}`, marginLeft + 5, yPosition);
    yPosition += 8;

    // Safe Sequence
    if (state.safeSequence.length > 0) {
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(75, 85, 99);
        pdf.text('Safe Sequence:', marginLeft + 5, yPosition);
        yPosition += 6;

        pdf.setFont(undefined, 'normal');
        const safeSeqText = state.safeSequence.join(' → ');
        const wrapped = pdf.splitTextToSize(safeSeqText, contentWidth - 10);
        wrapped.forEach(line => {
            if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 15;
            }
            pdf.text(line, marginLeft + 10, yPosition);
            yPosition += 6;
        });
        yPosition += 4;
    }

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(156, 163, 175);
    pdf.setFont(undefined, 'normal');
    pdf.text("Banker's Algorithm Simulator", marginLeft, pageHeight - 10);

    // Download PDF
    pdf.save('bankers-algorithm-results.pdf');
}

function addMatrixToPDF(pdf, matrix, startY, xPos, rowLabel, colLabel) {
    const cellWidth = 12;
    const cellHeight = 6;
    let y = startY;

    if (!matrix || matrix.length === 0) {
        pdf.setFontSize(9);
        pdf.setTextColor(180, 180, 180);
        pdf.text('No data available', xPos, y);
        return y + 8;
    }

    const numCols = matrix[0].length;
    const numRows = matrix.length;

    // Header row
    pdf.setFontSize(8);
    pdf.setTextColor(99, 102, 241);
    pdf.setFillColor(243, 244, 246);

    // Row labels header
    pdf.rect(xPos, y, cellWidth, cellHeight, 'FD');
    pdf.text(rowLabel, xPos + cellWidth / 2, y + cellHeight - 1, { align: 'center' });

    // Column headers
    for (let j = 0; j < numCols; j++) {
        pdf.rect(xPos + cellWidth + j * cellWidth, y, cellWidth, cellHeight, 'FD');
        pdf.text(`${colLabel}${j}`, xPos + cellWidth + j * cellWidth + cellWidth / 2, y + cellHeight - 1, { align: 'center' });
    }

    y += cellHeight;

    // Data rows
    pdf.setTextColor(75, 85, 99);
    for (let i = 0; i < numRows; i++) {
        // Row label
        pdf.setFillColor(243, 244, 246);
        pdf.rect(xPos, y, cellWidth, cellHeight, 'FD');
        pdf.text(`P${i}`, xPos + cellWidth / 2, y + cellHeight - 1, { align: 'center' });

        // Data cells
        for (let j = 0; j < numCols; j++) {
            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(229, 231, 235);
            pdf.rect(xPos + cellWidth + j * cellWidth, y, cellWidth, cellHeight, 'FD');
            const value = matrix[i][j];
            pdf.text(String(value), xPos + cellWidth + j * cellWidth + cellWidth / 2, y + cellHeight - 1, { align: 'center' });
        }

        y += cellHeight;
    }

    return y + 4;
}

