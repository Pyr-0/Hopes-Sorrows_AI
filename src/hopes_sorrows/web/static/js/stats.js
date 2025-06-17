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
        this.rawBlobs = []; // Store raw blob data
        this.activityHistory = [];
        this.intensityData = [];
        this.confidenceData = [];
        
        this.initializeSocket();
        this.setupEventListeners();
        this.loadInitialData();
        this.initializeCharts();
        this.setupTabSystem(); // Add tab functionality
    }
    
    initializeSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('📊 Stats dashboard connected to server');
            });
            
            this.socket.on('blob_added', (blobData) => {
                console.log('📊 Real-time blob update received', blobData);
                this.updateFromNewBlob(blobData);
            });
            
            this.socket.on('visualization_cleared', () => {
                console.log('📊 Visualization cleared, resetting stats');
                this.resetAllStats();
            });
        }
    }
    
    setupEventListeners() {
        console.log('📊 Setting up stats event listeners');
        
        // No need for additional listeners since chart functionality is handled internally
    }

    /**
     * Setup tab system for detailed stats
     */
    setupTabSystem() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = button.dataset.tab;
                
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                const targetPanel = document.getElementById(targetTab);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
                
                console.log(`📊 Switched to tab: ${targetTab}`);
            });
        });
    }
    
    async loadInitialData() {
        try {
            console.log('📊 Loading initial blob data...');
            const response = await fetch('/api/get_all_blobs');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.blobs) {
                console.log(`📊 Loaded ${data.blobs.length} blobs`);
                this.rawBlobs = data.blobs;
                this.processBlobs(data.blobs);
                this.updateAllMetrics();
                this.updateCharts();
                    } else {
                console.log('📊 No blobs found or API error');
                this.updateAllMetrics(); // Update with zero values
            }
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this.updateAllMetrics(); // Show zeros on error
        }
    }
    
    processBlobs(blobs) {
        // Reset counters
        this.data = {
            hope: 0,
            sorrow: 0,
            transformative: 0,
            ambivalent: 0,
            reflective_neutral: 0
        };
        
        // Process activity history
        this.activityHistory = [];
        this.intensityData = [];
        this.confidenceData = [];
        
        blobs.forEach(blob => {
            // Count categories
            const category = blob.category || 'reflective_neutral';
            if (this.data.hasOwnProperty(category)) {
        this.data[category]++;
            }
            
            // Process for charts
            if (blob.created_at) {
                const date = new Date(blob.created_at);
                const hour = date.getHours();
                
                // Activity by hour
                const hourKey = `${hour}:00`;
                const existingHour = this.activityHistory.find(h => h.hour === hourKey);
                if (existingHour) {
                    existingHour.count++;
                } else {
                    this.activityHistory.push({ hour: hourKey, count: 1 });
                }
            }
            
            // Intensity and confidence data
            if (blob.intensity !== undefined) {
        this.intensityData.push({
                    value: blob.intensity,
                    category: blob.category
                });
            }
            
            if (blob.confidence !== undefined) {
                this.confidenceData.push({
                    value: blob.confidence,
                    category: blob.category
                });
            }
        });
        
        // Sort activity history by hour
        this.activityHistory.sort((a, b) => {
            const hourA = parseInt(a.hour.split(':')[0]);
            const hourB = parseInt(b.hour.split(':')[0]);
            return hourA - hourB;
        });
        
        console.log('📊 Processed blobs:', this.data);
        console.log('📊 Activity history:', this.activityHistory);
    }
    
    updateFromNewBlob(blobData) {
        // Add to raw blobs
        this.rawBlobs.push(blobData);
        
        // Update category count
        const category = blobData.category || 'reflective_neutral';
        if (this.data.hasOwnProperty(category)) {
            this.data[category]++;
        }
        
        // Update metrics and charts
        this.updateAllMetrics();
        this.updateCharts();
        
        // Add to live feed if tab is active
        this.addFeedItem(`New ${category.replace('_', ' ')} emotion captured`, 'blob', category);
    }
    
    updateAllMetrics() {
        const totalVoices = this.rawBlobs.length;
        
        // Update main counters
        this.updateElement('total-voices', totalVoices);
        this.updateElement('hope-count', this.data.hope);
        this.updateElement('sorrow-count', this.data.sorrow);
        this.updateElement('transformative-count', this.data.transformative);
        this.updateElement('ambivalent-count', this.data.ambivalent);
        this.updateElement('reflective-count', this.data.reflective_neutral);
        
        // Update detailed stats
        this.updateElement('total-sessions', totalVoices);
        this.updateElement('hope-details', this.data.hope);
        this.updateElement('sorrow-details', this.data.sorrow);
        this.updateElement('transformative-details', this.data.transformative);
        this.updateElement('ambivalent-details', this.data.ambivalent);
        this.updateElement('reflective-details', this.data.reflective_neutral);
        
        // Calculate derived metrics
        const avgConfidence = this.calculateAverageConfidence();
        const avgDuration = this.calculateAverageDuration();
        const emotionDiversity = Object.values(this.data).filter(count => count > 0).length;
        
        this.updateElement('avg-confidence', `${Math.round(avgConfidence * 100)}%`);
        this.updateElement('avg-duration', `${avgDuration}s`);
        this.updateElement('emotion-diversity', emotionDiversity);
        
        console.log('📊 Updated all metrics');
    }
    
    calculateAverageConfidence() {
        if (this.rawBlobs.length === 0) return 0;
        const total = this.rawBlobs.reduce((sum, blob) => sum + (blob.confidence || 0), 0);
        return total / this.rawBlobs.length;
    }
    
    calculateAverageDuration() {
        // Placeholder - would need duration data from recordings
        return Math.round(15 + Math.random() * 10); // Mock 15-25 seconds
    }
    
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            if (typeof anime !== 'undefined' && element.textContent !== value.toString()) {
                // Animate number changes
                const currentValue = parseInt(element.textContent) || 0;
                const newValue = typeof value === 'string' ? parseInt(value) || 0 : value;
                
                if (!isNaN(currentValue) && !isNaN(newValue)) {
                    anime({
                        targets: { value: currentValue },
                        value: newValue,
                        duration: 1000,
                        easing: 'easeOutCubic',
                        update: function(animation) {
                            const val = Math.round(animation.animatables[0].target.value);
                            element.textContent = typeof value === 'string' ? 
                                value.replace(/\d+/, val) : val;
                        }
                    });
                } else {
                    element.textContent = value;
                }
            } else {
                element.textContent = value;
            }
        }
    }
    
    initializeCharts() {
        console.log('📊 Initializing charts...');
        
        // Initialize emotion pie chart
        this.initializeEmotionChart();
        
        // Initialize daily activity chart
        this.initializeDailyChart();
        
        // Initialize growth chart
        this.initializeGrowthChart();
    }
    
    initializeEmotionChart() {
        const canvas = document.getElementById('emotion-pie-chart');
        if (!canvas) {
            console.warn('⚠️ Emotion pie chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        this.charts.emotionPie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Hope', 'Sorrow', 'Transformative', 'Ambivalent', 'Reflective'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 217, 61, 0.8)',   // Hope - warm yellow
                        'rgba(107, 115, 255, 0.8)',  // Sorrow - soft blue
                        'rgba(255, 149, 0, 0.8)',    // Transformative - orange
                        'rgba(204, 139, 219, 0.8)',  // Ambivalent - muted rose
                        'rgba(149, 165, 166, 0.8)'   // Reflective - gray
                    ],
                    borderColor: [
                        '#FFD93D',
                        '#6B73FF',
                        '#FF9500',
                        '#CC8BDB',
                        '#95A5A6'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Emotion pie chart initialized');
    }
    
    initializeDailyChart() {
        const canvas = document.getElementById('daily-activity-chart');
        if (!canvas) {
            console.warn('⚠️ Daily activity chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Generate hourly labels
        const hourLabels = [];
        for (let i = 0; i < 24; i++) {
            hourLabels.push(`${i}:00`);
        }
        
        this.charts.dailyActivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hourLabels,
                datasets: [{
                    label: 'Emotional Expressions',
                    data: new Array(24).fill(0),
                    borderColor: 'rgba(102, 204, 179, 1)',
                    backgroundColor: 'rgba(102, 204, 179, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
        
        console.log('✅ Daily activity chart initialized');
    }
    
    initializeGrowthChart() {
        const canvas = document.getElementById('growth-chart');
        if (!canvas) {
            console.warn('⚠️ Growth chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        this.charts.growth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'New Expressions',
                    data: [0, 0, 0, 0],
                    backgroundColor: 'rgba(102, 204, 179, 0.8)',
                    borderColor: 'rgba(102, 204, 179, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
        
        console.log('✅ Growth chart initialized');
    }
    
    updateCharts() {
        console.log('📊 Updating charts with new data');
        
        // Update emotion pie chart
        if (this.charts.emotionPie) {
            this.charts.emotionPie.data.datasets[0].data = [
            this.data.hope,
            this.data.sorrow,
            this.data.transformative,
            this.data.ambivalent,
            this.data.reflective_neutral
        ];
            this.charts.emotionPie.update();
        }
        
        // Update daily activity chart
        if (this.charts.dailyActivity) {
            const hourlyData = new Array(24).fill(0);
            
            this.activityHistory.forEach(entry => {
                const hour = parseInt(entry.hour.split(':')[0]);
                if (hour >= 0 && hour < 24) {
                    hourlyData[hour] = entry.count;
                }
            });
            
            this.charts.dailyActivity.data.datasets[0].data = hourlyData;
            this.charts.dailyActivity.update();
        }
        
        // Update growth chart (mock data for now)
        if (this.charts.growth) {
            const totalBlobs = this.rawBlobs.length;
            const mockWeeklyData = [
                Math.max(0, totalBlobs - 15),
                Math.max(0, totalBlobs - 10),
                Math.max(0, totalBlobs - 5),
                Math.max(0, totalBlobs)
            ];
            
            this.charts.growth.data.datasets[0].data = mockWeeklyData;
            this.charts.growth.update();
        }
    }
    
    addFeedItem(text, type = 'info', category = null) {
        const feedContainer = document.querySelector('.feed-container');
        if (!feedContainer) {
            console.warn('📊 Feed container not found');
            return;
        }
        
        const feedItem = document.createElement('div');
        feedItem.className = `feed-item ${type}`;
        
        let icon = '📊';
        if (type === 'blob') {
            const icons = {
                hope: '✨',
                sorrow: '💙',
                transformative: '🔥',
                ambivalent: '⚖️',
                reflective_neutral: '🤔'
            };
            icon = icons[category] || '💭';
        } else if (type === 'system') {
            icon = '🔄';
        } else if (type === 'error') {
            icon = '⚠️';
        }
        
        feedItem.innerHTML = `
            <div class="feed-icon">${icon}</div>
            <div class="feed-content">
                <div class="feed-text">${text}</div>
                <div class="feed-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        feedContainer.insertBefore(feedItem, feedContainer.firstChild);
        
        // Limit feed items
        const items = feedContainer.querySelectorAll('.feed-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
        
        // Animate new item
        if (typeof anime !== 'undefined') {
            anime({
                targets: feedItem,
                opacity: [0, 1],
                translateX: [-20, 0],
                duration: 300,
                easing: 'easeOutQuart'
            });
        }
    }
    
    resetAllStats() {
        this.data = {
            hope: 0,
            sorrow: 0,
            transformative: 0,
            ambivalent: 0,
            reflective_neutral: 0
        };
        this.rawBlobs = [];
        this.activityHistory = [];
        
        this.updateAllMetrics();
        this.updateCharts();
        this.addFeedItem('Statistics reset', 'system');
    }

    /**
     * Initialize tab switching functionality
     */
    initializeTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        if (tabBtns.length === 0 || tabPanels.length === 0) {
            console.warn('⚠️ Tab buttons or panels not found');
            return;
        }
        
        console.log('🎛️ Initializing', tabBtns.length, 'tabs');
        
        // Remove any existing listeners and add new ones
        tabBtns.forEach(btn => {
            // Clone button to remove old listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = newBtn.dataset.tab;
                console.log('🎯 Tab clicked:', targetTab);
                
                if (targetTab) {
                    this.switchTab(targetTab);
                }
            });
        });
        
        // Ensure default tab is active
        this.switchTab('overview');
    }
    
    /**
     * Switch to specific tab
     */
    switchTab(tabName) {
        console.log('🔄 Switching to tab:', tabName);
        
        // Update button states
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update panel visibility
        const tabPanels = document.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.id === tabName) {
                panel.classList.add('active');
                console.log('✅ Activated panel:', tabName);
            }
        });
        
        // Load content based on tab
        switch(tabName) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'emotions':
                this.loadEmotionDetails();
                break;
            case 'patterns':
                this.loadPatternData();
                break;
            case 'insights':
                this.loadLiveFeed();
                break;
        }
    }
    
    /**
     * Load overview data for the overview tab
     */
    loadOverviewData() {
        console.log('📊 Loading overview data');
        
        const metrics = {
            'total-sessions': this.stats.total_voices || 0,
            'avg-duration': '15s', // Placeholder
            'avg-confidence': Math.round((this.stats.avg_confidence || 0) * 100) + '%',
            'emotion-diversity': Object.keys(this.stats.emotions || {}).length
        };
        
        Object.entries(metrics).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateValue(element, 0, parseInt(value) || 0, 1000, 
                    value.toString().includes('%') ? '%' : (value.toString().includes('s') ? 's' : ''));
            }
        });
    }
    
    /**
     * Load detailed emotion data
     */
    loadEmotionDetails() {
        console.log('🎭 Loading emotion details');
        
        const detailsContainer = document.getElementById('emotions');
        if (!detailsContainer) return;
        
        const emotions = this.stats.emotions || {};
        const detailGrid = detailsContainer.querySelector('.detailed-grid');
        
        if (detailGrid) {
            detailGrid.innerHTML = Object.entries(emotions).map(([emotion, count]) => `
                <div class="detail-card ${emotion}">
                    <h4>${emotion.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                    <div class="detail-value">${count}</div>
                    <p>${this.getEmotionDescription(emotion)}</p>
                </div>
            `).join('');
        }
    }
    
    /**
     * Load pattern analysis data
     */
    loadPatternData() {
        console.log('📈 Loading pattern data');
        
        const patternsContainer = document.getElementById('patterns');
        if (!patternsContainer) return;
        
        // Generate some sample pattern data
        const patterns = [
            { name: 'Peak Activity', value: '2-4 PM', description: 'Most emotions shared during afternoon' },
            { name: 'Emotion Clusters', value: '3-5', description: 'Average emotions per session' },
            { name: 'Growth Trend', value: '+15%', description: 'Weekly increase in participation' },
            { name: 'Connection Rate', value: '87%', description: 'Emotions that resonate with others' }
        ];
        
        const detailGrid = patternsContainer.querySelector('.detailed-grid');
        if (detailGrid) {
            detailGrid.innerHTML = patterns.map(pattern => `
                <div class="detail-card">
                    <h4>${pattern.name}</h4>
                    <div class="detail-value">${pattern.value}</div>
                    <p>${pattern.description}</p>
                </div>
            `).join('');
        }
    }
    
    /**
     * Load live feed data
     */
    loadLiveFeed() {
        console.log('📡 Loading live feed');
        
        const feedContainer = document.getElementById('insights');
        if (!feedContainer) return;
        
        // Generate recent activity feed
        const recentEmotions = this.generateRecentFeed();
        
        let feedGrid = feedContainer.querySelector('.feed-grid');
        if (!feedGrid) {
            feedGrid = document.createElement('div');
            feedGrid.className = 'feed-grid';
            feedContainer.appendChild(feedGrid);
        }
        
        feedGrid.innerHTML = recentEmotions.map(item => `
            <div class="feed-item">
                <div class="feed-icon" style="background: ${this.getEmotionColor(item.emotion)};">
                    ${this.getEmotionIcon(item.emotion)}
                </div>
                <div class="feed-content">
                    <div class="feed-text">${item.text}</div>
                    <div class="feed-time">${item.time}</div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Generate recent feed data
     */
    generateRecentFeed() {
        const emotions = ['hope', 'sorrow', 'transformative', 'ambivalent', 'reflective_neutral'];
        const sampleTexts = {
            hope: ['Someone shared dreams of the future', 'A voice full of optimism emerged', 'Hope resonated through the words'],
            sorrow: ['A moment of deep reflection was shared', 'Gentle sadness touched the landscape', 'Someone found solace in expression'],
            transformative: ['A breakthrough moment was captured', 'Growth echoed through the cosmos', 'Change rippled across connections'],
            ambivalent: ['Complex feelings were expressed', 'Inner conflict found voice', 'Mixed emotions created harmony'],
            reflective_neutral: ['Thoughtful contemplation was shared', 'Quiet wisdom emerged', 'Peaceful reflection resonated']
        };
        
        return Array.from({length: 8}, (_, i) => {
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            const texts = sampleTexts[emotion];
            const text = texts[Math.floor(Math.random() * texts.length)];
            const minutesAgo = Math.floor(Math.random() * 60) + 1;
            
            return {
                emotion,
                text,
                time: `${minutesAgo} minutes ago`
            };
        });
    }
    
    /**
     * Get emotion description
     */
    getEmotionDescription(emotion) {
        const descriptions = {
            hope: 'Expressions of optimism, dreams, and aspirations that naturally rise and seek connection.',
            sorrow: 'Moments of sadness, loss, and melancholy that find comfort in deeper spaces.',
            transformative: 'Breakthrough experiences, growth, and change that bridge different emotional states.',
            ambivalent: 'Complex feelings of inner conflict and mixed emotions creating unique harmony.',
            reflective_neutral: 'Thoughtful contemplation, introspection, and peaceful moments of wisdom.'
        };
        return descriptions[emotion] || 'Unique emotional expressions contributing to our shared experience.';
    }
    
    /**
     * Get emotion icon
     */
    getEmotionIcon(emotion) {
        const icons = {
            hope: '✨',
            sorrow: '💙',
            transformative: '🔥',
            ambivalent: '⚖️',
            reflective_neutral: '🤔'
        };
        return icons[emotion] || '🌟';
    }
    
    /**
     * Get emotion color
     */
    getEmotionColor(emotion) {
        const colors = {
            hope: '#FFD93D',
            sorrow: '#6B73FF',
            transformative: '#FF9500',
            ambivalent: '#CC8BDB',
            reflective_neutral: '#95A5A6'
        };
        return colors[emotion] || '#95A5A6';
    }

    /**
     * Initialize the statistics manager
     */
    async initialize() {
        console.log('🚀 Initializing Statistics Manager');
        
        try {
            // Initialize WebSocket connection
            this.initializeSocket();
            
            // Initialize tab functionality
            this.initializeTabs();
            
            // Load initial data
            await this.loadInitialData();
            
            // Initialize charts after data is loaded
            setTimeout(() => {
                this.initializeCharts();
            }, 100);
            
            console.log('✅ Statistics Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing Statistics Manager:', error);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Initializing Stats Dashboard...');
    
    // Only initialize if we're on the stats page
    if (document.body.classList.contains('stats-page')) {
        window.statsDashboard = new StatsDashboard();
        console.log('✅ Stats Dashboard initialized');
    }
});

// Legacy function compatibility
function loadBasicStats() {
    if (window.statsDashboard) {
        window.statsDashboard.loadInitialData();
    }
} 