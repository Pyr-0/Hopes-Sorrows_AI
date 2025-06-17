/**
 * Audio Recorder for Hopes & Sorrows
 * Handles audio recording, real-time visualization, and backend integration
 */

class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.maxDuration = 44; // 44 seconds max
        this.recordingTimer = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.visualizationData = null;
        this.animationFrame = null;
        
        // DOM elements
        this.recordButton = null;
        this.timer = null;
        this.timerProgress = null;
        this.timerSeconds = null;
        this.statusPanel = null;
        this.processingPanel = null;
        this.errorPanel = null;
        
        // Session management
        this.sessionId = this.generateSessionId();
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.recordButton = document.getElementById('record-button');
        this.timer = document.getElementById('timer');
        this.timerProgress = document.getElementById('timer-progress');
        this.timerSeconds = document.getElementById('timer-seconds');
        this.statusPanel = document.getElementById('recording-status');
        this.processingPanel = document.getElementById('processing-status');
        this.errorPanel = document.getElementById('error-panel');
    }
    
    setupEventListeners() {
        if (this.recordButton) {
            this.recordButton.addEventListener('click', () => {
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            });
        }
        
        // Error panel dismiss
        const errorDismiss = document.querySelector('.error-dismiss');
        if (errorDismiss) {
            errorDismiss.addEventListener('click', () => {
                this.hideError();
                this.resetToInitialState();
            });
        }
    }
    
    async startRecording() {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });
            
            // Setup audio context for visualization
            this.setupAudioContext(stream);
            
            // Setup MediaRecorder
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: this.getSupportedMimeType()
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
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            
            // Update UI
            this.updateUIForRecording();
            
            // Start timer
            this.startTimer();
            
            // Start visualization
            this.startVisualization();
            
            // Emit recording progress for live visualization
            this.emitRecordingProgress();
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Unable to access microphone. Please check permissions and try again.');
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop timer
            this.stopTimer();
            
            // Stop visualization
            this.stopVisualization();
            
            // Clean up audio context
            this.cleanupAudioContext();
            
            // Update UI
            this.updateUIForProcessing();
        }
    }
    
    setupAudioContext(stream) {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            this.microphone.connect(this.analyser);
            
            this.visualizationData = new Uint8Array(this.analyser.frequencyBinCount);
        } catch (error) {
            console.error('Error setting up audio context:', error);
        }
    }
    
    cleanupAudioContext() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
        this.microphone = null;
        this.visualizationData = null;
    }
    
    startVisualization() {
        if (!this.analyser) return;
        
        const visualize = () => {
            if (!this.isRecording) return;
            
            this.analyser.getByteFrequencyData(this.visualizationData);
            
            // Calculate audio level for visual feedback
            const average = this.visualizationData.reduce((sum, value) => sum + value, 0) / this.visualizationData.length;
            const normalizedLevel = average / 255;
            
            // Update record button visual feedback
            this.updateRecordButtonVisualization(normalizedLevel);
            
            this.animationFrame = requestAnimationFrame(visualize);
        };
        
        visualize();
    }
    
    stopVisualization() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    updateRecordButtonVisualization(level) {
        const recordIcon = document.querySelector('.record-icon');
        if (recordIcon) {
            const scale = 1 + (level * 0.3); // Scale between 1 and 1.3
            const opacity = 0.6 + (level * 0.4); // Opacity between 0.6 and 1
            
            recordIcon.style.transform = `scale(${scale})`;
            recordIcon.style.opacity = opacity;
        }
    }
    
    startTimer() {
        let timeLeft = this.maxDuration;
        this.updateTimerDisplay(timeLeft);
        
        this.recordingTimer = setInterval(() => {
            timeLeft--;
            this.updateTimerDisplay(timeLeft);
            
            if (timeLeft <= 0) {
                this.stopRecording();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }
    
    updateTimerDisplay(seconds) {
        if (this.timerSeconds) {
            this.timerSeconds.textContent = seconds;
        }
        
        if (this.timerProgress) {
            // FIXED: Improve timer circle calculation with bounds checking
            const totalSeconds = this.maxDuration;
            const elapsed = Math.max(0, Math.min(totalSeconds, totalSeconds - seconds));
            const progress = (elapsed / totalSeconds);
            const circumference = 283; // Circle circumference
            const offset = circumference - (progress * circumference);
            
            // Smooth the transition and prevent jumps
            this.timerProgress.style.transition = seconds === totalSeconds ? 'none' : 'stroke-dashoffset 0.1s linear';
            this.timerProgress.style.strokeDashoffset = Math.max(0, offset);
        }
    }
    
    updateUIForRecording() {
        // Update record button
        if (this.recordButton) {
            this.recordButton.classList.add('recording');
            const recordText = this.recordButton.querySelector('.record-text');
            if (recordText) {
                recordText.textContent = 'Recording...';
            }
        }
        
        // Show timer
        if (this.timer) {
            this.timer.classList.add('active');
        }
        
        // Update status
        this.updateStatus('🎤 Recording your voice...', 'Share your thoughts and feelings freely');
    }
    
    updateUIForProcessing() {
        // Hide timer
        if (this.timer) {
            this.timer.classList.remove('active');
        }
        
        // Reset record button
        if (this.recordButton) {
            this.recordButton.classList.remove('recording');
            const recordText = this.recordButton.querySelector('.record-text');
            if (recordText) {
                recordText.textContent = 'Start Sharing';
            }
        }
        
        // Show processing
        if (this.statusPanel) {
            this.statusPanel.style.display = 'none';
        }
        if (this.processingPanel) {
            this.processingPanel.classList.add('active');
        }
    }
    
    resetToInitialState() {
        // Reset all UI elements to initial state
        if (this.recordButton) {
            this.recordButton.classList.remove('recording');
            const recordText = this.recordButton.querySelector('.record-text');
            if (recordText) {
                recordText.textContent = 'Start Sharing';
            }
        }
        
        if (this.timer) {
            this.timer.classList.remove('active');
        }
        
        if (this.statusPanel) {
            this.statusPanel.style.display = 'block';
        }
        
        if (this.processingPanel) {
            this.processingPanel.classList.remove('active');
        }
        
        // Reset timer display
        this.updateTimerDisplay(this.maxDuration);
        
        // Update status
        this.updateStatus('Ready to capture your voice', 'Click below to start sharing');
    }
    
    updateStatus(title, subtitle) {
        const statusText = document.querySelector('.status-text');
        const statusSubtitle = document.querySelector('.status-subtitle');
        
        if (statusText) statusText.textContent = title;
        if (statusSubtitle) statusSubtitle.textContent = subtitle;
    }
    
    async processRecording() {
        try {
            // Create blob from audio chunks
            const audioBlob = new Blob(this.audioChunks, { 
                type: this.getSupportedMimeType() 
            });
            
            // Create form data for upload
            const formData = new FormData();
            formData.append('audio', audioBlob, `recording_${this.sessionId}.wav`);
            formData.append('session_id', this.sessionId);
            
            // Upload and analyze
            const response = await fetch('/upload_audio', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Success - let the main app handle the analysis completion
                console.log('✅ Audio processed successfully, notifying main app');
                console.log('🔍 Result data:', {
                    blobCount: result.blobs ? result.blobs.length : 0,
                    sessionId: result.session_id,
                    hasSummary: !!result.processing_summary
                });
                
                // Hide processing panel first
                if (this.processingPanel) {
                    this.processingPanel.classList.remove('active');
                }
                
                // ENHANCED: Ensure we have blobs before proceeding
                if (!result.blobs || result.blobs.length === 0) {
                    console.warn('⚠️ No blobs in result - this indicates an analysis issue');
                    this.showError('Analysis completed but no emotions were detected. Please try speaking more clearly or for longer.');
                    return;
                }
                
                // Notify the main app about the analysis completion
                if (window.hopesSorrowsApp && window.hopesSorrowsApp.handleAnalysisComplete) {
                    console.log('🎯 Calling main app handleAnalysisComplete with:', result);
                    window.hopesSorrowsApp.handleAnalysisComplete(result);
                } else {
                    console.warn('⚠️ Main app not available, trying direct analysis confirmation');
                    console.log('🔍 Available on window:', Object.keys(window).filter(k => k.includes('hopes') || k.includes('App')));
                    
                    // ENHANCED: More aggressive fallback handling
                    setTimeout(() => {
                        if (window.hopesSorrowsApp && window.hopesSorrowsApp.handleAnalysisComplete) {
                            console.log('🔄 Retry successful - main app is now available');
                            window.hopesSorrowsApp.handleAnalysisComplete(result);
                        } else {
                            console.log('🎯 Using direct analysis confirmation fallback');
                            this.showDirectAnalysisConfirmation(result);
                        }
                    }, 500);
                }
                
                // Reset UI state after a delay to let analysis panel show
                setTimeout(() => {
                    this.resetToInitialState();
                }, 2000); // Increased delay
                
                // Generate new session ID for next recording
                this.sessionId = this.generateSessionId();
                
            } else {
                // Handle different error types
                if (result.status === 'no_speech') {
                    this.showError('No speech detected in your recording. Please try speaking more clearly.');
                } else {
                    this.showError(result.error || 'Failed to analyze your recording. Please try again.');
                }
            }
            
        } catch (error) {
            console.error('Error processing recording:', error);
            this.showError('Failed to upload your recording. Please check your connection and try again.');
        }
    }
    
    showError(message) {
        if (this.errorPanel) {
            const errorText = this.errorPanel.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
            }
            this.errorPanel.classList.add('active');
        }
        
        // Hide processing panel
        if (this.processingPanel) {
            this.processingPanel.classList.remove('active');
        }
    }
    
    hideError() {
        if (this.errorPanel) {
            this.errorPanel.classList.remove('active');
        }
    }
    
    emitRecordingProgress() {
        if (!this.isRecording) return;
        
        // Emit progress for live visualization effects
        if (window.socket) {
            window.socket.emit('recording_progress', {
                sessionId: this.sessionId,
                isRecording: true,
                timeRemaining: this.maxDuration
            });
        }
        
        // Continue emitting while recording
        setTimeout(() => {
            if (this.isRecording) {
                this.emitRecordingProgress();
            }
        }, 1000);
    }
    
    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/wav',
            'audio/mp4',
            'audio/mpeg'
        ];
        
        return types.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/wav';
    }
    
    showDirectAnalysisConfirmation(result) {
        console.log('📊 Showing direct analysis confirmation');
        
        // Try to find and show the existing analysis confirmation panel
        const analysisPanel = document.getElementById('analysis-confirmation');
        if (analysisPanel) {
            console.log('✅ Found analysis confirmation panel, showing it directly');
            
            // Populate the panel with data
            this.populateAnalysisPanel(result);
            
            // Show the panel
            analysisPanel.classList.add('visible');
            
            // Add event listeners
            setTimeout(() => {
                const continueBtn = document.getElementById('analysis-continue-btn');
                const viewBtn = document.getElementById('analysis-view-btn');
                
                if (continueBtn) {
                    continueBtn.addEventListener('click', () => {
                        analysisPanel.classList.remove('visible');
                    });
                }
                
                if (viewBtn) {
                    viewBtn.addEventListener('click', () => {
                        analysisPanel.classList.remove('visible');
                        // Try to show blob info panel
                        const blobPanel = document.getElementById('blob-info-panel');
                        if (blobPanel) {
                            blobPanel.classList.add('active');
                        }
                    });
                }
            }, 100);
            
        } else {
            console.warn('⚠️ Analysis confirmation panel not found, showing fallback');
            this.showSuccessFallback(result);
        }
    }
    
    populateAnalysisPanel(result) {
        const blobs = result.blobs || [];
        const summary = result.processing_summary || {};
        
        // Update metrics
        const utterancesEl = document.getElementById('analysis-utterances');
        const emotionsEl = document.getElementById('analysis-emotions');
        const confidenceEl = document.getElementById('analysis-confidence');
        const durationEl = document.getElementById('analysis-duration');
        
        if (utterancesEl) utterancesEl.textContent = blobs.length;
        if (emotionsEl) emotionsEl.textContent = [...new Set(blobs.map(b => b.category))].length;
        if (confidenceEl) {
            const avgConfidence = blobs.length > 0 ? 
                Math.round(blobs.reduce((sum, b) => sum + (b.confidence || 0), 0) / blobs.length * 100) : 0;
            confidenceEl.textContent = avgConfidence + '%';
        }
        if (durationEl) {
            const duration = Math.min(44, Math.max(5, blobs.length * 3));
            durationEl.textContent = duration + 's';
        }
        
        // Update emotion list
        const emotionListEl = document.getElementById('analysis-emotion-list');
        if (emotionListEl && blobs.length > 0) {
            const emotionCounts = {};
            blobs.forEach(blob => {
                const category = blob.category || 'unknown';
                emotionCounts[category] = (emotionCounts[category] || 0) + 1;
            });

            emotionListEl.innerHTML = Object.entries(emotionCounts)
                .map(([emotion, count]) => `
                    <div class="analysis-emotion ${emotion}">
                        <div class="analysis-emotion-dot"></div>
                        <span>${emotion.charAt(0).toUpperCase() + emotion.slice(1)} (${count})</span>
                    </div>
                `).join('');
        }
    }

    showSuccessFallback(result) {
        // Create a success notification when main app isn't available
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(76, 175, 80, 0.95);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        const blobCount = result.blobs ? result.blobs.length : 0;
        notification.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 15px;">✅ Recording Processed!</div>
            <div style="font-size: 16px; margin-bottom: 20px;">
                ${blobCount} emotion${blobCount !== 1 ? 's' : ''} analyzed and ready to view
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
            ">Continue</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }
    
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Public methods for external control
    forceStop() {
        if (this.isRecording) {
            this.stopRecording();
        }
    }
    
    isCurrentlyRecording() {
        return this.isRecording;
    }
}

// Initialize audio recorder when DOM is ready
let audioRecorder = null;

document.addEventListener('DOMContentLoaded', () => {
    audioRecorder = new AudioRecorder();
    
    // Make it globally accessible
    window.audioRecorder = audioRecorder;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioRecorder;
} 