/**
 * Dual Emotion Visualizer
 * Manages both GLSL Vortex and P5.js Blob visualizers with seamless switching
 */

class DualEmotionVisualizer {
    constructor() {
        // Visualizer instances
        this.glslVisualizer = null;
        this.blobVisualizer = null;
        this.currentMode = 'vortex'; // 'vortex' or 'blobs'
        
        // Container and UI elements
        this.container = null;
        this.toggleControls = null;
        this.modeIndicator = null;
        
        // Shared blob data
        this.sharedBlobData = [];
        this.maxBlobs = 80;
        
        // Mode configurations
        this.modes = {
            vortex: {
                name: 'GLSL Vortex',
                icon: '🌀',
                description: 'Immersive vortex with integrated emotion particles',
                visualizerClass: 'IntegratedEmotionVisualizer'
            },
            blobs: {
                name: 'Floating Blobs',
                icon: '🫧',
                description: 'Interactive floating blobs with detailed tooltips',
                visualizerClass: 'BlobEmotionVisualizer'
            }
        };
        
        console.log('🎭 Dual Emotion Visualizer initialized');
    }
    
    async init(container) {
        console.log('🎭 Initializing Dual Emotion Visualizer...');
        
        try {
            if (!container) {
                throw new Error('Container element is required');
            }
            
            this.container = container;
            
            // Create UI controls
            this.createToggleControls();
            
            // Initialize both visualizers
            await this.initializeVisualizers();
            
            // Set initial mode
            await this.switchToMode(this.currentMode);
            
            // Load existing blobs
            await this.loadExistingBlobs();
            
            console.log('✅ Dual Emotion Visualizer ready');
            return true;
            
        } catch (error) {
            console.error('❌ Dual Emotion Visualizer initialization failed:', error);
            throw error;
        }
    }
    
    createToggleControls() {
        // Create toggle controls container
        this.toggleControls = document.createElement('div');
        this.toggleControls.className = 'visualizer-toggle-controls';
        this.toggleControls.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
            align-items: center;
        `;
        
        // Create mode buttons
        Object.keys(this.modes).forEach(mode => {
            const button = document.createElement('button');
            button.className = `mode-btn mode-btn-${mode}`;
            button.setAttribute('data-mode', mode);
            button.title = `Switch to ${this.modes[mode].name}`;
            button.innerHTML = `
                <span class="mode-icon">${this.modes[mode].icon}</span>
                <span class="mode-label">${this.modes[mode].name}</span>
            `;
            button.style.cssText = `
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
                opacity: 0.7;
            `;
            
            button.addEventListener('click', () => {
                this.switchToMode(mode);
            });
            
            button.addEventListener('mouseenter', () => {
                button.style.opacity = '1';
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            });
            
            button.addEventListener('mouseleave', () => {
                if (mode !== this.currentMode) {
                    button.style.opacity = '0.7';
                }
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            });
            
            this.toggleControls.appendChild(button);
        });
        
        // Create mode indicator
        this.modeIndicator = document.createElement('div');
        this.modeIndicator.className = 'mode-indicator';
        this.modeIndicator.style.cssText = `
            position: absolute;
            top: 80px;
            right: 20px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            opacity: 0.8;
        `;
        
        // Add to container
        this.container.appendChild(this.toggleControls);
        this.container.appendChild(this.modeIndicator);
        
        console.log('✅ Toggle controls created');
    }
    
    async initializeVisualizers() {
        console.log('🔧 Initializing both visualizers...');
        
        try {
            // Initialize GLSL Vortex Visualizer
            if (typeof IntegratedEmotionVisualizer !== 'undefined') {
                this.glslVisualizer = new IntegratedEmotionVisualizer();
                console.log('✅ GLSL Visualizer instance created');
            } else {
                console.warn('⚠️ IntegratedEmotionVisualizer not available');
            }
            
            // Initialize P5.js Blob Visualizer
            if (typeof BlobEmotionVisualizer !== 'undefined') {
                this.blobVisualizer = new BlobEmotionVisualizer();
                console.log('✅ Blob Visualizer instance created');
            } else {
                console.warn('⚠️ BlobEmotionVisualizer not available');
            }
            
            // Ensure at least one visualizer is available
            if (!this.glslVisualizer && !this.blobVisualizer) {
                throw new Error('No visualizers available');
            }
            
            console.log('✅ Visualizer instances ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize visualizers:', error);
            throw error;
        }
    }
    
    async switchToMode(mode) {
        console.log(`🎭 Switching to ${mode} mode...`);
        
        if (!this.modes[mode]) {
            console.error(`❌ Unknown mode: ${mode}`);
            return false;
        }
        
        try {
            // Hide current visualizer
            await this.hideCurrentVisualizer();
            
            // Update current mode
            this.currentMode = mode;
            
            // Show new visualizer
            await this.showCurrentVisualizer();
            
            // Update UI
            this.updateToggleControls();
            this.updateModeIndicator();
            
            // Sync blob data to new visualizer
            this.syncBlobData();
            
            console.log(`✅ Switched to ${this.modes[mode].name}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to switch to ${mode} mode:`, error);
            return false;
        }
    }
    
    async hideCurrentVisualizer() {
        // Hide GLSL visualizer
        if (this.glslVisualizer && this.glslVisualizer.canvas) {
            this.glslVisualizer.canvas.style.display = 'none';
        }
        
        // Hide blob visualizer
        if (this.blobVisualizer && this.blobVisualizer.p5Instance) {
            const p5Canvas = this.blobVisualizer.p5Instance.canvas;
            if (p5Canvas) {
                p5Canvas.style.display = 'none';
            }
        }
    }
    
    async showCurrentVisualizer() {
        if (this.currentMode === 'vortex' && this.glslVisualizer) {
            // Initialize GLSL visualizer if not already done
            if (!this.glslVisualizer.canvas) {
                await this.glslVisualizer.init(this.container);
            } else {
                this.glslVisualizer.canvas.style.display = 'block';
            }
        } else if (this.currentMode === 'blobs' && this.blobVisualizer) {
            // Initialize blob visualizer if not already done
            if (!this.blobVisualizer.p5Instance) {
                await this.blobVisualizer.init(this.container);
                
                // After initialization, sync any existing blob data
                if (this.sharedBlobData.length > 0) {
                    console.log(`🔄 Loading ${this.sharedBlobData.length} existing blobs into blob visualizer`);
                    this.sharedBlobData.forEach(blobData => {
                        this.blobVisualizer.addBlob(blobData);
                    });
                }
            } else {
                const p5Canvas = this.blobVisualizer.p5Instance.canvas;
                if (p5Canvas) {
                    p5Canvas.style.display = 'block';
                }
            }
        }
    }
    
    updateToggleControls() {
        const buttons = this.toggleControls.querySelectorAll('.mode-btn');
        buttons.forEach(button => {
            const mode = button.getAttribute('data-mode');
            if (mode === this.currentMode) {
                button.style.opacity = '1';
                button.style.background = 'rgba(255, 215, 0, 0.2)';
                button.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                button.style.color = '#FFD700';
            } else {
                button.style.opacity = '0.7';
                button.style.background = 'rgba(0, 0, 0, 0.7)';
                button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                button.style.color = 'white';
            }
        });
    }
    
    updateModeIndicator() {
        const modeInfo = this.modes[this.currentMode];
        this.modeIndicator.textContent = `${modeInfo.icon} ${modeInfo.name}`;
    }
    
    syncBlobData() {
        const activeVisualizer = this.getActiveVisualizer();
        if (activeVisualizer && this.sharedBlobData.length > 0) {
            console.log(`🔄 Syncing ${this.sharedBlobData.length} blobs to ${this.currentMode} mode`);
            
            // Clear existing blobs in active visualizer
            activeVisualizer.clearAllBlobs();
            
            // Add all shared blob data
            this.sharedBlobData.forEach(blobData => {
                activeVisualizer.addBlob(blobData);
            });
        }
    }
    
    getActiveVisualizer() {
        if (this.currentMode === 'vortex') {
            return this.glslVisualizer;
        } else if (this.currentMode === 'blobs') {
            return this.blobVisualizer;
        }
        return null;
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key.toLowerCase()) {
                case 'v':
                    this.switchToMode('vortex');
                    break;
                case 'b':
                    this.switchToMode('blobs');
                    break;
                case 'tab':
                    e.preventDefault();
                    this.toggleMode();
                    break;
            }
        });
        
        console.log('⌨️ Keyboard shortcuts setup: V=Vortex, B=Blobs, Tab=Toggle');
    }
    
    toggleMode() {
        const newMode = this.currentMode === 'vortex' ? 'blobs' : 'vortex';
        this.switchToMode(newMode);
    }
    
    // Public API methods that delegate to active visualizer
    addBlob(blobData) {
        // Add to shared data
        this.sharedBlobData.push(blobData);
        
        // Remove oldest if too many
        if (this.sharedBlobData.length > this.maxBlobs) {
            this.sharedBlobData.shift();
        }
        
        // Add to active visualizer
        const activeVisualizer = this.getActiveVisualizer();
        if (activeVisualizer) {
            activeVisualizer.addBlob(blobData);
        }
        
        console.log(`🎭 Added blob to ${this.currentMode} mode:`, blobData.category);
    }
    
    clearAllBlobs() {
        // Clear shared data
        this.sharedBlobData = [];
        
        // Clear both visualizers
        if (this.glslVisualizer) {
            this.glslVisualizer.clearAllBlobs();
        }
        if (this.blobVisualizer) {
            this.blobVisualizer.clearAllBlobs();
        }
        
        console.log('🧹 Cleared all blobs from both visualizers');
    }
    
    getBlobCount() {
        return this.sharedBlobData.length;
    }
    
    getCategoryCounts() {
        const counts = {
            hope: 0,
            sorrow: 0,
            transformative: 0,
            ambivalent: 0,
            reflective_neutral: 0
        };
        
        this.sharedBlobData.forEach(blob => {
            if (counts.hasOwnProperty(blob.category)) {
                counts[blob.category]++;
            }
        });
        
        return counts;
    }
    
    getCurrentMode() {
        return {
            mode: this.currentMode,
            info: this.modes[this.currentMode]
        };
    }
    
    getAvailableModes() {
        return this.modes;
    }
    
    // Load existing blobs from API
    async loadExistingBlobs() {
        console.log('📊 Loading existing blobs into dual visualizer...');
        
        try {
            const response = await fetch('/api/get_all_blobs');
            const data = await response.json();
            
            if (data.success && data.blobs) {
                console.log(`📊 Loading ${data.blobs.length} existing blobs`);
                
                // Add to shared data first
                data.blobs.forEach(blobData => {
                    this.sharedBlobData.push(blobData);
                });
                
                // Add to active visualizer if it exists
                const activeVisualizer = this.getActiveVisualizer();
                if (activeVisualizer) {
                    data.blobs.forEach(blobData => {
                        activeVisualizer.addBlob(blobData);
                    });
                }
                
                console.log(`✅ Loaded ${data.blobs.length} blobs into dual visualizer`);
            }
        } catch (error) {
            console.error('❌ Failed to load existing blobs:', error);
        }
    }
    
    // Cleanup method
    destroy() {
        if (this.glslVisualizer && typeof this.glslVisualizer.destroy === 'function') {
            this.glslVisualizer.destroy();
        }
        if (this.blobVisualizer && typeof this.blobVisualizer.destroy === 'function') {
            this.blobVisualizer.destroy();
        }
        
        if (this.toggleControls) {
            this.toggleControls.remove();
        }
        if (this.modeIndicator) {
            this.modeIndicator.remove();
        }
        
        console.log('🎭 Dual Emotion Visualizer destroyed');
    }
}

// Make available globally
window.DualEmotionVisualizer = DualEmotionVisualizer; 