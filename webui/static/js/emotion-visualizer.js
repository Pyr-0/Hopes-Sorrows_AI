/**
 * Simple Background Emotion Visualizer for Hopes & Sorrows
 * Clean canvas 2D implementation with aquamarine theme
 */

class EmotionVisualizer {
    constructor() {
        // Core properties
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.startTime = Date.now();
        this.mouseX = 0;
        this.mouseY = 0;
        this.intensity = 1;
        this.timeScale = 1;
        this.zoom = 1;
        this.sentimentColor = [1, 1, 1];
        
        // Visual properties
        this.waves = [];
        this.particles = [];
        this.numWaves = 3;
        this.numParticles = 50;
        
        // Color theme - aquamarine palette
        this.colors = {
            primary: 'rgba(102, 204, 179, 0.3)',    // #66ccb3
            secondary: 'rgba(77, 153, 204, 0.2)',   // #4d99cc
            accent: 'rgba(128, 179, 204, 0.2)',     // #80b3cc
            background: 'rgba(10, 25, 35, 1)'       // Dark aquamarine
        };
        
        console.log('🌊 Simple Emotion Visualizer initialized');
    }
    
    /**
     * Initialize the visualizer
     */
    async init(container) {
        try {
            if (!container) {
                throw new Error('Container element not provided');
            }
            
            this.container = container;
            this.createCanvas();
            this.initializeWaves();
            this.initializeParticles();
            this.startAnimation();
            
            console.log('✅ Simple Emotion Visualizer initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Visualizer initialization failed:', error);
            this.initializeFallbackMode();
            return true;
        }
    }
    
    /**
     * Create and setup canvas
     */
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'emotion-background-canvas';
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
        `;
        
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        if (!this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    /**
     * Initialize wave patterns
     */
    initializeWaves() {
        this.waves = [];
        for (let i = 0; i < this.numWaves; i++) {
            this.waves.push({
                amplitude: 30 + i * 20,
                frequency: 0.01 + i * 0.005,
                speed: 0.02 + i * 0.01,
                offset: i * Math.PI / 2,
                color: i === 0 ? this.colors.primary : 
                       i === 1 ? this.colors.secondary : this.colors.accent
            });
        }
    }
    
    /**
     * Initialize floating particles
     */
    initializeParticles() {
        this.particles = [];
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    /**
     * Start animation loop
     */
    startAnimation() {
        const animate = () => {
            this.draw();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * Main drawing function
     */
    draw() {
        if (!this.ctx) return;
        
        const currentTime = (Date.now() - this.startTime) / 1000;
        
        // Clear canvas with background gradient
        this.drawBackground();
        
        // Draw animated waves
        this.drawWaves(currentTime);
        
        // Draw floating particles
        this.drawParticles(currentTime);
    }
    
    /**
     * Draw background gradient
     */
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(10, 25, 35, 1)');
        gradient.addColorStop(0.5, 'rgba(15, 30, 40, 1)');
        gradient.addColorStop(1, 'rgba(20, 35, 45, 1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Draw animated wave patterns
     */
    drawWaves(time) {
        this.waves.forEach(wave => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = wave.color;
            this.ctx.lineWidth = 2;
            
            for (let x = 0; x <= this.canvas.width; x += 5) {
                const y = this.canvas.height / 2 + 
                         Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude;
                
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        });
    }
    
    /**
     * Draw floating particles
     */
    drawParticles(time) {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Update pulse
            particle.pulse += 0.02;
            const pulseOpacity = particle.opacity * (0.5 + 0.5 * Math.sin(particle.pulse));
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(102, 204, 179, ${pulseOpacity})`;
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    /**
     * Initialize fallback mode when canvas fails
     */
    initializeFallbackMode() {
        console.log('🔄 Initializing fallback visualization mode...');
        
        const fallbackDiv = document.createElement('div');
        fallbackDiv.id = 'emotion-fallback';
        fallbackDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, 
                rgba(10, 25, 35, 1) 0%, 
                rgba(15, 30, 40, 1) 50%, 
                rgba(20, 35, 45, 1) 100%);
            z-index: 0;
            pointer-events: none;
        `;
        
        this.container.appendChild(fallbackDiv);
        console.log('✅ Fallback visualization mode initialized');
    }
    
    /**
     * Update visualization based on emotion data
     */
    updateSentiment(sentimentData) {
        // This can be expanded to adjust wave patterns based on emotion
        if (sentimentData && sentimentData.dominant_emotion) {
            console.log('🌊 Updating visualization for:', sentimentData.dominant_emotion);
        }
    }
    
    /**
     * Clean up and destroy visualizer
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        
        window.removeEventListener('resize', this.resizeCanvas);
        console.log('🌊 Emotion Visualizer destroyed');
    }
    
    // Legacy methods for compatibility
    addBlob(blobData) {
        // Handled by BlobEmotionVisualizer
        return null;
    }
    
    clearAllBlobs() {
        // Handled by BlobEmotionVisualizer
    }
    
    getBlobCount() {
        return 0;
    }
    
    getCategoryCounts() {
        return {};
    }
}

// Make available globally
window.IntegratedEmotionVisualizer = IntegratedEmotionVisualizer;window.IntegratedEmotionVisualizer = IntegratedEmotionVisualizer;
