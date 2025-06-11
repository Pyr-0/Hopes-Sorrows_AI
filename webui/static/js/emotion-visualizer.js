/**
 * Enhanced Organic Blob Emotion Visualizer
 * Inspired by https://medium.com/creative-coding-space/meet-blobby-in-p5-js-5d9d99232400
 * Features: Organic blobs, fluid dynamics, background particles, anime.js animations
 */

class EmotionVisualizer {
    constructor() {
        this.canvas = null;
        this.p = null; // P5.js instance
        this.blobs = [];
        this.particles = [];
        this.ripples = [];
        this.time = 0;
        this.change = 0; // For organic animation
        
        // Blob management
        this.maxBlobs = 80; // Increased to match database
        this.blobIdCounter = 0;
        
        // Physics settings
        this.gravity = 0.1;
        this.friction = 0.98;
        this.repulsion = 50;
        
        // Visual settings
        this.showDebugInfo = false;
        
        // Current active tooltip
        this.activeTooltip = null;
        this.lastClickedBlob = null;
        this.tooltipHideTimer = null; // Timer for auto-hiding tooltips
        
        this.initializeColorPalettes();
    }
    
    initializeColorPalettes() {
        // Enhanced color palettes with anime.js compatible colors
        this.colorPalettes = {
            hope: {
                colors: [
                    { r: 255, g: 215, b: 0, a: 0.8 },   // Gold
                    { r: 255, g: 165, b: 0, a: 0.7 },   // Orange
                    { r: 255, g: 255, b: 102, a: 0.6 }, // Light yellow
                    { r: 255, g: 140, b: 0, a: 0.9 },   // Dark orange
                    { r: 255, g: 193, b: 7, a: 0.8 }    // Amber
                ],
                particleColor: [255, 215, 0, 30]
            },
            sorrow: {
                colors: [
                    { r: 74, g: 144, b: 226, a: 0.8 },  // Blue
                    { r: 30, g: 144, b: 255, a: 0.7 },  // Dodger blue
                    { r: 135, g: 206, b: 250, a: 0.6 }, // Light sky blue
                    { r: 25, g: 25, b: 112, a: 0.9 },   // Midnight blue
                    { r: 100, g: 149, b: 237, a: 0.8 }  // Cornflower blue
                ],
                particleColor: [74, 144, 226, 30]
            },
            transformative: {
                colors: [
                    { r: 155, g: 89, b: 182, a: 0.8 },  // Purple
                    { r: 142, g: 68, b: 173, a: 0.7 },  // Dark orchid
                    { r: 186, g: 85, b: 211, a: 0.6 },  // Medium orchid
                    { r: 75, g: 0, b: 130, a: 0.9 },    // Indigo
                    { r: 138, g: 43, b: 226, a: 0.8 }   // Blue violet
                ],
                particleColor: [155, 89, 182, 30]
            },
            ambivalent: {
                colors: [
                    { r: 231, g: 76, b: 60, a: 0.8 },   // Red
                    { r: 192, g: 57, b: 43, a: 0.7 },   // Dark red
                    { r: 255, g: 99, b: 71, a: 0.6 },   // Tomato
                    { r: 139, g: 0, b: 0, a: 0.9 },     // Dark red
                    { r: 220, g: 20, b: 60, a: 0.8 }    // Crimson
                ],
                particleColor: [231, 76, 60, 30]
            },
            reflective_neutral: {
                colors: [
                    { r: 149, g: 165, b: 166, a: 0.8 }, // Gray
                    { r: 127, g: 140, b: 141, a: 0.7 }, // Dark gray
                    { r: 189, g: 195, b: 199, a: 0.6 }, // Light gray
                    { r: 52, g: 73, b: 94, a: 0.9 },    // Dark slate gray
                    { r: 176, g: 196, b: 222, a: 0.8 }  // Light steel blue
                ],
                particleColor: [149, 165, 166, 30]
            }
        };
    }
    
    initializeCanvas() {
        const container = document.getElementById('visualization-container');
        if (!container) {
            console.error('Visualization container not found');
            return false;
        }
        
        this.setupP5();
        return true;
    }
    
    setupP5() {
        const self = this;
        
        const sketch = (p) => {
            self.p = p;
            
            p.setup = () => {
                // Create canvas
                const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
                canvas.parent('visualization-container');
                
                // Set drawing settings
                p.colorMode(p.RGB, 255, 255, 255, 1);
                
                console.log('🎨 Enhanced organic blob visualizer initialized:', p.width, 'x', p.height);
                
                // Initialize animation variables
                self.change = 0;
                self.time = 0;
                
                // Create ethereal background particles
                self.createBackgroundParticles();
                
                // Add test blob after 1 second
                setTimeout(() => {
                    self.addTestBlob();
                }, 1000);
            };
            
            p.draw = () => {
                self.drawFrame();
            };
            
            p.windowResized = () => {
                p.resizeCanvas(window.innerWidth, window.innerHeight);
                self.createBackgroundParticles(); // Recreate particles for new size
                console.log('🔄 Canvas resized:', p.width, 'x', p.height);
            };
            
            p.mousePressed = () => {
                // FIXED: Only handle clicks in the visualization area and not on UI elements
                const clickedOnUI = self.isClickOnUIElement(p.mouseX, p.mouseY);
                
                if (!clickedOnUI && p.mouseY > 70) { // Avoid navigation area
                    self.handleInteraction(p.mouseX, p.mouseY);
                    return false; // Prevent default behavior
                }
                
                // If clicked on UI, don't handle the interaction
                return true; // Allow default behavior for UI elements
            };
        };
        
        new p5(sketch);
    }
    
    isClickOnUIElement(x, y) {
        // Check if click is on any UI element
        const elementsAtPoint = document.elementsFromPoint(x, y);
        
        for (let element of elementsAtPoint) {
            // Check for specific UI elements that should block blob interactions
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
     * BACKGROUND PARTICLES CREATION - MODIFY HERE FOR FUTURE CHANGES
     * 
     * This function creates the ethereal background particles that give the deep space feel.
     * 
     * Key parameters to modify:
     * - numParticles: Number of particles (currently 80 for performance)
     * - size range: particle.size = Math.random() * 1.5 + 0.5 (0.5 to 2.0 pixels)
     * - alpha range: particle.alpha = Math.random() * 0.2 + 0.1 (0.1 to 0.3 opacity)
     * - velocity range: vx/vy = (Math.random() - 0.5) * 0.3 (-0.15 to 0.15 pixels/frame)
     * - life span: particle.life = Math.random() * 500 + 250 (250 to 750 frames)
     * 
     * To make particles more/less visible:
     * - Increase/decrease alpha values
     * - Increase/decrease size values
     * - Increase/decrease numParticles
     * 
     * To make particles move faster/slower:
     * - Increase/decrease velocity multiplier (currently 0.3)
     * - Modify noise influence in updateBackgroundParticles()
     */
    createBackgroundParticles() {
        this.particles = [];
        const numParticles = 80; // Reduced number for better performance - MODIFY THIS for more/fewer particles
        
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                x: Math.random() * this.p.width,
                y: Math.random() * this.p.height,
                vx: (Math.random() - 0.5) * 0.3, // MODIFY THIS for faster/slower movement
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 1.5 + 0.5, // MODIFY THIS for larger/smaller particles (0.5-2.0)
                alpha: Math.random() * 0.2 + 0.1, // MODIFY THIS for more/less visible particles (0.1-0.3)
                life: Math.random() * 500 + 250, // MODIFY THIS for longer/shorter particle life
                maxLife: 500,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        console.log(`✨ Created ${numParticles} background particles for ethereal effect`);
    }
    
    drawFrame() {
        if (!this.p) return;
        
        // FIXED: Properly clear background to prevent trails
        // This solid background clear prevents particle trails and oversaturation
        this.p.background(21, 21, 21); // Dark space background - MODIFY HERE for different background color
        
        // Update animation time
        this.change += 0.01;
        this.time += 0.02;
        
        // Update and draw background particles
        this.updateBackgroundParticles();
        this.drawBackgroundParticles();
        
        // Apply physics to blobs
        this.updateBlobPhysics();
        
        // Draw all blobs - FIXED: Ensure blobs are actually drawn
        this.drawBlobs();
        
        // Draw temporary ripples
        this.drawRipples();
        
        // Clean up old ripples
        this.cleanupRipples();
        
        // Debug info (only if enabled)
        if (this.showDebugInfo) {
            this.drawDebugInfo();
        }
    }
    
    updateBackgroundParticles() {
        for (let particle of this.particles) {
            // Gentle floating movement
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Add subtle noise-based movement for organic feel
            particle.vx += (this.p.noise(particle.x * 0.01, particle.y * 0.01, this.time) - 0.5) * 0.01;
            particle.vy += (this.p.noise(particle.x * 0.01 + 100, particle.y * 0.01 + 100, this.time) - 0.5) * 0.01;
            
            // Apply gentle friction
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            // Wrap around boundaries
            if (particle.x < 0) particle.x = this.p.width;
            if (particle.x > this.p.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.p.height;
            if (particle.y > this.p.height) particle.y = 0;
            
            // Update twinkle effect
            particle.twinkle += 0.03;
            
            // Update life
            particle.life--;
            if (particle.life <= 0) {
                particle.x = Math.random() * this.p.width;
                particle.y = Math.random() * this.p.height;
                particle.life = particle.maxLife;
            }
        }
    }
    
    drawBackgroundParticles() {
        const p = this.p;
        
        for (let particle of this.particles) {
            // Twinkling effect
            const twinkleAlpha = particle.alpha * (0.5 + 0.5 * Math.sin(particle.twinkle));
            
            p.fill(255, 255, 255, twinkleAlpha);
            p.noStroke();
            p.ellipse(particle.x, particle.y, particle.size, particle.size);
        }
    }
    
    updateBlobPhysics() {
        // Apply physics to each blob
        for (let i = 0; i < this.blobs.length; i++) {
            const blob = this.blobs[i];
            
            // Apply gravity towards center with some randomness
            const centerX = this.p.width / 2;
            const centerY = this.p.height / 2;
            const distToCenter = Math.sqrt((blob.x - centerX) ** 2 + (blob.y - centerY) ** 2);
            
            if (distToCenter > 100) {
                const gravityForce = this.gravity * 0.05;
                blob.vx += (centerX - blob.x) * gravityForce / distToCenter;
                blob.vy += (centerY - blob.y) * gravityForce / distToCenter;
            }
            
            // Apply repulsion between blobs
            for (let j = i + 1; j < this.blobs.length; j++) {
                const other = this.blobs[j];
                const dx = blob.x - other.x;
                const dy = blob.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = blob.radius + other.radius + 15;
                
                if (distance < minDistance && distance > 0) {
                    const force = (minDistance - distance) * 0.005;
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;
                    
                    blob.vx += fx;
                    blob.vy += fy;
                    other.vx -= fx;
                    other.vy -= fy;
                }
            }
            
            // Add some organic floating movement
            blob.vx += (this.p.noise(blob.x * 0.01, blob.y * 0.01, this.time) - 0.5) * 0.05;
            blob.vy += (this.p.noise(blob.x * 0.01 + 100, blob.y * 0.01 + 100, this.time) - 0.5) * 0.05;
            
            // Apply friction
            blob.vx *= this.friction;
            blob.vy *= this.friction;
            
            // Update position
            blob.x += blob.vx;
            blob.y += blob.vy;
            
            // Bounce off boundaries
            if (blob.x - blob.radius < 0 || blob.x + blob.radius > this.p.width) {
                blob.vx *= -0.8;
                blob.x = Math.max(blob.radius, Math.min(this.p.width - blob.radius, blob.x));
            }
            if (blob.y - blob.radius < 70 || blob.y + blob.radius > this.p.height) {
                blob.vy *= -0.8;
                blob.y = Math.max(70 + blob.radius, Math.min(this.p.height - blob.radius, blob.y));
            }
            
            // Update organic animation
            blob.angle += blob.rotationSpeed;
        }
    }
    
    drawBlobs() {
        // FIXED: Ensure blobs are actually drawn
        if (!this.blobs || this.blobs.length === 0) {
            console.log('🫧 No blobs to draw');
            return;
        }
        
        console.log(`🎨 Drawing ${this.blobs.length} blobs`);
        
        for (let blob of this.blobs) {
            this.drawOrganicBlob(blob);
        }
    }
    
    drawOrganicBlob(blob) {
        if (!this.p || !blob) {
            console.warn('⚠️ Cannot draw blob - missing p5 instance or blob data');
            return;
        }
        
        const p = this.p;
        const palette = this.colorPalettes[blob.category];
        if (!palette) {
            console.warn(`⚠️ No color palette for category: ${blob.category}`);
            return;
        }
        
        // Get color for this blob
        const colorIndex = Math.floor(blob.colorSeed * palette.colors.length);
        const color = palette.colors[colorIndex];
        
        // Add breathing effect
        const breathingScale = 1 + Math.sin(this.time * 2 + blob.id * 0.5) * 0.05;
        const currentRadius = blob.radius * breathingScale;
        
        // Set fill color with proper alpha
        p.fill(color.r, color.g, color.b, color.a * 255); // P5.js uses 0-255 for alpha
        p.noStroke();
        
        // Save transformation state
        p.push();
        
        // Move to blob position
        p.translate(blob.x, blob.y);
        
        // Rotate the blob for more organic feel
        p.rotate(blob.angle + this.change);
        
        // Begin organic shape
        p.beginShape();
        
        // Create organic blob using noise and vertices (like the article)
        let off = blob.noiseOffset;
        for (let i = 0; i < p.TWO_PI; i += 0.1) {
            // Use Perlin noise to create organic distortion
            let offset = p.map(p.noise(off, this.change), 0, 1, -blob.roughness, blob.roughness);
            let r = currentRadius + offset;
            let x = r * p.cos(i);
            let y = r * p.sin(i);
            p.vertex(x, y);
            off += 0.1;
        }
        
        p.endShape(p.CLOSE);
        
        // Add inner glow effect
        p.fill(color.r, color.g, color.b, color.a * 0.2 * 255);
        p.beginShape();
        off = blob.noiseOffset;
        for (let i = 0; i < p.TWO_PI; i += 0.2) {
            let offset = p.map(p.noise(off, this.change), 0, 1, -blob.roughness * 0.5, blob.roughness * 0.5);
            let r = currentRadius * 0.6 + offset;
            let x = r * p.cos(i);
            let y = r * p.sin(i);
            p.vertex(x, y);
            off += 0.1;
        }
        p.endShape(p.CLOSE);
        
        // Restore transformation state
        p.pop();
        
        console.log(`🎨 Drew blob ${blob.id} at (${Math.round(blob.x)}, ${Math.round(blob.y)}) with radius ${Math.round(currentRadius)}`);
    }
    
    handleInteraction(x, y) {
        console.log('🎯 Interaction at:', x, y);
        
        // Check if we clicked on a blob
        const clickedBlob = this.getBlobAt(x, y);
        
        // Remove existing tooltip if clicking elsewhere or same blob
        if (this.activeTooltip) {
            this.hideTooltip();
        }
        
        if (clickedBlob) {
            console.log('🫧 Clicked blob:', clickedBlob.category);
            
            // If clicking the same blob again, just close tooltip
            if (this.lastClickedBlob && this.lastClickedBlob.id === clickedBlob.id) {
                this.lastClickedBlob = null;
                return;
            }
            
            this.lastClickedBlob = clickedBlob;
            
            // Show blob details
            this.showBlobDetails(clickedBlob, x, y);
            
            // Add physics impulse to clicked blob
            const impulseStrength = 3;
            clickedBlob.vx += (Math.random() - 0.5) * impulseStrength;
            clickedBlob.vy += (Math.random() - 0.5) * impulseStrength;
        } else {
            this.lastClickedBlob = null;
        }
        
        // Create temporary ripple effect
        this.createRippleEffect(x, y);
    }
    
    showBlobDetails(blob, x, y) {
        // Create a single tooltip that replaces any existing one
        const tooltip = document.createElement('div');
        tooltip.className = 'blob-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${Math.min(x + 10, window.innerWidth - 320)}px`;
        tooltip.style.top = `${Math.max(y - 10, 10)}px`;
        tooltip.style.background = 'rgba(21, 21, 21, 0.95)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '16px';
        tooltip.style.borderRadius = '12px';
        tooltip.style.fontSize = '14px';
        tooltip.style.maxWidth = '300px';
        tooltip.style.zIndex = '2000';
        tooltip.style.pointerEvents = 'auto';
        tooltip.style.backdropFilter = 'blur(10px)';
        tooltip.style.border = '1px solid rgba(255, 215, 0, 0.3)';
        tooltip.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
        
        const category = blob.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const confidence = Math.round((blob.confidence || 0.5) * 100);
        
        tooltip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 12px; color: #FFD700; font-size: 16px;">
                ${category}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Speaker:</strong> ${blob.speaker || 'Unknown'}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Confidence:</strong> ${confidence}%
            </div>
            <div style="margin-bottom: 12px;">
                <strong>Message:</strong><br>
                <em style="color: rgba(255, 255, 255, 0.8);">"${blob.text ? blob.text.substring(0, 150) + (blob.text.length > 150 ? '...' : '') : 'No text available'}"</em>
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 8px;">
                Shared ${new Date(blob.created_at).toLocaleString()}
            </div>
            <button onclick="window.app.visualizer.hideTooltip()" 
                    style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: rgba(255, 255, 255, 0.6); font-size: 18px; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
        `;
        
        document.body.appendChild(tooltip);
        this.activeTooltip = tooltip;
        
        // Set up auto-hide functionality
        this.setupTooltipAutoHide(tooltip);
        
        // Animate tooltip entrance with anime.js
        if (window.anime) {
            window.anime({
                targets: tooltip,
                opacity: [0, 1],
                scale: [0.8, 1],
                duration: 300,
                easing: 'easeOutCubic'
            });
        }
    }
    
    setupTooltipAutoHide(tooltip) {
        // Clear any existing timer
        if (this.tooltipHideTimer) {
            clearTimeout(this.tooltipHideTimer);
        }
        
        // Set up mouse enter/leave events for auto-hide
        const startHideTimer = () => {
            this.tooltipHideTimer = setTimeout(() => {
                this.hideTooltip();
            }, 3000); // Hide after 3 seconds of no interaction
        };
        
        const cancelHideTimer = () => {
            if (this.tooltipHideTimer) {
                clearTimeout(this.tooltipHideTimer);
                this.tooltipHideTimer = null;
            }
        };
        
        // Start the timer immediately
        startHideTimer();
        
        // Cancel timer when mouse enters tooltip
        tooltip.addEventListener('mouseenter', cancelHideTimer);
        
        // Restart timer when mouse leaves tooltip
        tooltip.addEventListener('mouseleave', startHideTimer);
        
        console.log('🕐 Tooltip auto-hide timer set for 3 seconds');
    }
    
    hideTooltip() {
        if (this.activeTooltip) {
            // Clear any hide timer
            if (this.tooltipHideTimer) {
                clearTimeout(this.tooltipHideTimer);
                this.tooltipHideTimer = null;
            }
            
            // Animate out and remove
            if (window.anime) {
                window.anime({
                    targets: this.activeTooltip,
                    opacity: [1, 0],
                    scale: [1, 0.8],
                    duration: 200,
                    easing: 'easeInCubic',
                    complete: () => {
                        if (this.activeTooltip) {
                            this.activeTooltip.remove();
                            this.activeTooltip = null;
                        }
                    }
                });
            } else {
                this.activeTooltip.remove();
                this.activeTooltip = null;
            }
            
            this.lastClickedBlob = null;
            console.log('🫥 Tooltip hidden');
        }
    }
    
    createRippleEffect(x, y) {
        // Create a temporary ripple that fades out
        const ripple = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 100,
            opacity: 1,
            createdAt: Date.now(),
            duration: 800 // Shorter duration
        };
        
        this.ripples.push(ripple);
        console.log('💫 Created temporary ripple at:', x, y);
    }
    
    drawRipples() {
        if (!this.p) return;
        
        const p = this.p;
        const currentTime = Date.now();
        
        for (let ripple of this.ripples) {
            const elapsed = currentTime - ripple.createdAt;
            const progress = elapsed / ripple.duration;
            
            if (progress < 1) {
                // Calculate ripple properties with easing
                const easeOut = 1 - Math.pow(1 - progress, 3);
                ripple.radius = easeOut * ripple.maxRadius;
                ripple.opacity = 1 - progress; // Fade out
                
                // Draw multiple ripple rings
                p.noFill();
                
                // Outer ripple
                p.stroke(255, 215, 0, ripple.opacity * 0.4 * 255);
                p.strokeWeight(2);
                p.circle(ripple.x, ripple.y, ripple.radius * 2);
                
                // Inner ripple
                p.stroke(255, 255, 102, ripple.opacity * 0.6 * 255);
                p.strokeWeight(1);
                p.circle(ripple.x, ripple.y, ripple.radius);
            }
        }
    }
    
    cleanupRipples() {
        const currentTime = Date.now();
        const initialLength = this.ripples.length;
        
        this.ripples = this.ripples.filter(ripple => {
            const elapsed = currentTime - ripple.createdAt;
            return elapsed < ripple.duration;
        });
        
        // Log cleanup if ripples were removed
        if (this.ripples.length < initialLength) {
            console.log(`🧹 Cleaned up ${initialLength - this.ripples.length} expired ripples`);
        }
    }
    
    addBlob(blobData) {
        console.log('🫧 Adding enhanced organic blob:', blobData.category, 'with data:', {
            confidence: blobData.confidence,
            score: blobData.score,
            confidenceType: typeof blobData.confidence,
            scoreType: typeof blobData.score
        });
        
        if (!this.p) {
            console.warn('⚠️ P5.js not ready, queuing blob');
            setTimeout(() => this.addBlob(blobData), 100);
            return;
        }
        
        // Calculate size and roughness with proper validation
        const calculatedRadius = this.calculateBlobSize(blobData);
        const calculatedRoughness = this.calculateRoughness(blobData);
        
        console.log('📏 Calculated blob properties:', {
            radius: calculatedRadius,
            roughness: calculatedRoughness,
            isRadiusValid: !isNaN(calculatedRadius),
            isRoughnessValid: !isNaN(calculatedRoughness)
        });
        
        // Create enhanced organic blob object with physics
        const blob = {
            id: blobData.id || `blob_${this.blobIdCounter++}`,
            x: Math.random() * (this.p.width - 200) + 100,
            y: Math.random() * (this.p.height - 200) + 150,
            vx: (Math.random() - 0.5) * 1, // Reduced initial velocity
            vy: (Math.random() - 0.5) * 1,
            radius: calculatedRadius,
            roughness: calculatedRoughness,
            angle: Math.random() * this.p.TWO_PI,
            rotationSpeed: (Math.random() - 0.5) * 0.01,
            noiseOffset: Math.random() * 1000,
            colorSeed: Math.random(),
            
            // Data from analysis - with proper fallbacks
            category: blobData.category || 'reflective_neutral',
            speaker: blobData.speaker_name || blobData.speaker || 'Unknown',
            text: blobData.text || '',
            confidence: (typeof blobData.confidence === 'number' && !isNaN(blobData.confidence)) ? blobData.confidence : 0.5,
            score: (typeof blobData.score === 'number' && !isNaN(blobData.score)) ? blobData.score : 0,
            created_at: blobData.created_at || new Date().toISOString()
        };
        
        // Final validation check
        if (isNaN(blob.radius) || isNaN(blob.roughness)) {
            console.error('❌ Invalid blob properties detected:', {
                radius: blob.radius,
                roughness: blob.roughness,
                originalData: blobData
            });
            // Set safe fallback values
            blob.radius = 35;
            blob.roughness = 6;
        }
        
        // Add to blobs array
        this.blobs.push(blob);
        
        // Remove oldest blob if we have too many
        if (this.blobs.length > this.maxBlobs) {
            this.removeOldestBlob();
        }
        
        // Animate blob entrance with anime.js
        if (window.anime) {
            const originalRadius = blob.radius;
            blob.radius = 0; // Start small
            window.anime({
                targets: blob,
                radius: originalRadius,
                duration: 600,
                easing: 'easeOutElastic(1, .6)'
            });
        }
        
        console.log(`🎨 Enhanced organic blob created: ${blob.category} at (${Math.round(blob.x)}, ${Math.round(blob.y)}) with radius ${Math.round(blob.radius)}`);
    }
    
    calculateBlobSize(blobData) {
        // Ensure we have valid numeric values, with fallbacks
        const confidence = (typeof blobData.confidence === 'number' && !isNaN(blobData.confidence)) ? blobData.confidence : 0.5;
        const score = (typeof blobData.score === 'number' && !isNaN(blobData.score)) ? blobData.score : 0;
        
        // Base size between 25-60 pixels
        const baseSize = 30;
        const confidenceMultiplier = confidence * 25;
        const intensityMultiplier = Math.abs(score) * 20;
        
        const calculatedSize = Math.max(25, Math.min(60, baseSize + confidenceMultiplier + intensityMultiplier));
        
        // Final safety check to ensure we never return NaN
        return isNaN(calculatedSize) ? 35 : calculatedSize;
    }
    
    calculateRoughness(blobData) {
        // Ensure we have valid numeric values, with fallbacks
        const score = (typeof blobData.score === 'number' && !isNaN(blobData.score)) ? blobData.score : 0;
        
        // Roughness based on emotion intensity
        const baseRoughness = 6;
        const intensityMultiplier = Math.abs(score) * 8;
        
        const calculatedRoughness = baseRoughness + intensityMultiplier;
        
        // Final safety check to ensure we never return NaN
        return isNaN(calculatedRoughness) ? 6 : calculatedRoughness;
    }
    
    getBlobAt(x, y) {
        // Check if point is inside any blob (check from front to back)
        for (let i = this.blobs.length - 1; i >= 0; i--) {
            const blob = this.blobs[i];
            const distance = Math.sqrt((x - blob.x) ** 2 + (y - blob.y) ** 2);
            if (distance <= blob.radius) {
                return blob;
            }
        }
        return null;
    }
    
    removeBlob(blobId) {
        this.blobs = this.blobs.filter(blob => blob.id !== blobId);
        console.log('🗑️ Removed blob:', blobId);
    }
    
    removeOldestBlob() {
        if (this.blobs.length > 0) {
            const removed = this.blobs.shift();
            console.log('🗑️ Removed oldest blob:', removed.id);
        }
    }
    
    clearAllBlobs() {
        this.blobs = [];
        this.ripples = [];
        this.hideTooltip(); // Hide any active tooltip
        this.lastClickedBlob = null;
        console.log('🧹 Cleared all blobs and ripples');
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
        
        for (let blob of this.blobs) {
            if (counts.hasOwnProperty(blob.category)) {
                counts[blob.category]++;
            }
        }
        
        return counts;
    }
    
    drawDebugInfo() {
        if (!this.p) return;
        
        const p = this.p;
        
        // Debug text
        p.fill(255, 255, 255, 0.8 * 255);
        p.noStroke();
        p.textSize(14);
        p.textAlign(p.LEFT, p.TOP);
        
        const debugText = [
            `Blobs: ${this.blobs.length}`,
            `Particles: ${this.particles.length}`,
            `Ripples: ${this.ripples.length}`,
            `Change: ${this.change.toFixed(3)}`,
            `Canvas: ${p.width}x${p.height}`
        ];
        
        for (let i = 0; i < debugText.length; i++) {
            p.text(debugText[i], 10, 80 + i * 20);
        }
    }
    
    addTestBlob() {
        console.log('🧪 Adding test blob for verification');
        
        const testBlob = {
            id: 'test_blob_' + Date.now(),
            speaker_name: 'Test Speaker',
            speaker_id: 'test_speaker',
            text: 'This is a test blob to verify the enhanced organic visualization with physics is working correctly.',
            category: 'hope',
            score: 0.7,
            confidence: 0.8,
            intensity: 0.6,
            label: 'positive',
            explanation: 'Test blob for enhanced organic visualization verification',
            created_at: new Date().toISOString()
        };
        
        this.addBlob(testBlob);
    }
}

// Make EmotionVisualizer available globally
window.EmotionVisualizer = EmotionVisualizer; 