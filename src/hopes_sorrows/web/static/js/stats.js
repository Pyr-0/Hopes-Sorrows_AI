// Statistics Dashboard
class StatsDashboard {
    constructor() {
        this.socket = null;
        this.charts = {};
        this.data = {
            hope: 0,
            sorrow: 0,
            transformative: 0,
            ambivalent: 0,
            reflective_neutral: 0
        };
        this.activityHistory = [];
        this.intensityData = [];
        this.confidenceData = [];
        
        this.initializeSocket();
        this.initializeCharts();
        this.setupEventListeners();
        this.loadInitialData();
    }
    
    initializeSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('📊 Connected to statistics feed');
                this.addFeedItem('Connected to live statistics feed', 'system');
            });
            
            this.socket.on('blob_added', (data) => {
                this.handleNewBlob(data);
            });
            
            this.socket.on('blob_removed', (data) => {
                this.handleBlobRemoved(data);
            });
            
            this.socket.on('visualization_cleared', () => {
                this.handleVisualizationCleared();
            });
        }
    }
    
    async loadInitialData() {
        try {
            const response = await fetch('/api/get_all_blobs');
            const data = await response.json();
            
            if (data.blobs) {
                console.log('📊 Stats: Loading', data.blobs.length, 'blobs');
                
                // Reset counts
                Object.keys(this.data).forEach(key => this.data[key] = 0);
                this.intensityData = [];
                this.confidenceData = [];
                
                // Process existing blobs - ensure no duplicates
                const uniqueBlobs = new Map();
                data.blobs.forEach(blob => {
                    // Use blob ID as key to prevent duplicates
                    if (!uniqueBlobs.has(blob.id)) {
                        uniqueBlobs.set(blob.id, blob);
                        this.processBlob(blob);
                    } else {
                        console.warn('📊 Stats: Duplicate blob detected and skipped:', blob.id);
                    }
                });
                
                console.log('📊 Stats: Processed', uniqueBlobs.size, 'unique blobs');
                this.updateAllDisplays();
            }
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }
    
    processBlob(blob) {
        const category = blob.category || 'reflective_neutral';
        console.log('📊 Processing blob:', blob.id, 'category:', category, 'text:', blob.text?.substring(0, 30) + '...');
        
        // Ensure we have the category in our data structure
        if (!this.data.hasOwnProperty(category)) {
            console.warn('📊 Unknown category detected:', category, 'adding to data structure');
            this.data[category] = 0;
        }
        
        this.data[category]++;
        
        this.intensityData.push({
            category: category,
            intensity: blob.intensity || 0.5
        });
        
        this.confidenceData.push({
            category: category,
            confidence: blob.confidence || 0.5
        });
        
        console.log('📊 Category counts after processing:', this.data);
    }
    
    handleNewBlob(blob) {
        console.log('📊 New blob received via WebSocket:', blob.id);
        
        // Check if we already have this blob to prevent duplicates
        const existingBlobIndex = this.intensityData.findIndex(item => item.blob_id === blob.id);
        if (existingBlobIndex !== -1) {
            console.log('📊 Blob already exists, skipping:', blob.id);
            return;
        }
        
        // Add blob_id to intensity and confidence data for tracking
        this.processBlob(blob);
        
        // Mark the last entries with the blob ID for tracking
        if (this.intensityData.length > 0) {
            this.intensityData[this.intensityData.length - 1].blob_id = blob.id;
        }
        if (this.confidenceData.length > 0) {
            this.confidenceData[this.confidenceData.length - 1].blob_id = blob.id;
        }
        
        this.updateAllDisplays();
        
        const categoryName = this.formatCategoryName(blob.category);
        this.addFeedItem(`New ${categoryName} voice added`, 'blob', blob.category);
    }
    
    handleBlobRemoved(data) {
        // Implementation for blob removal if needed
        this.addFeedItem('Voice removed from landscape', 'system');
    }
    
    handleVisualizationCleared() {
        Object.keys(this.data).forEach(key => this.data[key] = 0);
        this.intensityData = [];
        this.confidenceData = [];
        this.updateAllDisplays();
        this.addFeedItem('Emotional landscape cleared', 'system');
    }
    
    updateAllDisplays() {
        this.updateOverviewCards();
        this.updateCharts();
        this.updateDetailedStats();
    }
    
    updateOverviewCards() {
        const total = Object.values(this.data).reduce((sum, count) => sum + count, 0);
        
        document.getElementById('total-voices').textContent = total;
        document.getElementById('hope-count').textContent = this.data.hope;
        document.getElementById('sorrow-count').textContent = this.data.sorrow;
        document.getElementById('transformative-count').textContent = this.data.transformative;
        document.getElementById('ambivalent-count').textContent = this.data.ambivalent;
        document.getElementById('reflective-count').textContent = this.data.reflective_neutral;
    }
    
    updateDetailedStats() {
        // Calculate averages
        const avgConfidence = this.confidenceData.length > 0 
            ? this.confidenceData.reduce((sum, item) => sum + item.confidence, 0) / this.confidenceData.length
            : 0;
            
        const avgIntensity = this.intensityData.length > 0
            ? this.intensityData.reduce((sum, item) => sum + item.intensity, 0) / this.intensityData.length
            : 0;
        
        // Find most common emotion
        const mostCommon = Object.entries(this.data)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        document.getElementById('avg-confidence').textContent = `${Math.round(avgConfidence * 100)}%`;
        document.getElementById('avg-intensity').textContent = `${Math.round(avgIntensity * 100)}%`;
        document.getElementById('most-common').textContent = this.formatCategoryName(mostCommon);
        document.getElementById('active-speakers').textContent = this.confidenceData.length;
    }
    
    initializeCharts() {
        // Emotion Distribution Pie Chart
        const pieCtx = document.getElementById('emotion-pie-chart').getContext('2d');
        this.charts.pie = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Hope', 'Sorrow', 'Transformative', 'Ambivalent', 'Reflective'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#FFD700',  // Hope
                        '#4A90E2',  // Sorrow
                        '#9B59B6',  // Transformative
                        '#E74C3C',  // Ambivalent
                        '#95A5A6'   // Reflective
                    ],
                    borderWidth: 2,
                    borderColor: '#1a1a1a'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0'
                        }
                    }
                }
            }
        });
        
        // Growth Over Time Line Chart
        const lineCtx = document.getElementById('growth-line-chart').getContext('2d');
        this.charts.line = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total Voices',
                    data: [],
                    borderColor: '#00D4AA',
                    backgroundColor: 'rgba(0, 212, 170, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e0e0e0' }
                    }
                }
            }
        });
        
        // Daily Activity Bar Chart
        const barCtx = document.getElementById('daily-activity-chart').getContext('2d');
        this.charts.bar = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Voices Shared',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(0, 212, 170, 0.6)',
                    borderColor: '#00D4AA',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e0e0e0' }
                    }
                }
            }
        });
        
        // Intensity Distribution Radar Chart
        const radarCtx = document.getElementById('intensity-chart').getContext('2d');
        this.charts.radar = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Hope', 'Sorrow', 'Transformative', 'Ambivalent', 'Reflective'],
                datasets: [{
                    label: 'Average Intensity',
                    data: [0, 0, 0, 0, 0],
                    borderColor: '#00D4AA',
                    backgroundColor: 'rgba(0, 212, 170, 0.2)',
                    pointBackgroundColor: '#00D4AA',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#00D4AA'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 1,
                        ticks: { color: '#e0e0e0' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#e0e0e0' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#e0e0e0' }
                    }
                }
            }
        });
    }
    
    updateCharts() {
        // Update pie chart
        this.charts.pie.data.datasets[0].data = [
            this.data.hope,
            this.data.sorrow,
            this.data.transformative,
            this.data.ambivalent,
            this.data.reflective_neutral
        ];
        this.charts.pie.update();
        
        // Update line chart (simplified - just add current total)
        const total = Object.values(this.data).reduce((sum, count) => sum + count, 0);
        const now = new Date().toLocaleTimeString();
        
        if (this.charts.line.data.labels.length > 20) {
            this.charts.line.data.labels.shift();
            this.charts.line.data.datasets[0].data.shift();
        }
        
        this.charts.line.data.labels.push(now);
        this.charts.line.data.datasets[0].data.push(total);
        this.charts.line.update();
        
        // Update intensity radar chart
        const categories = ['hope', 'sorrow', 'transformative', 'ambivalent', 'reflective_neutral'];
        const intensities = categories.map(category => {
            const categoryData = this.intensityData.filter(item => item.category === category);
            return categoryData.length > 0 
                ? categoryData.reduce((sum, item) => sum + item.intensity, 0) / categoryData.length
                : 0;
        });
        
        this.charts.radar.data.datasets[0].data = intensities;
        this.charts.radar.update();
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    }
    
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tab}-panel`);
        });
    }
    
    addFeedItem(text, type = 'info', category = null) {
        const feed = document.getElementById('activity-feed');
        const time = new Date().toLocaleTimeString();
        
        let icon = '📊';
        if (type === 'blob') {
            const icons = {
                hope: '💝',
                sorrow: '💙',
                transformative: '🦋',
                ambivalent: '⚖️',
                reflective_neutral: '🤔'
            };
            icon = icons[category] || '🎤';
        } else if (type === 'system') {
            icon = '⚙️';
        }
        
        const item = document.createElement('div');
        item.className = 'feed-item';
        item.innerHTML = `
            <div class="feed-icon">${icon}</div>
            <div class="feed-content">
                <div class="feed-text">${text}</div>
                <div class="feed-time">${time}</div>
            </div>
        `;
        
        // Remove welcome message if it exists
        const welcome = feed.querySelector('.welcome');
        if (welcome) {
            welcome.remove();
        }
        
        feed.insertBefore(item, feed.firstChild);
        
        // Limit feed items
        const items = feed.querySelectorAll('.feed-item');
        if (items.length > 50) {
            items[items.length - 1].remove();
        }
    }
    
    formatCategoryName(category) {
        const names = {
            hope: 'Hope',
            sorrow: 'Sorrow', 
            transformative: 'Transformative',
            ambivalent: 'Ambivalent',
            reflective_neutral: 'Reflective'
        };
        return names[category] || 'Unknown';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new StatsDashboard();
}); 