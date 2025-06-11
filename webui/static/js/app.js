/**
 * Hopes & Sorrows - Main Application Controller
 * Enhanced with GLSL-based emotion visualization
 */

class HopesSorrowsApp {
    constructor() {
        // Core properties
        this.socket = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.maxRecordingTime = 44000; // 44 seconds
        this.sessionId = this.generateSessionId();
        
        // UI Elements
        this.elements = {};
        
        // Enhanced Emotion Visualizer (GLSL-based)
        this.emotionVisualizer = null;
        
        // Blob management
        this.currentTooltip = null;
        this.tooltipTimer = null;
        
        // Status management
        this.currentStatus = 'ready';
        this.statusMessages = {
            ready: {
                main: 'Ready to Record',
                sub: 'Click to share your emotional journey'
            },
            recording: {
                main: 'Recording...',
                sub: 'Share your hopes and sorrows'
            },
            processing: {
                main: 'Analyzing...',
                sub: 'Understanding your emotions'
            },
            complete: {
                main: '✨ Analysis Complete!',
                sub: '🎉 Your emotions have been captured!'
            },
            error: {
                main: 'Something went wrong',
                sub: 'Please try again'
            }
        };
        
        // Initialize the application
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing Hopes & Sorrows App with GLSL Enhancement...');
        
        try {
            // Show loading overlay
            this.showLoadingOverlay();
            
            // Initialize UI elements
            this.initializeElements();
            
            // Initialize WebSocket connection
            await this.initializeSocket();
            
            // Initialize GLSL-Enhanced Emotion Visualizer
            await this.initializeVisualizer();
            
            // Load existing blobs
            await this.loadExistingBlobs();
            
            // Initialize recording functionality
            this.initializeRecording();
            
            // Initialize UI interactions
            this.initializeUI();
            
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            console.log('✅ App initialization complete!');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.hideLoadingOverlay();
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    /**
     * Initialize UI elements
     */
    initializeElements() {
        console.log('🎯 Initializing UI elements...');
        
        // Core elements
        this.elements = {
            // Visualization
            visualizationContainer: document.getElementById('visualization-container'),
            glslCanvas: document.getElementById('glsl-canvas'),
            p5Container: document.getElementById('p5-container'),
            
            // Recording interface
            recordBtn: document.getElementById('record-button'),
            statusText: document.querySelector('.status-text'),
            statusSubtitle: document.querySelector('.status-subtitle'),
            timer: document.querySelector('.timer'),
            timerText: document.querySelector('#timer-seconds'),
            timerProgress: document.querySelector('#timer-progress'),
            
            // Panels
            processingPanel: document.querySelector('.processing-panel'),
            errorPanel: document.querySelector('.error-panel'),
            blobInfoPanel: document.querySelector('.blob-info-panel'),
            blobInfoToggle: document.querySelector('.blob-info-toggle'),
            analysisConfirmation: document.querySelector('.analysis-confirmation'),
            
            // Loading
            loadingOverlay: document.querySelector('.loading-overlay'),
            
            // Stats
            blobCount: document.querySelector('#blob-counter'),
            categoryStats: document.querySelectorAll('.category-stat .category-count')
        };
        
        // Validate required elements
        const requiredElements = [
            'visualizationContainer', 'recordBtn', 'statusText', 
            'loadingOverlay', 'blobInfoPanel'
        ];
        
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                throw new Error(`Required element not found: ${elementName}`);
            }
        }
        
        console.log('✅ UI elements initialized');
    }
    
    /**
     * Initialize WebSocket connection
     */
    async initializeSocket() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Initializing WebSocket connection...');
            
            try {
                this.socket = io();
                
                this.socket.on('connect', () => {
                    console.log('✅ WebSocket connected');
                    resolve();
                });
                
                this.socket.on('disconnect', () => {
                    console.log('🔌 WebSocket disconnected');
                });
                
                this.socket.on('analysis_complete', (data) => {
                    console.log('📊 Analysis complete:', data);
                    this.handleAnalysisComplete(data);
                });
                
                this.socket.on('error', (error) => {
                    console.error('❌ WebSocket error:', error);
                    reject(error);
                });
                
                // Set timeout for connection
                setTimeout(() => {
                    if (!this.socket.connected) {
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 5000);
                
            } catch (error) {
                console.error('❌ WebSocket initialization failed:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Initialize GLSL-Enhanced Emotion Visualizer
     */
    async initializeVisualizer() {
        console.log('🎨 Initializing GLSL-Enhanced Emotion Visualizer...');
        
        try {
            // Check if EmotionVisualizer class is available
            if (typeof EmotionVisualizer === 'undefined') {
                throw new Error('EmotionVisualizer class not found');
            }
            
            // Initialize the visualizer
            this.emotionVisualizer = new EmotionVisualizer();
            
            // Initialize with container
            await this.emotionVisualizer.init(this.elements.visualizationContainer);
            
            console.log('✅ GLSL-Enhanced Emotion Visualizer initialized');
            
        } catch (error) {
            console.error('❌ Visualizer initialization failed:', error);
            
            // Show fallback message
            this.showWebGLFallback();
            throw error;
        }
    }
    
    /**
     * Load existing blobs from the database
     */
    async loadExistingBlobs() {
        console.log('📊 Loading existing emotion blobs...');
        
        try {
            const response = await fetch('/api/get_all_blobs');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.blobs) {
                console.log(`📊 Found ${data.blobs.length} existing blobs`);
                
                // Add blobs to visualizer with staggered timing
                data.blobs.forEach((blobData, index) => {
                    setTimeout(() => {
                        this.emotionVisualizer.addBlob(blobData);
                    }, index * 100); // 100ms delay between each blob
                });
                
                // Update stats
                this.updateBlobStats(data.blobs);
                
                console.log('✅ Existing blobs loaded successfully');
            } else {
                console.log('📊 No existing blobs found');
            }
            
        } catch (error) {
            console.error('❌ Failed to load existing blobs:', error);
            // Don't throw - app can still function without existing blobs
        }
    }
    
    /**
     * Initialize recording functionality
     */
    initializeRecording() {
        console.log('🎤 Initializing recording functionality...');
        
        if (!this.elements.recordBtn) {
            console.error('❌ Record button not found');
            return;
        }
        
        this.elements.recordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });
        
        console.log('✅ Recording functionality initialized');
    }
    
    /**
     * Initialize UI interactions
     */
    initializeUI() {
        console.log('🎯 Initializing UI interactions...');
        
        // Blob info toggle
        if (this.elements.blobInfoToggle) {
            this.elements.blobInfoToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleBlobInfo();
            });
        }
        
        // Prevent blob info panel clicks from reaching canvas
        if (this.elements.blobInfoPanel) {
            this.elements.blobInfoPanel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Error panel dismiss
        const errorDismiss = document.querySelector('.error-dismiss');
        if (errorDismiss) {
            errorDismiss.addEventListener('click', () => {
                this.hideError();
            });
        }
        
        // Analysis confirmation actions
        const analysisActions = document.querySelectorAll('.analysis-btn');
        analysisActions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.classList.contains('primary')) {
                    this.hideAnalysisConfirmation();
                } else {
                    this.hideAnalysisConfirmation();
                }
            });
        });
        
        // Instructions panel close button
        const instructionsClose = document.querySelector('.instructions-close');
        if (instructionsClose) {
            instructionsClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideInstructions();
            });
        }
        
        // Blob info panel close button
        const blobInfoClose = document.querySelector('.blob-info-close');
        if (blobInfoClose) {
            blobInfoClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleBlobInfo(); // This will close it if it's open
            });
        }
        
        console.log('✅ UI interactions initialized');
    }
    
    /**
     * Start audio recording
     */
    async startRecording() {
        console.log('🎤 Starting recording...');
        
        try {
            // Request microphone access
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
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Update UI
            this.updateRecordingUI(true);
            this.startRecordingTimer();
            
            // Add visual feedback to visualizer
            if (this.emotionVisualizer && this.emotionVisualizer.startRecording) {
                this.emotionVisualizer.startRecording();
            }
            
            console.log('✅ Recording started');
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            this.showError('Failed to access microphone. Please check permissions.');
        }
    }
    
    /**
     * Stop audio recording
     */
    stopRecording() {
        console.log('🛑 Stopping recording...');
        
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop all tracks
            if (this.mediaRecorder.stream) {
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
            
            // Update UI
            this.updateRecordingUI(false);
            this.stopRecordingTimer();
            
            // Add visual feedback to visualizer
            if (this.emotionVisualizer && this.emotionVisualizer.stopRecording) {
                this.emotionVisualizer.stopRecording();
            }
            
            console.log('✅ Recording stopped');
        }
    }
    
    /**
     * Process the recorded audio
     */
    async processRecording() {
        console.log('⚙️ Processing recording...');
        
        try {
            // Show processing state
            this.updateStatus('processing');
            this.showProcessingPanel();
            
            // Create audio blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Create form data
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('session_id', this.sessionId);
            
            // Upload and process
            const response = await fetch('/upload_audio', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Recording processed successfully');
                
                // Handle analysis completion directly
                this.handleAnalysisComplete({
                    blobs: result.blobs,
                    processing_summary: result.processing_summary,
                    session_id: result.session_id
                });
                
            } else {
                throw new Error(result.error || 'Processing failed');
            }
            
        } catch (error) {
            console.error('❌ Failed to process recording:', error);
            this.hideProcessingPanel();
            this.updateStatus('error');
            this.showError('Failed to process recording. Please try again.');
        }
    }
    
    /**
     * Handle analysis completion
     */
    handleAnalysisComplete(data) {
        console.log('🎉 Handling analysis completion:', data);
        
        try {
            // Hide processing panel
            this.hideProcessingPanel();
            
            // Update status
            this.updateStatus('complete');
            
            // Add new blob to visualizer
            if (data.blobs && this.emotionVisualizer) {
                data.blobs.forEach(blob => {
                    this.emotionVisualizer.addBlob(blob);
                });
                
                // Update stats
                this.updateBlobStats(data.blobs);
            }
            
            // Show analysis confirmation
            this.showAnalysisConfirmation(data);
            
            // Reset to ready state after delay
            setTimeout(() => {
                this.updateStatus('ready');
            }, 3000);
            
            console.log('✅ Analysis completion handled');
            
        } catch (error) {
            console.error('❌ Failed to handle analysis completion:', error);
            this.showError('Analysis completed but display failed.');
        }
    }
    
    /**
     * Update recording UI state
     */
    updateRecordingUI(isRecording) {
        if (!this.elements.recordBtn) return;
        
        if (isRecording) {
            this.elements.recordBtn.classList.add('recording');
            this.updateStatus('recording');
        } else {
            this.elements.recordBtn.classList.remove('recording');
        }
    }
    
    /**
     * Start recording timer
     */
    startRecordingTimer() {
        if (!this.elements.timer || !this.elements.timerText || !this.elements.timerProgress) {
            return;
        }
        
        this.elements.timer.classList.add('visible');
        
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const remaining = Math.max(0, this.maxRecordingTime - elapsed);
            const progress = (elapsed / this.maxRecordingTime) * 100;
            
            // Update timer display
            const seconds = Math.ceil(remaining / 1000);
            this.elements.timerText.textContent = seconds;
            
            // Update progress circle
            if (this.elements.timerProgress) {
                const circumference = 2 * Math.PI * 45; // radius = 45
                const offset = circumference - (progress / 100) * circumference;
                this.elements.timerProgress.style.strokeDashoffset = offset;
            }
            
            // Auto-stop when time is up
            if (remaining <= 0) {
                this.stopRecording();
            }
        }, 100);
    }
    
    /**
     * Stop recording timer
     */
    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        
        if (this.elements.timer) {
            this.elements.timer.classList.remove('visible');
        }
    }
    
    /**
     * Update status display
     */
    updateStatus(status) {
        this.currentStatus = status;
        const statusData = this.statusMessages[status];
        
        if (statusData && this.elements.statusText) {
            this.elements.statusText.textContent = statusData.main;
            
            if (this.elements.statusSubtitle) {
                this.elements.statusSubtitle.textContent = statusData.sub;
            }
        }
    }
    
    /**
     * Show/hide loading overlay
     */
    showLoadingOverlay() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('hidden');
        }
    }
    
    hideLoadingOverlay() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Show/hide processing panel
     */
    showProcessingPanel() {
        if (this.elements.processingPanel) {
            this.elements.processingPanel.classList.add('visible');
        }
    }
    
    hideProcessingPanel() {
        if (this.elements.processingPanel) {
            this.elements.processingPanel.classList.remove('visible');
        }
    }
    
    /**
     * Show/hide error panel
     */
    showError(message) {
        if (this.elements.errorPanel) {
            const errorText = this.elements.errorPanel.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            }
            this.elements.errorPanel.classList.add('visible');
        }
    }
    
    hideError() {
        if (this.elements.errorPanel) {
            this.elements.errorPanel.classList.remove('visible');
        }
    }
    
    /**
     * Show/hide analysis confirmation
     */
    showAnalysisConfirmation(data) {
        if (this.elements.analysisConfirmation) {
            // Update confirmation content if needed
            this.elements.analysisConfirmation.classList.add('visible');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideAnalysisConfirmation();
            }, 5000);
        }
    }
    
    hideAnalysisConfirmation() {
        if (this.elements.analysisConfirmation) {
            this.elements.analysisConfirmation.classList.remove('visible');
        }
    }
    
    /**
     * Hide instructions panel
     */
    hideInstructions() {
        const instructionsPanel = document.querySelector('.instructions-panel');
        if (instructionsPanel) {
            instructionsPanel.classList.add('hidden');
        }
    }
    
    /**
     * Toggle blob info panel
     */
    toggleBlobInfo() {
        if (this.elements.blobInfoPanel && this.elements.blobInfoToggle) {
            const isActive = this.elements.blobInfoPanel.classList.contains('active');
            
            if (isActive) {
                this.elements.blobInfoPanel.classList.remove('active');
                this.elements.blobInfoToggle.classList.remove('active');
            } else {
                this.elements.blobInfoPanel.classList.add('active');
                this.elements.blobInfoToggle.classList.add('active');
            }
        }
    }
    
    /**
     * Update blob statistics
     */
    updateBlobStats(blobs) {
        // Update total count
        if (this.elements.blobCount) {
            this.elements.blobCount.textContent = blobs.length;
        }
        
        // Update category counts - handle both uppercase and lowercase
        const categoryCounts = {
            hope: 0,
            sorrow: 0,
            transformative: 0,
            ambivalent: 0,
            reflective_neutral: 0
        };
        
        blobs.forEach(blob => {
            const category = blob.category ? blob.category.toLowerCase() : '';
            if (categoryCounts.hasOwnProperty(category)) {
                categoryCounts[category]++;
            }
        });
        
        // Update category stat displays by ID
        const categoryElements = {
            hope: document.getElementById('hope-count'),
            sorrow: document.getElementById('sorrow-count'),
            transformative: document.getElementById('transformative-count'),
            ambivalent: document.getElementById('ambivalent-count'),
            reflective_neutral: document.getElementById('reflective-count')
        };
        
        Object.keys(categoryCounts).forEach(category => {
            const element = categoryElements[category];
            if (element) {
                element.textContent = categoryCounts[category];
            }
        });
        
        console.log('📊 Updated blob stats:', categoryCounts);
    }
    
    /**
     * Show WebGL fallback message
     */
    showWebGLFallback() {
        const fallbackHTML = `
            <div class="webgl-fallback">
                <h3>WebGL Not Available</h3>
                <p>Your browser doesn't support WebGL or it's disabled.</p>
                <p>The visualization will use a simplified version.</p>
            </div>
        `;
        
        if (this.elements.visualizationContainer) {
            this.elements.visualizationContainer.innerHTML = fallbackHTML;
        }
    }
    
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Check if click is on UI element
     */
    isClickOnUIElement(event) {
        const uiSelectors = [
            '.recording-interface',
            '.blob-info-panel',
            '.blob-info-toggle',
            '.processing-panel',
            '.error-panel',
            '.analysis-confirmation',
            '.nav-bar'
        ];
        
        return uiSelectors.some(selector => {
            const element = document.querySelector(selector);
            return element && element.contains(event.target);
        });
    }
    
    /**
     * Update blob count (for single additions)
     */
    async updateBlobCount() {
        try {
            const response = await fetch('/api/get_all_blobs');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.blobs) {
                    this.updateBlobStats(data.blobs);
                }
            }
        } catch (error) {
            console.error('❌ Failed to update blob count:', error);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, initializing Hopes & Sorrows App...');
    window.hopesSorrowsApp = new HopesSorrowsApp();
});

// Export for global access
window.HopesSorrowsApp = HopesSorrowsApp; 