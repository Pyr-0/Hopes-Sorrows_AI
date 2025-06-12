/**
 * Hopes & Sorrows - Main Application Controller
 * Enhanced with GLSL-based emotion visualization and improved controls
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
        console.log('🚀 Initializing Hopes & Sorrows App with Enhanced GLSL Visualization...');
        
        try {
            // Show loading overlay
            this.showLoadingOverlay();
            
            // Initialize UI elements
            this.initializeElements();
            
            // Initialize WebSocket connection
            await this.initializeSocket();
            
            // Initialize Enhanced GLSL Emotion Visualizer
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
            blobInfoPanel: document.getElementById('blob-info-panel'),
            blobInfoToggle: document.getElementById('blob-info-toggle'),
            analysisConfirmation: document.querySelector('.analysis-confirmation'),
            
            // Loading
            loadingOverlay: document.getElementById('loading-overlay'),
            
            // Stats
            blobCount: document.querySelector('#blob-counter'),
            categoryStats: document.querySelectorAll('.category-stat .category-count')
        };
        
        // Validate required elements and provide helpful error messages
        const requiredElements = [
            { key: 'visualizationContainer', selector: '#visualization-container' },
            { key: 'recordBtn', selector: '#record-button' },
            { key: 'loadingOverlay', selector: '#loading-overlay' },
            { key: 'blobInfoPanel', selector: '#blob-info-panel' }
        ];
        
        const missingElements = [];
        for (const element of requiredElements) {
            if (!this.elements[element.key]) {
                missingElements.push(`${element.key} (${element.selector})`);
            }
        }
        
        if (missingElements.length > 0) {
            const errorMsg = `Required elements not found: ${missingElements.join(', ')}`;
            console.error('❌', errorMsg);
            
            // Show user-friendly error
            this.showUserError('Application failed to load properly. Please refresh the page.');
            throw new Error(errorMsg);
        }
        
        // Log found elements for debugging
        const foundElements = Object.keys(this.elements).filter(key => this.elements[key]);
        console.log('✅ UI elements initialized:', foundElements.length, 'elements found');
        
        // Log missing optional elements
        const optionalMissing = Object.keys(this.elements).filter(key => !this.elements[key]);
        if (optionalMissing.length > 0) {
            console.warn('⚠️ Optional elements missing:', optionalMissing);
        }
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
                
                this.socket.on('blob_added', (data) => {
                    console.log('📊 New blob received:', data);
                    if (this.emotionVisualizer) {
                        this.emotionVisualizer.addBlob(data);
                        this.updateBlobStats();
                    }
                });
                
                this.socket.on('visualization_cleared', () => {
                    console.log('🧹 Visualization cleared');
                    if (this.emotionVisualizer) {
                        this.emotionVisualizer.clearAllBlobs();
                        this.updateBlobStats();
                    }
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
     * Initialize Enhanced GLSL Emotion Visualizer
     */
    async initializeVisualizer() {
        console.log('🎨 Initializing Enhanced GLSL Emotion Visualizer...');
        
        try {
            // Check if IntegratedEmotionVisualizer class is available
            if (typeof IntegratedEmotionVisualizer === 'undefined') {
                throw new Error('IntegratedEmotionVisualizer class not found');
            }
            
            // Initialize the visualizer
            this.emotionVisualizer = new IntegratedEmotionVisualizer();
            
            // Initialize with container
            await this.emotionVisualizer.init(this.elements.visualizationContainer);
            
            // Set up event handlers for visualizer
            this.setupVisualizerEventHandlers();
            
            console.log('✅ Enhanced GLSL Emotion Visualizer initialized');
            
        } catch (error) {
            console.error('❌ Visualizer initialization failed:', error);
            this.showWebGLFallback();
            throw error;
        }
    }
    
    /**
     * Setup event handlers for visualizer interactions
     */
    setupVisualizerEventHandlers() {
        // Store reference to app instance for visualizer callbacks
        window.app = this;
        
        // Handle visualization mode changes
        this.onVisualizationModeChanged = (mode, modeInfo) => {
            console.log(`🎨 Visualization mode changed to: ${modeInfo.name}`);
            // You can add UI updates here if needed
        };
        
        // Handle category visibility changes
        this.onCategoryToggled = (category, visible) => {
            console.log(`🎨 Category ${category} visibility: ${visible}`);
            this.updateBlobStats();
        };
    }
    
    /**
     * Load existing blobs from the server
     */
    async loadExistingBlobs() {
        console.log('📊 Loading existing sentiment data...');
        
        try {
            const response = await fetch('/api/get_all_blobs');
            const data = await response.json();
            
            if (data.success && data.blobs) {
                console.log(`📊 Loaded ${data.blobs.length} existing blobs`);
                
                // Add blobs to visualizer with staggered animation
                data.blobs.forEach((blobData, index) => {
                    setTimeout(() => {
                        if (this.emotionVisualizer) {
                            this.emotionVisualizer.addBlob(blobData);
                        }
                    }, index * 100); // Stagger by 100ms
                });
                
                // Update stats after loading
                setTimeout(() => {
                    this.updateBlobStats();
                }, data.blobs.length * 100 + 500);
                
            } else {
                console.log('📊 No existing blobs found or failed to load');
            }
            
        } catch (error) {
            console.error('❌ Failed to load existing blobs:', error);
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
        
        // Check if AudioRecorder is available
        if (typeof AudioRecorder !== 'undefined') {
            // AudioRecorder will handle its own initialization
            console.log('✅ AudioRecorder class found, will be initialized separately');
        } else {
            // Fallback to basic recording functionality
            this.elements.recordBtn.addEventListener('click', () => {
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            });
        }
        
        console.log('✅ Recording functionality initialized');
    }
    
    /**
     * Initialize UI interactions
     */
    initializeUI() {
        console.log('🎯 Initializing UI interactions...');
        
        // Blob info panel toggle
        if (this.elements.blobInfoToggle) {
            this.elements.blobInfoToggle.addEventListener('click', () => {
                this.toggleBlobInfo();
            });
        }
        
        // Blob info panel close button
        const blobInfoClose = document.querySelector('.blob-info-close');
        if (blobInfoClose) {
            blobInfoClose.addEventListener('click', () => {
                this.toggleBlobInfo();
            });
        }
        
        // Analysis confirmation buttons
        const continueBtn = document.getElementById('analysis-continue-btn');
        const viewBtn = document.getElementById('analysis-view-btn');
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.hideAnalysisConfirmation();
            });
        }
        
        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                this.hideAnalysisConfirmation();
                this.toggleBlobInfo();
            });
        }
        
        // Error panel dismiss
        const errorDismiss = document.querySelector('.error-dismiss');
        if (errorDismiss) {
            errorDismiss.addEventListener('click', () => {
                this.hideError();
            });
        }
        
        // Instructions close
        const instructionsClose = document.querySelector('.instructions-close');
        if (instructionsClose) {
            instructionsClose.addEventListener('click', () => {
                this.hideInstructions();
            });
        }
        
        // Category filter clicks
        document.querySelectorAll('.category-stat').forEach(stat => {
            stat.addEventListener('click', () => {
                const category = stat.classList[1]; // Get the category class
                if (this.emotionVisualizer && category) {
                    const currentVisibility = this.emotionVisualizer.getCategoryVisibility();
                    const isVisible = currentVisibility.includes(category);
                    this.emotionVisualizer.setCategoryVisibility(category, !isVisible);
                    this.updateCategoryUI(category, !isVisible);
                }
            });
        });
        
        // Add visualization mode toggle button
        this.addVisualizationControls();
        
        console.log('✅ UI interactions initialized');
    }
    
    /**
     * Add visualization mode controls to the UI
     */
    addVisualizationControls() {
        // Create mode toggle button
        const modeToggle = document.createElement('button');
        modeToggle.id = 'mode-toggle';
        modeToggle.className = 'mode-toggle-btn';
        modeToggle.innerHTML = '🎨';
        modeToggle.title = 'Toggle Visualization Mode (M)';
        modeToggle.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 1000;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(21, 21, 21, 0.9);
            border: 2px solid rgba(255, 215, 0, 0.3);
            color: white;
            font-size: 20px;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            opacity: 0;
            transform: scale(0.8) translateX(20px);
        `;
        
        modeToggle.addEventListener('click', () => {
            if (this.emotionVisualizer) {
                this.emotionVisualizer.toggleVisualizationMode();
                
                // Add click animation
                if (typeof anime !== 'undefined') {
                    anime({
                        targets: modeToggle,
                        scale: [1, 0.9, 1.1, 1],
                        duration: 400,
                        easing: 'easeOutElastic(1, .8)'
                    });
                }
            }
        });
        
        modeToggle.addEventListener('mouseenter', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: modeToggle,
                    scale: 1.1,
                    borderColor: 'rgba(255, 215, 0, 0.6)',
                    duration: 200,
                    easing: 'easeOutCubic'
                });
            } else {
                modeToggle.style.transform = 'scale(1.1)';
                modeToggle.style.borderColor = 'rgba(255, 215, 0, 0.6)';
            }
        });
        
        modeToggle.addEventListener('mouseleave', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: modeToggle,
                    scale: 1,
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                    duration: 200,
                    easing: 'easeOutCubic'
                });
            } else {
                modeToggle.style.transform = 'scale(1)';
                modeToggle.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            }
        });
        
        document.body.appendChild(modeToggle);
        
        // Create camera reset button
        const resetBtn = document.createElement('button');
        resetBtn.id = 'camera-reset';
        resetBtn.className = 'camera-reset-btn';
        resetBtn.innerHTML = '🎯';
        resetBtn.title = 'Reset Camera (R)';
        resetBtn.style.cssText = `
            position: fixed;
            top: 160px;
            right: 20px;
            z-index: 1000;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(21, 21, 21, 0.9);
            border: 2px solid rgba(255, 215, 0, 0.3);
            color: white;
            font-size: 20px;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            opacity: 0;
            transform: scale(0.8) translateX(20px);
        `;
        
        resetBtn.addEventListener('click', () => {
            if (this.emotionVisualizer) {
                this.emotionVisualizer.resetCamera();
                
                // Add click animation
                if (typeof anime !== 'undefined') {
                    anime({
                        targets: resetBtn,
                        scale: [1, 0.9, 1.1, 1],
                        duration: 400,
                        easing: 'easeOutElastic(1, .8)'
                    });
                }
            }
        });
        
        resetBtn.addEventListener('mouseenter', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: resetBtn,
                    scale: 1.1,
                    borderColor: 'rgba(255, 215, 0, 0.6)',
                    duration: 200,
                    easing: 'easeOutCubic'
                });
            } else {
                resetBtn.style.transform = 'scale(1.1)';
                resetBtn.style.borderColor = 'rgba(255, 215, 0, 0.6)';
            }
        });
        
        resetBtn.addEventListener('mouseleave', () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: resetBtn,
                    scale: 1,
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                    duration: 200,
                    easing: 'easeOutCubic'
                });
            } else {
                resetBtn.style.transform = 'scale(1)';
                resetBtn.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            }
        });
        
        document.body.appendChild(resetBtn);
        
        // Animate buttons entrance after a delay
        setTimeout(() => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: [modeToggle, resetBtn],
                    opacity: [0, 1],
                    translateX: [20, 0],
                    scale: [0.8, 1],
                    delay: anime.stagger(200),
                    duration: 800,
                    easing: 'easeOutElastic(1, .8)'
                });
            } else {
                modeToggle.style.opacity = '1';
                modeToggle.style.transform = 'scale(1) translateX(0)';
                resetBtn.style.opacity = '1';
                resetBtn.style.transform = 'scale(1) translateX(0)';
            }
        }, 1000);
    }
    
    /**
     * Update category UI based on visibility
     */
    updateCategoryUI(category, visible) {
        const categoryElement = document.querySelector(`.category-stat.${category}`);
        if (categoryElement) {
            if (visible) {
                categoryElement.style.opacity = '1';
                categoryElement.style.filter = 'none';
            } else {
                categoryElement.style.opacity = '0.5';
                categoryElement.style.filter = 'grayscale(100%)';
            }
        }
    }
    
    /**
     * Start recording audio
     */
    async startRecording() {
        console.log('🎤 Starting recording...');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
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
            
            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            this.updateRecordingUI(true);
            this.startRecordingTimer();
            this.updateStatus('recording');
            
            console.log('✅ Recording started');
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            this.showError('Failed to access microphone. Please check permissions.');
        }
    }
    
    /**
     * Stop recording audio
     */
    stopRecording() {
        console.log('🛑 Stopping recording...');
        
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            
            this.updateRecordingUI(false);
            this.stopRecordingTimer();
            this.updateStatus('processing');
            this.showProcessingPanel();
            
            console.log('✅ Recording stopped');
        }
    }
    
    /**
     * Process the recorded audio
     */
    async processRecording() {
        console.log('🔄 Processing recording...');
        
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('session_id', this.sessionId);
            
            const response = await fetch('/upload_audio', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Audio processed successfully:', result);
                this.handleAnalysisComplete(result);
            } else {
                console.error('❌ Audio processing failed:', result.error);
                this.showError(result.error || 'Failed to process audio');
                this.updateStatus('error');
            }
            
        } catch (error) {
            console.error('❌ Processing error:', error);
            this.showError('Failed to process recording. Please try again.');
            this.updateStatus('error');
        } finally {
            this.hideProcessingPanel();
        }
    }
    
    /**
     * Handle analysis completion
     */
    handleAnalysisComplete(data) {
        console.log('🎉 Analysis complete:', data);
        
        // Add new blobs to visualizer
        if (data.blobs && this.emotionVisualizer) {
            data.blobs.forEach((blobData, index) => {
                setTimeout(() => {
                    this.emotionVisualizer.addBlob(blobData);
                }, index * 200); // Stagger animations
            });
        }
        
        // Show analysis confirmation with detailed results
        this.showAnalysisConfirmation(data);
        
        // Update stats
        setTimeout(() => {
            this.updateBlobStats();
        }, data.blobs ? data.blobs.length * 200 + 500 : 500);
        
        this.updateStatus('complete');
        
        // Reset to ready after a delay
        setTimeout(() => {
            this.updateStatus('ready');
        }, 3000);
    }
    
    /**
     * Update recording UI state
     */
    updateRecordingUI(isRecording) {
        if (!this.elements.recordBtn) return;
        
        if (isRecording) {
            this.elements.recordBtn.classList.add('recording');
            this.elements.timer?.classList.add('visible');
        } else {
            this.elements.recordBtn.classList.remove('recording');
            this.elements.timer?.classList.remove('visible');
        }
    }
    
    /**
     * Start recording timer
     */
    startRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
        }
        
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const remaining = Math.max(0, this.maxRecordingTime - elapsed);
            const seconds = Math.ceil(remaining / 1000);
            
            if (this.elements.timerText) {
                this.elements.timerText.textContent = seconds;
            }
            
            // Update progress circle
            if (this.elements.timerProgress) {
                const progress = (this.maxRecordingTime - remaining) / this.maxRecordingTime;
                const circumference = 2 * Math.PI * 45; // radius = 45
                const offset = circumference * (1 - progress);
                this.elements.timerProgress.style.strokeDashoffset = offset;
            }
            
            // Auto-stop when time runs out
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
        
        // Reset timer display
        if (this.elements.timerText) {
            this.elements.timerText.textContent = '44';
        }
        
        if (this.elements.timerProgress) {
            this.elements.timerProgress.style.strokeDashoffset = 2 * Math.PI * 45;
        }
    }
    
    /**
     * Update status display
     */
    updateStatus(status) {
        this.currentStatus = status;
        const statusInfo = this.statusMessages[status];
        
        if (statusInfo && this.elements.statusText && this.elements.statusSubtitle) {
            this.elements.statusText.textContent = statusInfo.main;
            this.elements.statusSubtitle.textContent = statusInfo.sub;
        }
    }
    
    /**
     * Show loading overlay with enhanced animation
     */
    showLoadingOverlay() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.classList.remove('hidden');
            
            // Enhanced loading animation with Anime.js
            if (typeof anime !== 'undefined') {
                const loadingText = this.elements.loadingOverlay.querySelector('.loading-text');
                const loadingSpinner = this.elements.loadingOverlay.querySelector('.loading-spinner');
                
                // Animate text with typewriter effect
                if (loadingText) {
                    const text = loadingText.textContent;
                    loadingText.textContent = '';
                    
                    anime({
                        targets: loadingText,
                        opacity: [0, 1],
                        duration: 500,
                        complete: () => {
                            // Typewriter effect
                            let i = 0;
                            const typeInterval = setInterval(() => {
                                loadingText.textContent = text.substring(0, i + 1);
                                i++;
                                if (i >= text.length) {
                                    clearInterval(typeInterval);
                                }
                            }, 50);
                        }
                    });
                }
                
                // Enhanced spinner animation
                if (loadingSpinner) {
                    anime({
                        targets: loadingSpinner,
                        scale: [0, 1],
                        opacity: [0, 1],
                        duration: 800,
                        easing: 'easeOutElastic(1, .8)'
                    });
                }
            }
        }
    }
    
    /**
     * Hide loading overlay with animation
     */
    hideLoadingOverlay() {
        if (this.elements.loadingOverlay) {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: this.elements.loadingOverlay,
                    opacity: [1, 0],
                    duration: 500,
                    easing: 'easeOutCubic',
                    complete: () => {
                        this.elements.loadingOverlay.classList.add('hidden');
                    }
                });
            } else {
                setTimeout(() => {
                    this.elements.loadingOverlay.classList.add('hidden');
                }, 500);
            }
        }
    }
    
    /**
     * Show processing panel
     */
    showProcessingPanel() {
        if (this.elements.processingPanel) {
            this.elements.processingPanel.classList.add('visible');
        }
    }
    
    /**
     * Hide processing panel
     */
    hideProcessingPanel() {
        if (this.elements.processingPanel) {
            this.elements.processingPanel.classList.remove('visible');
        }
    }
    
    /**
     * Show error message
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
    
    /**
     * Hide error message
     */
    hideError() {
        if (this.elements.errorPanel) {
            this.elements.errorPanel.classList.remove('visible');
        }
    }
    
    /**
     * Show analysis confirmation with enhanced details
     */
    showAnalysisConfirmation(data) {
        if (!this.elements.analysisConfirmation) return;
        
        // Update summary
        const summary = this.elements.analysisConfirmation.querySelector('.analysis-summary');
        if (summary && data.blobs) {
            const emotionCounts = {};
            let totalConfidence = 0;
            
            data.blobs.forEach(blob => {
                emotionCounts[blob.category] = (emotionCounts[blob.category] || 0) + 1;
                totalConfidence += blob.confidence || 0;
            });
            
            const avgConfidence = data.blobs.length > 0 ? (totalConfidence / data.blobs.length * 100).toFixed(1) : 0;
            const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
                emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'
            );
            
            summary.innerHTML = `
                <p>Your voice has been analyzed and ${data.blobs.length} emotional expressions were identified.</p>
                <p>Dominant emotion: <strong>${dominantEmotion.replace('_', ' ').toUpperCase()}</strong></p>
                <p>Average confidence: <strong>${avgConfidence}%</strong></p>
            `;
        }
        
        // Update stats with animation
        const utterancesEl = document.getElementById('analysis-utterances');
        const emotionsEl = document.getElementById('analysis-emotions');
        const confidenceEl = document.getElementById('analysis-confidence');
        
        if (utterancesEl && data.blobs) {
            this.animateCounter(utterancesEl, 0, data.blobs.length, 1000);
        }
        
        if (emotionsEl && data.blobs) {
            const uniqueEmotions = new Set(data.blobs.map(blob => blob.category));
            this.animateCounter(emotionsEl, 0, uniqueEmotions.size, 1200);
        }
        
        if (confidenceEl && data.blobs) {
            const avgConfidence = data.blobs.reduce((sum, blob) => sum + (blob.confidence || 0), 0) / data.blobs.length;
            this.animateCounter(confidenceEl, 0, Math.round(avgConfidence * 100), 1400, '%');
        }
        
        // Update emotion list with staggered animation
        const emotionList = document.getElementById('analysis-emotion-list');
        if (emotionList && data.blobs) {
            const emotionCounts = {};
            data.blobs.forEach(blob => {
                emotionCounts[blob.category] = (emotionCounts[blob.category] || 0) + 1;
            });
            
            emotionList.innerHTML = Object.entries(emotionCounts)
                .map(([emotion, count]) => `
                    <div class="analysis-emotion ${emotion}" style="opacity: 0; transform: translateY(20px);">
                        <div class="analysis-emotion-dot"></div>
                        <span>${emotion.replace('_', ' ')} (${count})</span>
                    </div>
                `).join('');
            
            // Animate emotion tags
            const emotionTags = emotionList.querySelectorAll('.analysis-emotion');
            if (typeof anime !== 'undefined') {
                anime({
                    targets: emotionTags,
                    opacity: [0, 1],
                    translateY: [20, 0],
                    delay: anime.stagger(100, {start: 500}),
                    duration: 600,
                    easing: 'easeOutCubic'
                });
            }
        }
        
        // Show the panel with animation
        this.elements.analysisConfirmation.classList.add('visible');
        
        // Animate panel entrance
        if (typeof anime !== 'undefined') {
            anime({
                targets: this.elements.analysisConfirmation,
                scale: [0.8, 1],
                opacity: [0, 1],
                duration: 800,
                easing: 'easeOutElastic(1, .8)'
            });
        }
        
        console.log('📊 Analysis confirmation shown with animations');
    }
    
    /**
     * Animate counter with Anime.js
     */
    animateCounter(element, from, to, duration = 1000, suffix = '') {
        if (typeof anime !== 'undefined') {
            const obj = { value: from };
            anime({
                targets: obj,
                value: to,
                duration: duration,
                easing: 'easeOutCubic',
                update: () => {
                    element.textContent = Math.round(obj.value) + suffix;
                }
            });
        } else {
            // Fallback without animation
            element.textContent = to + suffix;
        }
    }
    
    /**
     * Hide analysis confirmation
     */
    hideAnalysisConfirmation() {
        if (this.elements.analysisConfirmation) {
            this.elements.analysisConfirmation.classList.remove('visible');
        }
    }
    
    /**
     * Hide instructions
     */
    hideInstructions() {
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.classList.add('hidden');
        }
    }
    
    /**
     * Toggle blob info panel
     */
    toggleBlobInfo() {
        if (this.elements.blobInfoPanel && this.elements.blobInfoToggle) {
            const isActive = this.elements.blobInfoPanel.classList.contains('active');
            
            if (isActive) {
                // Hide panel with animation
                if (typeof anime !== 'undefined') {
                    anime({
                        targets: this.elements.blobInfoPanel,
                        translateX: [-350, 0],
                        duration: 400,
                        easing: 'easeInCubic',
                        complete: () => {
                            this.elements.blobInfoPanel.classList.remove('active');
                        }
                    });
                } else {
                    this.elements.blobInfoPanel.classList.remove('active');
                }
                this.elements.blobInfoToggle.classList.remove('active');
            } else {
                // Show panel with animation
                this.elements.blobInfoPanel.classList.add('active');
                this.elements.blobInfoToggle.classList.add('active');
                
                if (typeof anime !== 'undefined') {
                    anime({
                        targets: this.elements.blobInfoPanel,
                        translateX: [0, -350],
                        duration: 600,
                        easing: 'easeOutElastic(1, .8)'
                    });
                    
                    // Animate category stats
                    const categoryStats = this.elements.blobInfoPanel.querySelectorAll('.category-stat');
                    anime({
                        targets: categoryStats,
                        opacity: [0, 1],
                        translateX: [-20, 0],
                        delay: anime.stagger(100, {start: 200}),
                        duration: 500,
                        easing: 'easeOutCubic'
                    });
                }
                
                this.updateBlobStats();
            }
        }
    }
    
    /**
     * Update blob statistics display
     */
    updateBlobStats() {
        if (!this.emotionVisualizer) return;
        
        const blobCount = this.emotionVisualizer.getBlobCount();
        const categoryCounts = this.emotionVisualizer.getCategoryCounts();
        
        // Update total count
        if (this.elements.blobCount) {
            this.elements.blobCount.textContent = blobCount;
        }
        
        // Update category counts with correct ID mapping
        const categoryMapping = {
            'hope': 'hope-count',
            'sorrow': 'sorrow-count', 
            'transformative': 'transformative-count',
            'ambivalent': 'ambivalent-count',
            'reflective_neutral': 'reflective-neutral-count'
        };
        
        Object.entries(categoryCounts).forEach(([category, count]) => {
            const elementId = categoryMapping[category];
            if (elementId) {
                const countElement = document.getElementById(elementId);
                if (countElement) {
                    countElement.textContent = count;
                } else {
                    console.warn(`⚠️ Count element not found: ${elementId} for category: ${category}`);
                }
            }
        });
        
        console.log('📊 Updated blob stats:', { total: blobCount, categories: categoryCounts });
    }
    
    /**
     * Show WebGL fallback message
     */
    showWebGLFallback() {
        const fallback = document.createElement('div');
        fallback.className = 'webgl-fallback';
        fallback.innerHTML = `
            <h3>⚠️ WebGL Not Available</h3>
            <p>Your browser doesn't support WebGL or it's disabled. The visualization will use a simplified mode.</p>
            <p>For the best experience, please use a modern browser with WebGL enabled.</p>
        `;
        
        if (this.elements.visualizationContainer) {
            this.elements.visualizationContainer.appendChild(fallback);
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
            '.nav-bar', '.recording-interface', '.blob-info-panel', 
            '.analysis-confirmation', '.instructions-panel', '.error-panel',
            '.mode-toggle-btn', '.camera-reset-btn'
        ];
        
        return uiSelectors.some(selector => {
            const element = document.querySelector(selector);
            return element && element.contains(event.target);
        });
    }
    
    /**
     * Update blob count display
     */
    async updateBlobCount() {
        try {
            const response = await fetch('/api/get_all_blobs');
            const data = await response.json();
            
            if (data.success && this.elements.blobCount) {
                this.elements.blobCount.textContent = data.total_count || 0;
            }
        } catch (error) {
            console.error('❌ Failed to update blob count:', error);
        }
    }
    
    /**
     * Show user-friendly error message
     */
    showUserError(message) {
        // Create error overlay if it doesn't exist
        let errorOverlay = document.getElementById('user-error-overlay');
        if (!errorOverlay) {
            errorOverlay = document.createElement('div');
            errorOverlay.id = 'user-error-overlay';
            errorOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                color: white;
                font-family: 'Inter', sans-serif;
            `;
            
            errorOverlay.innerHTML = `
                <div style="
                    background: rgba(21, 21, 21, 0.95);
                    border: 2px solid rgba(255, 215, 0, 0.3);
                    border-radius: 15px;
                    padding: 30px;
                    text-align: center;
                    max-width: 400px;
                    margin: 20px;
                ">
                    <h3 style="color: #FFD700; margin-bottom: 15px;">⚠️ Application Error</h3>
                    <p style="margin-bottom: 20px; line-height: 1.5;">${message}</p>
                    <button onclick="window.location.reload()" style="
                        background: #FFD700;
                        color: #151515;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">Refresh Page</button>
                </div>
            `;
            
            document.body.appendChild(errorOverlay);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Hopes & Sorrows App...');
    window.hopesSorrowsApp = new HopesSorrowsApp();
});

// Export for global access
window.HopesSorrowsApp = HopesSorrowsApp; 