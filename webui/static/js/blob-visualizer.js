/**
 * Blob Emotion Visualizer
 * Extracted from the working emotion-visualizer.js for use in dual visualizer system
 * Features floating glowing blobs with interactive tooltips and physics
 */

class BlobEmotionVisualizer {
    constructor() {
        // P5.js properties
        this.p5Instance = null;
        this.canvas = null;
        this.container = null;
        
        // Blob management
        this.blobs = [];
        this.blobIdCounter = 0;
        this.maxBlobs = 80;
        this.selectedBlobs = new Set();
        this.visibleCategories = new Set(['hope', 'sorrow', 'transformative', 'ambivalent', 'reflective_neutral']);
        
        // Interaction properties
        this.lastClickedBlob = null;
        this.ripples = [];
        this.hoveredBlob = null;
        this.currentTooltip = null;
        
        // Sentiment color palettes (matching CSS variables)
        this.sentimentColors = {
            hope: [1.0, 0.84, 0.0],              // Gold
            sorrow: [0.29, 0.56, 0.89],          // Blue
            transformative: [0.61, 0.35, 0.71],  // Purple
            ambivalent: [0.91, 0.30, 0.24],      // Red-Orange
            reflective_neutral: [0.58, 0.65, 0.65] // Gray
        };
        
        // Background particles for ethereal effect
        this.particles = [];
        this.numParticles = 150;
        
        // Animation properties
        this.isInitialized = false;
        
        console.log('🫧 Blob Emotion Visualizer initialized');
    }
    
    /**
     * Initialize the blob visualizer
     */
    async init(container) {
        console.log('🫧 Initializing Blob Emotion Visualizer...');
        
        try {
            this.container = container;
            
            if (!container) {
                throw new Error('Container element not provided');
            }
            
            // Clear any existing content
            this.cleanup();
            
            // Setup P5.js canvas
            this.setupP5();
            this.createBackgroundParticles();
            
            this.isInitialized = true;
            console.log('✅ Blob Emotion Visualizer initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Blob visualizer initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Setup P5.js canvas and drawing loop
     */
    setupP5() {
        const self = this;
        
        // Create P5 container if it doesn't exist
        let p5Container = this.container.querySelector('#p5-blob-container');
        if (!p5Container) {
            p5Container = document.createElement('div');
            p5Container.id = 'p5-blob-container';
            p5Container.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                z-index: 2;
                width: 100%;
                height: 100%;
                pointer-events: auto;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            `;
            this.container.appendChild(p5Container);
        }
        
        const sketch = (p) => {
            self.p5Instance = p;
            
            p.setup = () => {
                const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
                canvas.parent('p5-blob-container');
                canvas.style('pointer-events', 'auto');
                
                p.colorMode(p.RGB, 255);
                console.log('✅ P5.js blob canvas setup complete');
            };
            
            p.draw = () => {
                // Dark gradient background
                self.drawBackground();
                
                // Update and draw all elements
                self.updateBlobPhysics();
                self.drawBackgroundParticles();
                self.drawBlobs();
                self.drawRipples();
                self.cleanupRipples();
                self.drawUI();
            };
            
            p.mousePressed = () => {
                if (!self.isClickOnUIElement(p.mouseX, p.mouseY)) {
                    self.handleInteraction(p.mouseX, p.mouseY);
                }
            };
            
            p.mouseMoved = () => {
                self.updateHoveredBlob(p.mouseX, p.mouseY);
            };
            
            p.windowResized = () => {
                p.resizeCanvas(window.innerWidth, window.innerHeight);
            };
        };
        
        new p5(sketch);
    }
    
    /**
     * Draw gradient background
     */
    drawBackground() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        
        // Create gradient background
        for (let i = 0; i <= p.height; i++) {
            const inter = p.map(i, 0, p.height, 0, 1);
            const c = p.lerpColor(
                p.color(10, 10, 10),      // Dark top
                p.color(22, 33, 62),      // Blue-ish bottom
                inter
            );
            p.stroke(c);
            p.line(0, i, p.width, i);
        }
    }
    
    /**
     * Create floating background particles
     */
    createBackgroundParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.3 + 0.1,
                color: this.getRandomSentimentColor()
            });
        }
    }
    
    /**
     * Get random sentiment color for particles
     */
    getRandomSentimentColor() {
        const colors = Object.values(this.sentimentColors);
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    /**
     * Update blob physics and animations
     */
    updateBlobPhysics() {
        this.blobs.forEach(blob => {
            // Update visibility based on category filters
            if (!this.visibleCategories.has(blob.category)) {
                blob.targetOpacity = 0;
            } else {
                blob.targetOpacity = 1;
            }
            
            // Smooth opacity transition
            blob.opacity += (blob.targetOpacity - blob.opacity) * 0.1;
            
            // Gentle floating motion
            blob.floatOffset += 0.02;
            blob.y += Math.sin(blob.floatOffset) * 0.3;
            
            // Subtle horizontal drift
            blob.x += blob.vx;
            blob.y += blob.vy;
            
            // Boundary checking with wrapping
            if (blob.x < -blob.size) blob.x = window.innerWidth + blob.size;
            if (blob.x > window.innerWidth + blob.size) blob.x = -blob.size;
            if (blob.y < -blob.size) blob.y = window.innerHeight + blob.size;
            if (blob.y > window.innerHeight + blob.size) blob.y = -blob.size;
        });
    }
    
    /**
     * Draw floating background particles
     */
    drawBackgroundParticles() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        
        this.particles.forEach(particle => {
            // Update particle position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = window.innerWidth;
            if (particle.x > window.innerWidth) particle.x = 0;
            if (particle.y < 0) particle.y = window.innerHeight;
            if (particle.y > window.innerHeight) particle.y = 0;
            
            // Draw particle with glow
            p.fill(
                particle.color[0] * 255,
                particle.color[1] * 255,
                particle.color[2] * 255,
                particle.opacity * 255
            );
            p.noStroke();
            p.circle(particle.x, particle.y, particle.size);
        });
    }
    
    /**
     * Draw emotion blobs with glow effects
     */
    drawBlobs() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        
        this.blobs.forEach(blob => {
            if (blob.opacity <= 0.01) return; // Skip invisible blobs
            
            const color = this.sentimentColors[blob.category] || [1, 1, 1];
            
            // Draw outer glow (largest)
            p.fill(
                color[0] * 255,
                color[1] * 255,
                color[2] * 255,
                blob.opacity * 15
            );
            p.noStroke();
            p.circle(blob.x, blob.y, blob.size * 3);
            
            // Draw middle glow
            p.fill(
                color[0] * 255,
                color[1] * 255,
                color[2] * 255,
                blob.opacity * 30
            );
            p.circle(blob.x, blob.y, blob.size * 2);
            
            // Draw inner glow
            p.fill(
                color[0] * 255,
                color[1] * 255,
                color[2] * 255,
                blob.opacity * 60
            );
            p.circle(blob.x, blob.y, blob.size * 1.5);
            
            // Draw blob core
            p.fill(
                color[0] * 255,
                color[1] * 255,
                color[2] * 255,
                blob.opacity * 200
            );
            p.circle(blob.x, blob.y, blob.size);
            
            // Draw selection indicator
            if (this.selectedBlobs.has(blob.id)) {
                p.stroke(255, 255, 255, blob.opacity * 255);
                p.strokeWeight(2);
                p.noFill();
                p.circle(blob.x, blob.y, blob.size + 10);
            }
            
            // Draw hover effect
            if (this.hoveredBlob === blob) {
                p.stroke(255, 255, 255, 150);
                p.strokeWeight(1);
                p.noFill();
                p.circle(blob.x, blob.y, blob.size + 5);
                
                // Change cursor
                p.canvas.style.cursor = 'pointer';
            }
        });
        
        // Reset cursor if no blob is hovered
        if (!this.hoveredBlob && this.p5Instance) {
            this.p5Instance.canvas.style.cursor = 'default';
        }
    }
    
    /**
     * Update which blob is being hovered
     */
    updateHoveredBlob(x, y) {
        this.hoveredBlob = this.getBlobAt(x, y);
    }
    
    /**
     * Handle mouse interaction with blobs
     */
    handleInteraction(x, y) {
        const clickedBlob = this.getBlobAt(x, y);
        
        if (clickedBlob) {
            // Toggle blob selection
            if (this.selectedBlobs.has(clickedBlob.id)) {
                this.selectedBlobs.delete(clickedBlob.id);
            } else {
                this.selectedBlobs.add(clickedBlob.id);
            }
            
            this.showBlobDetails(clickedBlob, x, y);
            this.createRippleEffect(x, y);
            this.lastClickedBlob = clickedBlob;
            
            console.log('🎯 Blob clicked:', clickedBlob);
        } else {
            // Clear selection if clicking empty space
            this.selectedBlobs.clear();
            this.hideTooltip();
        }
    }
    
    /**
     * Show detailed tooltip for a blob
     */
    showBlobDetails(blob, x, y) {
        // Remove existing tooltip
        this.hideTooltip();
        
        // Create new tooltip with enhanced analysis information
        const tooltip = document.createElement('div');
        tooltip.className = 'blob-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 0;
            max-width: 320px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            font-family: 'Inter', sans-serif;
            opacity: 0;
            transform: scale(0.8) translateY(10px);
            transition: all 0.3s ease;
        `;
        
        const color = this.sentimentColors[blob.category] || [1, 1, 1];
        const categoryColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`;
        
        tooltip.innerHTML = `
            <div class="tooltip-header" style="
                padding: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div class="tooltip-category" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: ${categoryColor};
                    font-weight: 600;
                    font-size: 14px;
                ">
                    <div class="category-dot" style="
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: ${categoryColor};
                        box-shadow: 0 0 10px ${categoryColor}40;
                    "></div>
                    <span>${blob.category.replace('_', ' ').toUpperCase()}</span>
                </div>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>
            <div class="tooltip-content" style="padding: 15px;">
                <div class="tooltip-text" style="
                    color: white;
                    font-size: 14px;
                    line-height: 1.5;
                    margin-bottom: 15px;
                    font-style: italic;
                ">"${blob.text}"</div>
                <div class="tooltip-stats" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 15px;
                ">
                    <div class="stat" style="text-align: center;">
                        <div class="stat-label" style="
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 11px;
                            margin-bottom: 4px;
                        ">Confidence</div>
                        <div class="stat-value" style="
                            color: ${categoryColor};
                            font-weight: 600;
                            font-size: 14px;
                        ">${(blob.confidence * 100).toFixed(1)}%</div>
                    </div>
                    <div class="stat" style="text-align: center;">
                        <div class="stat-label" style="
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 11px;
                            margin-bottom: 4px;
                        ">Intensity</div>
                        <div class="stat-value" style="
                            color: ${categoryColor};
                            font-weight: 600;
                            font-size: 14px;
                        ">${(blob.intensity * 100).toFixed(1)}%</div>
                    </div>
                    <div class="stat" style="text-align: center;">
                        <div class="stat-label" style="
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 11px;
                            margin-bottom: 4px;
                        ">Score</div>
                        <div class="stat-value" style="
                            color: ${categoryColor};
                            font-weight: 600;
                            font-size: 14px;
                        ">${blob.score.toFixed(3)}</div>
                    </div>
                </div>
                ${blob.explanation ? `<div class="tooltip-explanation" style="
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 12px;
                    line-height: 1.4;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                ">${blob.explanation}</div>` : ''}
                <div class="tooltip-meta" style="
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.5);
                ">
                    <div class="meta-item">
                        <span class="meta-label">Speaker:</span>
                        <span class="meta-value">${blob.speaker_name || 'Anonymous'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Time:</span>
                        <span class="meta-value">${blob.created_at ? new Date(blob.created_at).toLocaleTimeString() : 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Position tooltip
        tooltip.style.left = `${Math.min(x + 20, window.innerWidth - 340)}px`;
        tooltip.style.top = `${Math.max(y - 100, 20)}px`;
        
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
        
        // Animate tooltip entrance
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'scale(1) translateY(0)';
        }, 50);
        
        // Auto-hide after delay
        this.setupTooltipAutoHide(tooltip);
    }
    
    /**
     * Setup auto-hide functionality for tooltip
     */
    setupTooltipAutoHide(tooltip) {
        let hideTimer;
        
        const startHideTimer = () => {
            hideTimer = setTimeout(() => {
                if (tooltip && tooltip.parentNode) {
                    tooltip.remove();
                }
            }, 5000);
        };
        
        const cancelHideTimer = () => {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
        };
        
        tooltip.addEventListener('mouseenter', cancelHideTimer);
        tooltip.addEventListener('mouseleave', startHideTimer);
        
        // Start the timer initially
        startHideTimer();
    }
    
    /**
     * Hide current tooltip
     */
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
        
        // Clear any existing tooltips
        document.querySelectorAll('.blob-tooltip').forEach(tooltip => {
            tooltip.remove();
        });
    }
    
    /**
     * Create ripple effect at click location
     */
    createRippleEffect(x, y) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 100,
            opacity: 1,
            startTime: Date.now()
        });
    }
    
    /**
     * Draw ripple effects
     */
    drawRipples() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        const currentTime = Date.now();
        
        this.ripples.forEach(ripple => {
            const elapsed = currentTime - ripple.startTime;
            const progress = elapsed / 1000; // 1 second duration
            
            if (progress < 1) {
                ripple.radius = ripple.maxRadius * progress;
                ripple.opacity = 1 - progress;
                
                p.stroke(255, 255, 255, ripple.opacity * 100);
                p.strokeWeight(2);
                p.noFill();
                p.circle(ripple.x, ripple.y, ripple.radius * 2);
            }
        });
    }
    
    /**
     * Clean up expired ripples
     */
    cleanupRipples() {
        const currentTime = Date.now();
        this.ripples = this.ripples.filter(ripple => {
            return (currentTime - ripple.startTime) < 1000;
        });
    }
    
    /**
     * Draw UI elements
     */
    drawUI() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        
        // Draw blob count
        p.fill(255, 255, 255, 200);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        p.text(`Floating Blobs: ${this.blobs.length}`, 20, 20);
        
        // Draw visible categories
        let y = 50;
        p.textSize(14);
        p.text('Visible Emotions:', 20, y);
        y += 20;
        
        const categories = ['hope', 'sorrow', 'transformative', 'ambivalent', 'reflective_neutral'];
        categories.forEach((category, index) => {
            const isVisible = this.visibleCategories.has(category);
            const color = this.sentimentColors[category];
            
            p.fill(color[0] * 255, color[1] * 255, color[2] * 255, isVisible ? 255 : 100);
            p.circle(30, y + 8, 12);
            
            p.fill(255, 255, 255, isVisible ? 255 : 100);
            p.text(`${index + 1}. ${category}`, 50, y);
            y += 18;
        });
        
        // Draw instructions
        p.textSize(12);
        p.fill(255, 255, 255, 150);
        p.text('Click blobs to see details • 1-5 keys to toggle emotions', 20, p.height - 30);
    }
    
    /**
     * Check if click is on UI element
     */
    isClickOnUIElement(x, y) {
        const elementsAtPoint = document.elementsFromPoint(x, y);
        
        for (let element of elementsAtPoint) {
            if (element.classList.contains('blob-info-panel') ||
                element.classList.contains('blob-info-toggle') ||
                element.classList.contains('recording-interface') ||
                element.classList.contains('recording-panel') ||
                element.classList.contains('nav-bar') ||
                element.classList.contains('instructions-panel') ||
                element.classList.contains('analysis-confirmation') ||
                element.classList.contains('blob-tooltip') ||
                element.tagName === 'BUTTON' ||
                element.tagName === 'INPUT' ||
                element.closest('.blob-info-panel') ||
                element.closest('.recording-interface') ||
                element.closest('.nav-bar') ||
                element.closest('.instructions-panel') ||
                element.closest('.analysis-confirmation') ||
                element.closest('.blob-tooltip')) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Add a new blob to the visualization
     */
    addBlob(blobData) {
        // Ensure we have all required properties
        const blob = {
            id: blobData.id || `blob_${this.blobIdCounter++}`,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: this.calculateBlobSize(blobData),
            category: blobData.category || 'reflective_neutral',
            score: blobData.score || 0,
            confidence: blobData.confidence || 0,
            intensity: blobData.intensity || Math.abs(blobData.score || 0),
            label: blobData.label || 'neutral',
            text: blobData.text || '',
            explanation: blobData.explanation || '',
            speaker_name: blobData.speaker_name || 'Anonymous',
            created_at: blobData.created_at || new Date().toISOString(),
            
            // Animation properties
            opacity: 0,
            targetOpacity: 1,
            floatOffset: Math.random() * Math.PI * 2,
            
            // Physics properties
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        };
        
        // Remove oldest blob if we exceed max
        if (this.blobs.length >= this.maxBlobs) {
            this.removeOldestBlob();
        }
        
        this.blobs.push(blob);
        
        console.log('🫧 Added blob:', blob);
        return blob;
    }
    
    /**
     * Calculate blob size based on data
     */
    calculateBlobSize(blobData) {
        const baseSize = 20;
        const intensityMultiplier = (blobData.intensity || 0.5) * 30;
        const confidenceMultiplier = (blobData.confidence || 0.5) * 20;
        return Math.max(15, Math.min(50, baseSize + intensityMultiplier + confidenceMultiplier));
    }
    
    /**
     * Find blob at coordinates
     */
    getBlobAt(x, y) {
        // Find blob at coordinates (reverse order to get topmost)
        for (let i = this.blobs.length - 1; i >= 0; i--) {
            const blob = this.blobs[i];
            if (blob.opacity > 0.1) { // Only check visible blobs
                const distance = Math.sqrt(
                    Math.pow(x - blob.x, 2) + Math.pow(y - blob.y, 2)
                );
                if (distance <= blob.size) {
                    return blob;
                }
            }
        }
        return null;
    }
    
    /**
     * Remove oldest blob
     */
    removeOldestBlob() {
        if (this.blobs.length > 0) {
            const removed = this.blobs.shift();
            this.selectedBlobs.delete(removed.id);
            console.log('🗑️ Removed oldest blob:', removed.id);
        }
    }
    
    /**
     * Clear all blobs
     */
    clearAllBlobs() {
        this.blobs = [];
        this.selectedBlobs.clear();
        this.hideTooltip();
        console.log('🧹 Cleared all blobs');
    }
    
    /**
     * Get blob count
     */
    getBlobCount() {
        return this.blobs.length;
    }
    
    /**
     * Get category counts
     */
    getCategoryCounts() {
        const counts = {
            hope: 0,
            sorrow: 0,
            transformative: 0,
            ambivalent: 0,
            reflective_neutral: 0
        };
        
        this.blobs.forEach(blob => {
            if (counts.hasOwnProperty(blob.category)) {
                counts[blob.category]++;
            }
        });
        
        return counts;
    }
    
    /**
     * Set category visibility
     */
    setCategoryVisibility(category, visible) {
        if (visible) {
            this.visibleCategories.add(category);
        } else {
            this.visibleCategories.delete(category);
        }
        console.log(`🫧 Toggled ${category} visibility:`, visible);
    }
    
    /**
     * Get visible categories
     */
    getCategoryVisibility() {
        return Array.from(this.visibleCategories);
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
        }
        
        this.hideTooltip();
        
        // Remove P5 container
        const p5Container = this.container?.querySelector('#p5-blob-container');
        if (p5Container) {
            p5Container.remove();
        }
        
        this.isInitialized = false;
        console.log('🧹 Blob visualizer cleaned up');
    }
    
    /**
     * Destroy the visualizer
     */
    destroy() {
        this.cleanup();
        this.blobs = [];
        this.particles = [];
        this.ripples = [];
        this.selectedBlobs.clear();
        console.log('💥 Blob visualizer destroyed');
    }
}

// Export for global access
window.BlobEmotionVisualizer = BlobEmotionVisualizer; 