/**
 * P5.js-based Floating Blob Emotion Visualizer
 * Interactive floating blobs with detailed tooltips and organic movement
 */

class BlobEmotionVisualizer {
    constructor() {
        // P5.js instance
        this.p5Instance = null;
        this.container = null;
        
        // Blob management
        this.blobs = [];
        this.maxBlobs = 80;
        this.blobIdCounter = 0;
        
        // Interaction
        this.selectedBlobIndex = -1;
        this.hoveredBlob = null;
        this.tooltipVisible = false;
        this.currentTooltip = null;
        
        // Animation properties
        this.time = 0;
        this.particles = [];
        this.numParticles = 100;
        
        // Sentiment color palettes
        this.sentimentColors = {
            hope: [255, 215, 0],              // Gold
            sorrow: [74, 144, 226],           // Blue
            transformative: [156, 89, 182],   // Purple
            ambivalent: [231, 76, 60],        // Red
            reflective_neutral: [149, 165, 166] // Gray
        };
        
        console.log('🫧 P5.js Blob Emotion Visualizer initialized');
    }
    
    async init(container) {
        console.log('🫧 Initializing P5.js Blob Visualizer...');
        
        try {
            if (!container) {
                throw new Error('Container element is required');
            }
            
            this.container = container;
            
            // Check if P5.js is available
            if (typeof p5 === 'undefined') {
                throw new Error('P5.js library not loaded');
            }
            
            this.setupP5();
            
            console.log('✅ P5.js Blob Visualizer ready');
            return true;
            
        } catch (error) {
            console.error('❌ P5.js Blob Visualizer initialization failed:', error);
            throw error;
        }
    }
    
    setupP5() {
        const self = this;
        
        const sketch = (p) => {
            self.p5Instance = p;
            
            p.setup = () => {
                const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
                canvas.parent(self.container);
                canvas.style('position', 'absolute');
                canvas.style('top', '0');
                canvas.style('left', '0');
                canvas.style('z-index', '1');
                canvas.style('pointer-events', 'auto');
                
                p.colorMode(p.RGB, 255);
                
                // Create background particles
                self.createBackgroundParticles();
                
                console.log('✅ P5.js canvas setup complete');
                console.log('🫧 Blob visualizer ready for blobs');
                
                // Add a test blob after setup
                setTimeout(() => {
                    self.addBlob({
                        id: 'test_blob',
                        category: 'hope',
                        text: 'Test blob for debugging',
                        confidence: 0.8,
                        score: 0.5,
                        speaker_name: 'Test'
                    });
                }, 1000);
            };
            
            p.draw = () => {
                // Dark gradient background
                self.drawBackground();
                
                // Update and draw background particles
                self.updateBackgroundParticles();
                self.drawBackgroundParticles();
                
                // Update blob physics
                self.updateBlobPhysics();
                
                // Draw blobs
                self.drawBlobs();
                
                // Debug: Show blob count on screen
                if (self.blobs.length > 0) {
                    p.fill(255, 255, 255, 200);
                    p.textAlign(p.LEFT, p.TOP);
                    p.textSize(16);
                    p.text(`Blobs: ${self.blobs.length}`, 20, 20);
                }
                
                // Update time
                self.time += 0.016; // ~60fps
            };
            
            p.mousePressed = () => {
                self.handleClick(p.mouseX, p.mouseY);
            };
            
            p.mouseMoved = () => {
                self.updateHover(p.mouseX, p.mouseY);
            };
            
            p.windowResized = () => {
                p.resizeCanvas(window.innerWidth, window.innerHeight);
            };
        };
        
        new p5(sketch);
    }
    
    drawBackground() {
        const p = this.p5Instance;
        
        // Create gradient background
        for (let i = 0; i <= p.height; i++) {
            const inter = p.map(i, 0, p.height, 0, 1);
            const c = p.lerpColor(p.color(10, 10, 30), p.color(5, 5, 15), inter);
            p.stroke(c);
            p.line(0, i, p.width, i);
        }
    }
    
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
    
    getRandomSentimentColor() {
        const colors = Object.values(this.sentimentColors);
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateBackgroundParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = window.innerWidth;
            if (particle.x > window.innerWidth) particle.x = 0;
            if (particle.y < 0) particle.y = window.innerHeight;
            if (particle.y > window.innerHeight) particle.y = 0;
        });
    }
    
    drawBackgroundParticles() {
        const p = this.p5Instance;
        
        this.particles.forEach(particle => {
            p.fill(particle.color[0], particle.color[1], particle.color[2], particle.opacity * 255);
            p.noStroke();
            p.circle(particle.x, particle.y, particle.size);
        });
    }
    
    updateBlobPhysics() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        this.blobs.forEach((blob, index) => {
            // Create orbital motion based on emotion category
            const categoryOffset = this.getCategoryOffset(blob.category);
            const angle = this.time * 0.2 + blob.initialAngle + categoryOffset;
            
            // Vary orbit radius based on confidence and emotion intensity
            const baseRadius = blob.orbitRadius;
            const confidenceRadius = baseRadius * (0.5 + blob.confidence * 0.5);
            const emotionRadius = confidenceRadius + Math.sin(this.time * 0.5 + blob.id) * 30;
            
            // Create elliptical orbits with different eccentricities per category
            const eccentricity = this.getCategoryEccentricity(blob.category);
            blob.x = centerX + Math.cos(angle) * emotionRadius;
            blob.y = centerY + Math.sin(angle) * emotionRadius * eccentricity;
            
            // Add subtle breathing effect
            const breathingScale = 1.0 + Math.sin(this.time * 1.5 + blob.id) * 0.1;
            blob.currentRadius = blob.radius * breathingScale;
        });
    }
    
    getCategoryOffset(category) {
        const offsets = {
            hope: 0,
            sorrow: Math.PI * 0.4,
            transformative: Math.PI * 0.8,
            ambivalent: Math.PI * 1.2,
            reflective_neutral: Math.PI * 1.6
        };
        return offsets[category] || 0;
    }
    
    getCategoryEccentricity(category) {
        const eccentricities = {
            hope: 0.8,
            sorrow: 1.2,
            transformative: 0.6,
            ambivalent: 1.0,
            reflective_neutral: 0.9
        };
        return eccentricities[category] || 1.0;
    }
    
    drawBlobs() {
        const p = this.p5Instance;
        
        // Debug: Log blob count
        if (this.blobs.length > 0 && Math.floor(this.time * 60) % 60 === 0) {
            console.log(`🫧 Drawing ${this.blobs.length} blobs`);
        }
        
        this.blobs.forEach((blob, index) => {
            const color = this.sentimentColors[blob.category] || [255, 255, 255];
            
            // Debug: Log first blob position occasionally
            if (index === 0 && Math.floor(this.time * 60) % 120 === 0) {
                console.log(`🫧 Drawing blob ${index}: pos(${Math.round(blob.x)}, ${Math.round(blob.y)}), radius: ${Math.round(blob.currentRadius)}, color: [${color.join(',')}]`);
            }
            
            // Draw blob glow
            p.fill(color[0], color[1], color[2], 60); // Increased from 30
            p.noStroke();
            p.circle(blob.x, blob.y, blob.currentRadius * 2.5);
            
            // Draw blob core with organic shape
            p.fill(color[0], color[1], color[2], 255); // Increased from 200
            
            // Create organic blob shape
            p.beginShape();
            const numPoints = 8;
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const noise = Math.sin(this.time * 2 + blob.id + i) * 0.1 + 1;
                const radius = blob.currentRadius * noise;
                const x = blob.x + Math.cos(angle) * radius;
                const y = blob.y + Math.sin(angle) * radius;
                p.vertex(x, y);
            }
            p.endShape(p.CLOSE);
            
            // Draw selection indicator
            if (index === this.selectedBlobIndex) {
                p.stroke(255, 255, 255, 200);
                p.strokeWeight(3);
                p.noFill();
                p.circle(blob.x, blob.y, blob.currentRadius + 15);
                
                // Pulsing effect
                const pulse = Math.sin(this.time * 4) * 0.5 + 0.5;
                p.stroke(255, 255, 255, pulse * 100);
                p.strokeWeight(1);
                p.circle(blob.x, blob.y, blob.currentRadius + 25);
            }
            
            // Draw hover effect
            if (this.hoveredBlob === blob) {
                p.stroke(255, 255, 255, 100);
                p.strokeWeight(2);
                p.noFill();
                p.circle(blob.x, blob.y, blob.currentRadius + 10);
            }
        });
    }
    
    handleClick(x, y) {
        const clickedBlob = this.getBlobAt(x, y);
        
        if (clickedBlob) {
            const blobIndex = this.blobs.indexOf(clickedBlob);
            this.selectedBlobIndex = blobIndex;
            this.showBlobTooltip(clickedBlob, x, y);
            
            // Add visual feedback
            clickedBlob.currentRadius *= 1.2;
            setTimeout(() => {
                if (clickedBlob) {
                    clickedBlob.currentRadius = clickedBlob.radius;
                }
            }, 200);
            
            console.log('🎯 Blob clicked:', clickedBlob.category);
        } else {
            this.selectedBlobIndex = -1;
            this.hideTooltip();
        }
    }
    
    updateHover(x, y) {
        this.hoveredBlob = this.getBlobAt(x, y);
    }
    
    getBlobAt(x, y) {
        // Find blob at coordinates (reverse order to get topmost)
        for (let i = this.blobs.length - 1; i >= 0; i--) {
            const blob = this.blobs[i];
            const distance = Math.sqrt((x - blob.x) ** 2 + (y - blob.y) ** 2);
            if (distance <= blob.currentRadius) {
                return blob;
            }
        }
        return null;
    }
    
    showBlobTooltip(blob, x, y) {
        this.hideTooltip();
        
        // Create new tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'blob-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(21, 21, 21, 0.95);
            color: white;
            padding: 16px;
            border-radius: 12px;
            font-size: 14px;
            max-width: 300px;
            z-index: 2000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            left: ${Math.min(x + 10, window.innerWidth - 320)}px;
            top: ${Math.max(y - 10, 10)}px;
            opacity: 0;
            transform: scale(0.8) translateY(10px);
            transition: all 0.3s ease;
        `;
        
        const category = blob.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const confidence = Math.round((blob.confidence || 0.5) * 100);
        
        tooltip.innerHTML = `
            <div class="tooltip-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div class="tooltip-category ${blob.category}" style="display: flex; align-items: center; gap: 8px;">
                    <div class="category-dot" style="width: 12px; height: 12px; border-radius: 50%; background: rgb(${this.sentimentColors[blob.category].join(',')});"></div>
                    <span style="font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">${category}</span>
                </div>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; width: 20px; height: 20px;">×</button>
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Confidence:</strong> ${confidence}%
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Message:</strong><br>
                <em style="color: rgba(255, 255, 255, 0.8); line-height: 1.4;">"${blob.text.substring(0, 150)}${blob.text.length > 150 ? '...' : ''}"</em>
            </div>
            ${blob.speaker_name ? `<div style="margin-top: 12px; font-size: 12px; opacity: 0.7;">— ${blob.speaker_name}</div>` : ''}
        `;
        
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
        this.tooltipVisible = true;
        
        // Animate tooltip entrance
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'scale(1) translateY(0)';
        }, 10);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.tooltipVisible && this.currentTooltip === tooltip) {
                this.hideTooltip();
            }
        }, 5000);
    }
    
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
        
        // Clear any existing tooltips
        document.querySelectorAll('.blob-tooltip').forEach(tooltip => {
            tooltip.remove();
        });
        
        this.tooltipVisible = false;
    }
    
    addBlob(blobData) {
        console.log('🫧 Adding floating blob:', blobData.category);
        
        // Calculate positioning based on category and existing blobs
        const categoryCount = this.blobs.filter(b => b.category === blobData.category).length;
        const categoryOffset = this.getCategoryOffset(blobData.category);
        
        const blob = {
            id: blobData.id || `blob_${this.blobIdCounter++}`,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            radius: this.calculateBlobSize(blobData),
            currentRadius: this.calculateBlobSize(blobData),
            
            // Orbital motion properties
            orbitRadius: this.calculateOrbitRadius(blobData, categoryCount),
            initialAngle: categoryOffset + (categoryCount * Math.PI * 0.3) + Math.random() * Math.PI * 0.2,
            
            // Data properties
            category: blobData.category || 'reflective_neutral',
            score: blobData.score || 0,
            confidence: blobData.confidence || 0.5,
            intensity: blobData.intensity || Math.abs(blobData.score || 0),
            label: blobData.label || 'neutral',
            text: blobData.text || '',
            speaker_name: blobData.speaker_name || '',
            created_at: blobData.created_at || new Date().toISOString()
        };
        
        this.blobs.push(blob);
        
        // Remove oldest if too many
        if (this.blobs.length > this.maxBlobs) {
            this.blobs.shift();
        }
        
        console.log(`🫧 Floating blob created: ${blob.category} (${this.blobs.length} total)`, blob);
        console.log(`🫧 Blob position: (${blob.x}, ${blob.y}), radius: ${blob.radius}`);
        return blob;
    }
    
    calculateOrbitRadius(blobData, categoryCount) {
        const baseRadius = 120;
        const categorySpread = 80;
        const confidenceRadius = (blobData.confidence || 0.5) * 60;
        const countOffset = categoryCount * 15;
        
        return baseRadius + categorySpread + confidenceRadius + countOffset + (Math.random() * 40 - 20);
    }
    
    calculateBlobSize(blobData) {
        const confidence = (typeof blobData.confidence === 'number') ? blobData.confidence : 0.5;
        const score = (typeof blobData.score === 'number') ? blobData.score : 0;
        
        const baseSize = 40; // Increased from 25
        const confidenceMultiplier = confidence * 30; // Increased from 25
        const intensityMultiplier = Math.abs(score) * 25; // Increased from 20
        
        return Math.max(25, Math.min(80, baseSize + confidenceMultiplier + intensityMultiplier)); // Increased min/max
    }
    
    clearAllBlobs() {
        this.blobs = [];
        this.selectedBlobIndex = -1;
        this.hoveredBlob = null;
        this.hideTooltip();
        console.log('🧹 Cleared all floating blobs');
    }
    
    getBlobCount() {
        return this.blobs.length;
    }
    
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
    
    // Cleanup method
    destroy() {
        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
        }
        this.hideTooltip();
        console.log('🫧 P5.js Blob Visualizer destroyed');
    }
}

// Make available globally
window.BlobEmotionVisualizer = BlobEmotionVisualizer; 