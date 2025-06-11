/**
 * Enhanced Hopes & Sorrows Web Application
 * Integrates with the new organic blob visualizer and provides comprehensive UI management
 */

class HopesAndSorrowsApp {
    constructor() {
        // Core components
        this.socket = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingTimer = null;
        this.recordingDuration = 44; // seconds
        this.currentTime = 0;
        
        // UI elements
        this.recordBtn = null;
        this.statusPanel = null;
        this.processingPanel = null;
        this.errorPanel = null;
        this.timer = null;
        this.timerProgress = null;
        this.timerText = null;
        this.instructionsPanel = null;
        this.blobInfoPanel = null;
        this.blobInfoToggle = null;
        this.analysisConfirmation = null;
        this.loadingOverlay = null;
        
        // Visualization
        this.visualizer = null;
        
        // State management
        this.isInitialized = false;
        this.lastAnalysisData = null;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        console.log('🚀 Initializing Hopes & Sorrows App');
        
        try {
            // Initialize UI elements
            this.initializeUIElements();
            
            // Initialize WebSocket connection
            await this.initializeWebSocket();
            
            // Initialize visualization
            this.initializeVisualizer();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load existing blobs
            await this.loadExistingBlobs();
            
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            // Show instructions on first visit
            this.showInstructions();
            
            this.isInitialized = true;
            console.log('✅ App initialization complete');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.hideLoadingOverlay();
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    initializeUIElements() {
        // Recording interface elements
        this.recordBtn = document.getElementById('record-button');
        this.statusPanel = document.getElementById('recording-status');
        this.processingPanel = document.getElementById('processing-status');
        this.errorPanel = document.getElementById('error-panel');
        this.timer = document.getElementById('timer');
        this.timerProgress = document.getElementById('timer-progress');
        this.timerText = document.getElementById('timer-seconds');
        
        // UI panels
        this.instructionsPanel = document.getElementById('instructions');
        this.blobInfoPanel = document.getElementById('blob-info');
        this.blobInfoToggle = document.getElementById('blob-info-toggle');
        this.analysisConfirmation = document.getElementById('analysis-confirmation');
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Validate required elements
        const requiredElements = [
            'recordBtn', 'statusPanel', 'processingPanel', 'errorPanel',
            'timer', 'timerProgress', 'timerText', 'instructionsPanel',
            'blobInfoPanel', 'blobInfoToggle', 'analysisConfirmation', 'loadingOverlay'
        ];
        
        for (const elementName of requiredElements) {
            if (!this[elementName]) {
                console.warn(`⚠️ UI element not found: ${elementName}`);
            }
        }
        
        console.log('🎨 UI elements initialized');
    }
    
    async initializeWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                // Initialize Socket.IO connection
                this.socket = io();
                
                this.socket.on('connect', () => {
                    console.log('🔌 WebSocket connected');
                    resolve();
                });
                
                this.socket.on('disconnect', () => {
                    console.log('🔌 WebSocket disconnected');
                });
                
                this.socket.on('connected', (data) => {
                    console.log('✅ Server connection confirmed:', data.message);
                });
                
                // Handle structured messages with type field
                this.socket.on('message', (data) => {
                    this.handleWebSocketMessage({ data: JSON.stringify(data) });
                });
                
                // Handle direct blob_added events from Flask
                this.socket.on('blob_added', (blobData) => {
                    console.log('🫧 Direct blob_added event:', blobData);
                    this.handleBlobAdded(blobData);
                });
                
                // Handle visualization cleared event
                this.socket.on('visualization_cleared', () => {
                    console.log('🧹 Visualization cleared');
                    if (this.visualizer) {
                        this.visualizer.clearAllBlobs();
                        this.updateBlobInfo();
                    }
                });
                
                this.socket.on('error', (error) => {
                    console.error('❌ WebSocket error:', error);
                    reject(error);
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    initializeVisualizer() {
        try {
            // Initialize the new emotion visualizer
            this.visualizer = new EmotionVisualizer();
            
            if (this.visualizer.initializeCanvas()) {
                console.log('🎨 Emotion visualizer initialized');
                
                // Make visualizer globally accessible for blob interactions
                window.emotionVisualizer = this.visualizer;
            } else {
                throw new Error('Failed to initialize visualization canvas');
            }
            
        } catch (error) {
            console.error('❌ Visualizer initialization failed:', error);
            this.showError('Visualization failed to load. Some features may not work properly.');
        }
    }
    
    setupEventListeners() {
        // Record button
        if (this.recordBtn) {
            this.recordBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from reaching canvas
                this.toggleRecording();
            });
        }
        
        // Instructions close button
        const instructionsClose = document.querySelector('.instructions-close');
        if (instructionsClose) {
            instructionsClose.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from reaching canvas
                this.hideInstructions();
            });
        }
        
        // Blob info toggle
        if (this.blobInfoToggle) {
            this.blobInfoToggle.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                this.toggleBlobInfo();
            });
        }
        
        // Blob info panel - prevent clicks from propagating to canvas
        if (this.blobInfoPanel) {
            this.blobInfoPanel.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent clicks from reaching the canvas
            });
        }
        
        // Recording interface - prevent clicks from propagating to canvas
        const recordingInterface = document.querySelector('.recording-interface');
        if (recordingInterface) {
            recordingInterface.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent clicks from reaching the canvas
            });
        }
        
        // Navigation bar - prevent clicks from propagating to canvas
        const navBar = document.querySelector('.nav-bar');
        if (navBar) {
            navBar.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent clicks from reaching the canvas
            });
        }
        
        // Analysis confirmation buttons
        const analysisViewBtn = document.getElementById('analysis-view-btn');
        const analysisContinueBtn = document.getElementById('analysis-continue-btn');
        
        if (analysisViewBtn) {
            analysisViewBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from reaching canvas
                this.hideAnalysisConfirmation();
                this.showBlobInfo();
            });
        }
        
        if (analysisContinueBtn) {
            analysisContinueBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from reaching canvas
                this.hideAnalysisConfirmation();
            });
        }
        
        // Error panel dismiss
        const errorDismiss = document.querySelector('.error-dismiss');
        if (errorDismiss) {
            errorDismiss.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from reaching canvas
                this.hideError();
            });
        }
        
        // Analysis confirmation panel - prevent clicks from propagating
        if (this.analysisConfirmation) {
            this.analysisConfirmation.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent clicks from reaching the canvas
            });
        }
        
        // Instructions panel - prevent clicks from propagating
        if (this.instructionsPanel) {
            this.instructionsPanel.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent clicks from reaching the canvas
            });
        }
        
        // WebSocket events
        if (this.socket) {
            this.socket.on('blob_added', (data) => this.handleBlobAdded(data));
            this.socket.on('analysis_complete', (data) => this.handleAnalysisComplete(data));
            this.socket.on('analysis_error', (data) => this.handleAnalysisError(data.message));
        }
        
        console.log('🎛️ Event listeners setup complete with proper event propagation control');
    }
    
    async loadExistingBlobs() {
        try {
            console.log('🔄 Loading existing blobs from database...');
            
            const response = await fetch('/api/get_all_blobs');
            if (!response.ok) {
                throw new Error(`Failed to fetch blobs: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 Blob data received:', data);
            
            if (data.blobs && Array.isArray(data.blobs)) {
                console.log(`🫧 Found ${data.blobs.length} existing blobs to load`);
                
                // Clear any existing blobs first
                if (this.visualizer) {
                    this.visualizer.clearAllBlobs();
                }
                
                // Add blobs with staggered timing for better visual effect
                data.blobs.forEach((blob, index) => {
                    setTimeout(() => {
                        if (this.visualizer) {
                            console.log(`🎨 Adding blob ${index + 1}/${data.blobs.length}:`, blob.category);
                            this.visualizer.addBlob(blob);
                            
                            // Update blob info after each addition
                            this.updateBlobInfo();
                        }
                    }, index * 100); // 100ms delay between each blob
                });
                
                // Final update after all blobs are loaded
                setTimeout(() => {
                    this.updateBlobInfo();
                    console.log(`✅ Successfully loaded ${data.blobs.length} blobs`);
                }, data.blobs.length * 100 + 500);
                
            } else {
                console.log('📭 No existing blobs found');
                this.updateBlobInfo(); // Update with zero count
            }
            
        } catch (error) {
            console.error('❌ Failed to load existing blobs:', error);
            // Still update blob info to show zero count
            this.updateBlobInfo();
        }
    }
    
    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message:', data);
            
            switch (data.type) {
                case 'analysis_complete':
                    this.handleAnalysisComplete(data);
                    break;
                    
                case 'analysis_progress':
                    this.updateProcessingStatus(data.message || 'Processing...');
                    break;
                    
                case 'error':
                    this.handleAnalysisError(data.message);
                    break;
                    
                case 'blob_added':
                    this.handleBlobAdded(data.blob);
                    break;
                    
                default:
                    console.log('🔍 Unknown message type:', data.type);
            }
            
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
        }
    }
    
    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }
    
    async startRecording() {
        if (this.isRecording) return;
        
        try {
            console.log('🎤 Starting recording...');
            
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            // Initialize MediaRecorder
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.audioChunks = [];
            this.isRecording = true;
            this.currentTime = 0;
            
            // Set up MediaRecorder events
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
                stream.getTracks().forEach(track => track.stop());
            };
            
            // Start recording
            this.mediaRecorder.start();
            
            // Update UI
            this.updateRecordingUI();
            this.startTimer();
            
            console.log('✅ Recording started');
            
        } catch (error) {
            console.error('❌ Recording failed:', error);
            this.showError('Failed to access microphone. Please check permissions.');
            this.resetRecordingState();
        }
    }
    
    async stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        console.log('⏹️ Stopping recording...');
        
        this.isRecording = false;
        this.mediaRecorder.stop();
        this.stopTimer();
        
        console.log('✅ Recording stopped');
    }
    
    updateRecordingUI() {
        if (!this.recordBtn || !this.statusPanel || !this.timer) return;
        
        if (this.isRecording) {
            // Recording state
            this.recordBtn.classList.add('recording');
            this.recordBtn.innerHTML = `
                <div class="record-icon">
                    <div class="record-circle"></div>
                </div>
            `;
            
            // Update status text
            const statusText = this.statusPanel.querySelector('.status-text');
            const statusSubtitle = this.statusPanel.querySelector('.status-subtitle');
            
            if (statusText) statusText.textContent = 'Recording...';
            if (statusSubtitle) statusSubtitle.textContent = 'Share your hopes and sorrows';
            
            this.timer.classList.add('visible');
            
        } else {
            // Ready state
            this.recordBtn.classList.remove('recording');
            this.recordBtn.innerHTML = `
                <div class="record-icon">
                    <div class="record-circle"></div>
                </div>
            `;
            
            // Update status text
            const statusText = this.statusPanel.querySelector('.status-text');
            const statusSubtitle = this.statusPanel.querySelector('.status-subtitle');
            
            if (statusText) statusText.textContent = 'Ready to Record';
            if (statusSubtitle) statusSubtitle.textContent = 'Click to share your emotional journey';
            
            this.timer.classList.remove('visible');
        }
    }
    
    startTimer() {
        if (!this.timerProgress || !this.timerText) return;
        
        this.currentTime = 0;
        const circumference = 2 * Math.PI * 45; // radius = 45
        
        this.recordingTimer = setInterval(() => {
            this.currentTime++;
            const remaining = this.recordingDuration - this.currentTime;
            
            // Update timer text
            this.timerText.textContent = remaining.toString();
            
            // Update progress circle
            const progress = this.currentTime / this.recordingDuration;
            const offset = circumference * (1 - progress);
            this.timerProgress.style.strokeDashoffset = offset;
            
            // Auto-stop when time is up
            if (remaining <= 0) {
                this.stopRecording();
            }
            
        }, 1000);
    }
    
    stopTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        // Reset timer display
        if (this.timerText) {
            this.timerText.textContent = this.recordingDuration.toString();
        }
        
        if (this.timerProgress) {
            this.timerProgress.style.strokeDashoffset = '283';
        }
    }
    
    async processRecording() {
        if (this.audioChunks.length === 0) {
            this.showError('No audio data recorded. Please try again.');
            this.resetRecordingState();
            return;
        }
        
        try {
            console.log('🔄 Processing recording...');
            
            // Show processing UI
            this.showProcessingStatus('Analyzing your voice...');
            
            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Create form data
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            // Send to server
            const response = await fetch('/upload_audio', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            console.log('✅ Audio uploaded successfully');
            
        } catch (error) {
            console.error('❌ Processing failed:', error);
            this.handleAnalysisError('Failed to process recording. Please try again.');
        }
    }
    
    handleAnalysisComplete(data) {
        console.log('🎉 Analysis complete:', data);
        
        this.lastAnalysisData = data;
        
        // Hide processing status
        this.hideProcessingStatus();
        
        // Add blobs to visualization
        if (data.blobs && Array.isArray(data.blobs)) {
            data.blobs.forEach((blob, index) => {
                setTimeout(() => {
                    if (this.visualizer) {
                        this.visualizer.addBlob(blob);
                    }
                }, index * 300); // Staggered addition
            });
        }
        
        // Show analysis confirmation
        setTimeout(() => {
            this.showAnalysisConfirmation(data);
            this.updateBlobInfo();
        }, data.blobs ? data.blobs.length * 300 + 500 : 1000);
        
        // Reset recording state
        this.resetRecordingState();
    }
    
    handleAnalysisError(message) {
        console.error('❌ Analysis error:', message);
        
        this.hideProcessingStatus();
        this.showError(message || 'Analysis failed. Please try again.');
        this.resetRecordingState();
    }
    
    handleBlobAdded(blob) {
        console.log('🫧 New blob added:', blob);
        
        if (this.visualizer) {
            this.visualizer.addBlob(blob);
        }
        
        this.updateBlobInfo();
    }
    
    showProcessingStatus(message = 'Processing...') {
        if (!this.statusPanel || !this.processingPanel) return;
        
        this.statusPanel.classList.add('hidden');
        this.processingPanel.classList.add('visible');
        
        const processingText = this.processingPanel.querySelector('.processing-text');
        const processingSubtitle = this.processingPanel.querySelector('.processing-subtitle');
        
        if (processingText) {
            processingText.textContent = message;
        }
        
        if (processingSubtitle) {
            processingSubtitle.textContent = 'Analyzing emotional content with AI...';
        }
    }
    
    hideProcessingStatus() {
        if (!this.statusPanel || !this.processingPanel) return;
        
        this.processingPanel.classList.remove('visible');
        this.statusPanel.classList.remove('hidden');
    }
    
    updateProcessingStatus(message) {
        const processingText = this.processingPanel?.querySelector('.processing-text');
        if (processingText) {
            processingText.textContent = message;
        }
    }
    
    showError(message) {
        if (!this.errorPanel) return;
        
        const errorText = this.errorPanel.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        }
        
        this.errorPanel.classList.add('visible');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    hideError() {
        if (this.errorPanel) {
            this.errorPanel.classList.remove('visible');
        }
    }
    
    resetRecordingState() {
        this.isRecording = false;
        this.audioChunks = [];
        this.currentTime = 0;
        
        if (this.mediaRecorder) {
            this.mediaRecorder = null;
        }
        
        this.stopTimer();
        this.updateRecordingUI();
    }
    
    showInstructions() {
        if (this.instructionsPanel) {
            this.instructionsPanel.classList.remove('hidden');
        }
    }
    
    hideInstructions() {
        if (this.instructionsPanel) {
            this.instructionsPanel.classList.add('hidden');
        }
    }
    
    toggleBlobInfo() {
        if (!this.blobInfoPanel || !this.blobInfoToggle) return;
        
        const isActive = this.blobInfoPanel.classList.contains('active');
        
        if (isActive) {
            this.hideBlobInfo();
        } else {
            this.showBlobInfo();
        }
    }
    
    showBlobInfo() {
        if (this.blobInfoPanel && this.blobInfoToggle) {
            this.blobInfoPanel.classList.add('active');
            this.blobInfoToggle.classList.add('active');
            this.updateBlobInfo();
        }
    }
    
    hideBlobInfo() {
        if (this.blobInfoPanel && this.blobInfoToggle) {
            this.blobInfoPanel.classList.remove('active');
            this.blobInfoToggle.classList.remove('active');
        }
    }
    
    updateBlobInfo() {
        if (!this.visualizer) return;
        
        const blobCount = this.visualizer.getBlobCount();
        const categoryCounts = this.visualizer.getCategoryCounts();
        
        // Update blob counter
        const blobCounter = document.getElementById('blob-counter');
        if (blobCounter) {
            blobCounter.textContent = blobCount.toString();
        }
        
        // Update category counts
        Object.entries(categoryCounts).forEach(([category, count]) => {
            const countElement = document.getElementById(`${category.replace('_', '-')}-count`);
            if (countElement) {
                countElement.textContent = count.toString();
            }
        });
        
        console.log('📊 Blob info updated:', { total: blobCount, categories: categoryCounts });
    }
    
    showAnalysisConfirmation(data) {
        if (!this.analysisConfirmation) return;
        
        // Update statistics
        const utterancesElement = document.getElementById('analysis-utterances');
        const emotionsElement = document.getElementById('analysis-emotions');
        const confidenceElement = document.getElementById('analysis-confidence');
        
        if (utterancesElement) {
            utterancesElement.textContent = data.utterances || '1';
        }
        
        if (emotionsElement) {
            emotionsElement.textContent = data.blobs ? data.blobs.length.toString() : '1';
        }
        
        if (confidenceElement) {
            const avgConfidence = data.blobs ? 
                Math.round(data.blobs.reduce((sum, blob) => sum + (blob.confidence || 0.5), 0) / data.blobs.length * 100) : 
                75;
            confidenceElement.textContent = `${avgConfidence}%`;
        }
        
        // Update emotion list
        const emotionList = document.getElementById('analysis-emotion-list');
        if (emotionList && data.blobs) {
            emotionList.innerHTML = '';
            
            const uniqueCategories = [...new Set(data.blobs.map(blob => blob.category))];
            uniqueCategories.forEach(category => {
                const emotionTag = document.createElement('div');
                emotionTag.className = 'analysis-emotion';
                emotionTag.innerHTML = `
                    <div class="analysis-emotion-dot" style="background-color: var(--${category.replace('_', '-')}-primary)"></div>
                    <span>${category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                `;
                emotionList.appendChild(emotionTag);
            });
        }
        
        // Show the panel with enhanced messaging
        this.analysisConfirmation.classList.add('visible');
        
        // Update confirmation title
        const confirmationTitle = this.analysisConfirmation.querySelector('h3');
        if (confirmationTitle) {
            confirmationTitle.textContent = '✨ Analysis Complete!';
        }
        
        // Add success message
        const summaryElement = this.analysisConfirmation.querySelector('.analysis-summary');
        if (summaryElement) {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = 'margin-bottom: 16px; padding: 12px; background: rgba(255, 215, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.2);';
            messageDiv.innerHTML = `
                <div style="font-weight: 600; color: #FFD700; margin-bottom: 4px;">🎉 Your emotions have been captured!</div>
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.8);">
                    Your emotional journey has been analyzed and added to the visualization. 
                    ${data.blobs ? `${data.blobs.length} new emotion${data.blobs.length > 1 ? 's' : ''} detected.` : 'New emotions detected.'}
                </div>
            `;
            summaryElement.insertBefore(messageDiv, summaryElement.firstChild);
        }
    }
    
    hideAnalysisConfirmation() {
        if (this.analysisConfirmation) {
            this.analysisConfirmation.classList.remove('visible');
        }
    }
    
    hideLoadingOverlay() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
            console.log('🎭 Loading overlay hidden');
        }
    }
    
    showLoadingOverlay() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
            console.log('🎭 Loading overlay shown');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, initializing Hopes & Sorrows App');
    window.app = new HopesAndSorrowsApp();
});

// Make app globally accessible
window.HopesAndSorrowsApp = HopesAndSorrowsApp; 