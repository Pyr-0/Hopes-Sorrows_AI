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
        
        // Sentiment color palettes (updated with provided color scheme)
        this.sentimentColors = {
            hope: [1.0, 0.85, 0.24],              // #FFD93D (warm yellow)
            sorrow: [0.42, 0.45, 1.0],            // #6B73FF (soft blue)
            transformative: [1.0, 0.58, 0.0],     // #FF9500 (orange)
            ambivalent: [0.8, 0.55, 0.86],        // #CC8B86 (muted rose - better for ambivalence)
            reflective_neutral: [0.58, 0.65, 0.65] // #95A5A6 (gray)
        };
        
        // Background particles for ethereal effect
        this.particles = [];
        this.numParticles = 150;
        
        // Physics simulation properties - Ultra calm settings
        this.gravity = 0.002;  // Further reduced from 0.005
        this.friction = 0.998; // Increased friction for more damping
        this.repulsionForce = 0.1; // Further reduced from 0.2
        this.attractionForce = 0.02; // Further reduced from 0.05
        this.collisionDamping = 0.3; // New: reduce collision bounce
        
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
                background: transparent;
            `;
            this.container.appendChild(p5Container);
        }
        
        const sketch = (p) => {
            self.p5Instance = p;
            
            p.setup = () => {
                const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
                canvas.parent('p5-blob-container');
                canvas.style('pointer-events', 'auto');
                canvas.style('background', 'transparent');
                canvas.style('position', 'absolute');
                canvas.style('top', '0');
                canvas.style('left', '0');
                canvas.style('z-index', '2');
                
                p.colorMode(p.RGB, 255);
                console.log('✅ P5.js blob canvas setup complete');
                console.log('🎯 Canvas size:', window.innerWidth, 'x', window.innerHeight);
            };
            
            p.draw = () => {
                // Clear canvas with transparent background
                p.clear();
                
                // Update and draw all elements
                self.updateBlobPhysics();
                self.drawBackgroundParticles();
                self.drawBlobs();
                self.drawRipples();
                self.cleanupRipples();
                self.drawUI();
            };
            
            p.mousePressed = () => {
                // Get the actual screen coordinates
                const rect = p.canvas.getBoundingClientRect();
                const screenX = p.mouseX + rect.left;
                const screenY = p.mouseY + rect.top;
                
                console.log('🎯 Mouse pressed at canvas coords:', p.mouseX, p.mouseY);
                console.log('🎯 Screen coords:', screenX, screenY);
                console.log('🎯 Canvas rect:', rect);
                console.log('🎯 Available blobs:', self.blobs.length);
                
                // Use canvas coordinates directly for blob detection
                if (!self.isClickOnUIElement(screenX, screenY)) {
                    self.handleInteraction(p.mouseX, p.mouseY);
                } else {
                    console.log('🚫 Click blocked by UI element');
                }
                
                // Always create subtle ripple and nudge nearby blobs on canvas click
                self.createCanvasRipple(p.mouseX, p.mouseY);
                self.nudgeNearbyBlobs(p.mouseX, p.mouseY);
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
     * 
     * CURRENT MOVEMENT SYSTEM EXPLANATION:
     * 1. Basic floating motion: Sine wave oscillation for organic feel
     * 2. Social forces: Blobs attract/repel based on emotion type
     * 3. Collision detection: Physics-based collisions with mass and impulse
     * 4. Gravity effects: Score-based gravitational attraction (hope=upward, sorrow=downward)
     * 5. Boundary forces: Soft boundaries to keep blobs on screen
     * 6. Wave reactions: All blobs react when new ones are added
     */
    updateBlobPhysics() {
        // Update each blob's physics
        this.blobs.forEach((blob, index) => {
            // Update visibility based on category filters
            if (!this.visibleCategories.has(blob.category)) {
                blob.targetOpacity = 0;
            } else {
                blob.targetOpacity = 1;
            }
            
            // Smooth opacity transition
            blob.opacity += (blob.targetOpacity - blob.opacity) * 0.1;
            
            // Skip physics for invisible blobs
            if (blob.opacity <= 0.01) return;
            
            // Reset acceleration for this frame
            blob.acceleration.x = 0;
            blob.acceleration.y = 0;
            
            // 1. Apply floating motion (base organic movement)
            blob.floatOffset += 0.01 * blob.energyLevel;
            const floatForce = {
                x: Math.sin(blob.floatOffset) * 0.05,
                y: Math.cos(blob.floatOffset * 1.3) * 0.05
            };
            this.applyForce(blob, floatForce);
            
            // 2. Apply gravity based on emotional score (reduced magnitude)
            const gravityForce = {
                x: 0,
                y: blob.score * this.gravity * blob.mass * 0.5
            };
            this.applyForce(blob, gravityForce);
            
            // 3. Apply social forces (emotional interactions)
            const socialForce = this.calculateSocialForces(blob, this.blobs);
            this.applyForce(blob, socialForce);
            
            // 4. Apply boundary forces
            this.applyBoundaryForces(blob);
            
            // 5. Check collisions with other blobs
            for (let j = index + 1; j < this.blobs.length; j++) {
                if (this.blobs[j].opacity > 0.01) {
                    this.checkCollision(blob, this.blobs[j]);
                }
            }
            
            // 6. Apply friction
            blob.velocity.x *= this.friction;
            blob.velocity.y *= this.friction;
            
            // 7. Update velocity with acceleration
            blob.velocity.x += blob.acceleration.x;
            blob.velocity.y += blob.acceleration.y;
            
            // 8. Limit velocity
            this.limitVelocity(blob);
            
            // 9. Update position
            blob.x += blob.velocity.x;
            blob.y += blob.velocity.y;
            
            // 10. Hard boundary checks (fallback)
            if (blob.x < 0) blob.x = 0;
            if (blob.x > window.innerWidth) blob.x = window.innerWidth;
            if (blob.y < 0) blob.y = 0;
            if (blob.y > window.innerHeight) blob.y = window.innerHeight;
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
        
        if (this.blobs.length > 0) {
            console.log('🎨 Drawing', this.blobs.length, 'blobs');
        }
        
        this.blobs.forEach((blob, index) => {
            if (blob.opacity <= 0.01) {
                console.log(`🎨 Skipping blob ${index} (opacity: ${blob.opacity})`);
                return; // Skip invisible blobs
            }
            
            const color = this.sentimentColors[blob.category] || [1, 1, 1];
            
            // Create radial gradient for 3D effect
            const gradient = p.drawingContext.createRadialGradient(
                blob.x, blob.y, 0,
                blob.x, blob.y, blob.size * 1.5  // Adjusted for smaller sizes
            );
            
            // Gradient stops for 3D volumetric effect
            const baseColor = `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}`;
            gradient.addColorStop(0, `${baseColor}, ${blob.opacity * 0.9})`); // Bright center
            gradient.addColorStop(0.3, `${baseColor}, ${blob.opacity * 0.7})`); // Mid brightness
            gradient.addColorStop(0.7, `${baseColor}, ${blob.opacity * 0.4})`); // Dimmer edge
            gradient.addColorStop(1, `${baseColor}, 0)`); // Transparent edge
            
            // Draw outer glow (adjusted for smaller blobs)
            p.fill(
                color[0] * 255,
                color[1] * 255,
                color[2] * 255,
                blob.opacity * 12  // Reduced opacity for subtlety
            );
            p.noStroke();
            p.circle(blob.x, blob.y, blob.size * 2.5); // Reduced multiplier
            
            // Draw middle glow
            p.fill(
                color[0] * 255,
                color[1] * 255,
                color[2] * 255,
                blob.opacity * 25
            );
            p.circle(blob.x, blob.y, blob.size * 1.8);
            
            // Draw inner glow with gradient
            p.drawingContext.fillStyle = gradient;
            p.drawingContext.beginPath();
            p.drawingContext.arc(blob.x, blob.y, blob.size * 1.2, 0, 2 * Math.PI);
            p.drawingContext.fill();
            
            // Draw blob core with enhanced gradient
            const coreGradient = p.drawingContext.createRadialGradient(
                blob.x - blob.size * 0.2, blob.y - blob.size * 0.2, 0,
                blob.x, blob.y, blob.size * 0.8  // Adjusted for smaller core
            );
            
            // Create more pronounced 3D effect with light source
            coreGradient.addColorStop(0, `${baseColor}, ${blob.opacity * 1.0})`); // Highlight
            coreGradient.addColorStop(0.4, `${baseColor}, ${blob.opacity * 0.8})`); // Mid-tone
            coreGradient.addColorStop(1, `rgba(${color[0] * 200}, ${color[1] * 200}, ${color[2] * 200}, ${blob.opacity * 0.6})`); // Shadow
            
            p.drawingContext.fillStyle = coreGradient;
            p.drawingContext.beginPath();
            p.drawingContext.arc(blob.x, blob.y, blob.size * 0.8, 0, 2 * Math.PI);
            p.drawingContext.fill();
            
            // Reset fill style for other elements
            p.fill(255);
            
            // Draw selection indicator
            if (this.selectedBlobs.has(blob.id)) {
                p.stroke(255, 255, 255, blob.opacity * 255);
                p.strokeWeight(2);
                p.noFill();
                p.circle(blob.x, blob.y, blob.size + 8); // Adjusted for smaller blobs
            }
            
            // Draw hover effect
            if (this.hoveredBlob === blob) {
                p.stroke(255, 255, 255, 150);
                p.strokeWeight(1);
                p.noFill();
                p.circle(blob.x, blob.y, blob.size + 4);
                
                // Change cursor
                p.canvas.style.cursor = 'pointer';
            }
            
            // Draw special highlight for new blobs (aquamarine)
            if (blob.isNewBlob && (Date.now() - blob.addedTime) < 10000) {
                const pulseIntensity = Math.sin((Date.now() - blob.addedTime) * 0.005) * 0.5 + 0.5;
                p.stroke(78, 205, 196, pulseIntensity * 180); // Aquamarine color
                p.strokeWeight(2);
                p.noFill();
                p.circle(blob.x, blob.y, blob.size + 10 + pulseIntensity * 3); // Smaller pulse
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
        console.log('🎯 Handle interaction called at:', x, y);
        
        // Check if any UI elements are currently visible that should block interaction
        if (this.shouldBlockInteraction()) {
            console.log('🚫 Interaction blocked by UI state');
            return;
        }
        
        const clickedBlob = this.getBlobAt(x, y);
        console.log('🎯 Clicked blob:', clickedBlob);
        
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
            console.log('🎯 No blob clicked, clearing selection');
        }
    }
    
    /**
     * Check if blob interactions should be blocked due to UI state
     */
    shouldBlockInteraction() {
        // Check for visible UI panels that should block blob interaction
        const blockers = [
            '.instructions-panel:not(.hidden)',
            '.analysis-confirmation.visible',
            '.loading-overlay:not(.hidden)',
            '.error-panel.visible',
            '.error-panel.active'
        ];
        
        const isBlocked = blockers.some(selector => {
            const element = document.querySelector(selector);
            const isVisible = element && element.offsetParent !== null;
            if (isVisible) {
                console.log('🚫 Interaction blocked by:', selector);
            }
            return isVisible;
        });
        
        return isBlocked;
    }
    
    /**
     * Show detailed tooltip for a blob
     */
    showBlobDetails(blob, x, y) {
        console.log('🎯 Showing blob details for:', blob);
        
        // Remove existing tooltip
        this.hideTooltip();
        
        // Create new tooltip with simplified HTML to avoid syntax errors
        const tooltip = document.createElement('div');
        tooltip.className = 'blob-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 20px;
            max-width: 320px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            font-family: 'Inter', sans-serif;
            opacity: 0;
            transform: scale(0.8) translateY(10px);
            transition: all 0.3s ease;
            color: white;
        `;
        
        const color = this.sentimentColors[blob.category] || [1, 1, 1];
        const categoryColor = `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`;
        
        // Create simplified tooltip content
        tooltip.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="display: flex; align-items: center; gap: 8px; color: ${categoryColor}; font-weight: 600; font-size: 14px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${categoryColor}; box-shadow: 0 0 10px ${categoryColor}40;"></div>
                    <span>${blob.category.replace('_', ' ').toUpperCase()}</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: rgba(255, 255, 255, 0.6); font-size: 18px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
            </div>
            <div style="color: white; font-size: 14px; line-height: 1.5; margin-bottom: 15px; font-style: italic;">"${blob.text}"</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-bottom: 4px;">Confidence</div>
                    <div style="color: ${categoryColor}; font-weight: 600; font-size: 14px;">${(blob.confidence * 100).toFixed(1)}%</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-bottom: 4px;">Intensity</div>
                    <div style="color: ${categoryColor}; font-weight: 600; font-size: 14px;">${(blob.intensity * 100).toFixed(1)}%</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-bottom: 4px;">Score</div>
                    <div style="color: ${categoryColor}; font-weight: 600; font-size: 14px;">${blob.score.toFixed(3)}</div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: rgba(255, 255, 255, 0.5);">
                <div>
                    <span>Speaker: ${blob.speaker_name || 'Anonymous'}</span>
                </div>
                <div>
                    <span>Time: ${blob.created_at ? new Date(blob.created_at).toLocaleTimeString() : 'Unknown'}</span>
                </div>
            </div>
        `;
        
        // Position tooltip
        tooltip.style.left = `${Math.min(x + 20, window.innerWidth - 340)}px`;
        tooltip.style.top = `${Math.max(y - 100, 20)}px`;
        
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
        
        console.log('🎯 Tooltip created and added to DOM');
        
        // Animate tooltip entrance
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'scale(1) translateY(0)';
            console.log('🎯 Tooltip animated in');
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
     * Create subtle canvas ripple effect for general clicks
     */
    createCanvasRipple(x, y) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 80,
            opacity: 0.3, // More subtle
            startTime: Date.now(),
            isCanvasRipple: true
        });
    }
    
    /**
     * Nudge nearby blobs away from click location to help unstick clusters
     */
    nudgeNearbyBlobs(clickX, clickY) {
        const nudgeRadius = 200; // Increased radius of effect for wider impact
        const baseNudgeStrength = 8.0; // Significantly increased base force strength
        
        this.blobs.forEach(blob => {
            const dx = blob.x - clickX;
            const dy = blob.y - clickY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0 && distance < nudgeRadius) {
                // Calculate nudge force (stronger for closer blobs and smaller blobs)
                const proximityStrength = (nudgeRadius - distance) / nudgeRadius;
                const sizeRatio = blob.size / 20; // Normalize against base size
                const sizeMultiplier = 2.5 / (sizeRatio + 0.3); // Much stronger for smaller blobs
                
                // Extra power for very close blobs (within 50px)
                const closeBonus = distance < 50 ? 2.5 : 1.0;
                const force = proximityStrength * baseNudgeStrength * sizeMultiplier * closeBonus;
                
                // Apply force away from click
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                // Apply the nudge with immediate velocity boost
                this.applyForce(blob, { x: forceX, y: forceY });
                
                // Add much stronger immediate velocity for instant movement
                blob.velocity.x += forceX * 0.6; // Increased from 0.3
                blob.velocity.y += forceY * 0.6;
                
                // Add stronger random component to break up perfect symmetry
                const randomX = (Math.random() - 0.5) * 1.5; // Increased randomness
                const randomY = (Math.random() - 0.5) * 1.5;
                this.applyForce(blob, { x: randomX, y: randomY });
                
                // Special handling for blobs very close to corners
                const isNearCorner = this.isBlobNearCorner(blob);
                if (isNearCorner) {
                    const centerX = window.innerWidth * 0.5;
                    const centerY = window.innerHeight * 0.55;
                    const toCenterX = centerX - blob.x;
                    const toCenterY = centerY - blob.y;
                    const centerDistance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
                    
                    if (centerDistance > 0) {
                        // Extra strong center pull for corner blobs
                        const centerForce = {
                            x: (toCenterX / centerDistance) * force * 0.8, // Increased from 0.5
                            y: (toCenterY / centerDistance) * force * 0.8
                        };
                        this.applyForce(blob, centerForce);
                        blob.velocity.x += centerForce.x * 0.4; // Increased from 0.2
                        blob.velocity.y += centerForce.y * 0.4;
                    }
                }
                
                // Add velocity damping reset for stuck blobs (very low velocity)
                const currentSpeed = Math.sqrt(blob.velocity.x * blob.velocity.x + blob.velocity.y * blob.velocity.y);
                if (currentSpeed < 0.1) {
                    // Give stuck blobs a strong random kick
                    const kickX = (Math.random() - 0.5) * 4.0;
                    const kickY = (Math.random() - 0.5) * 4.0;
                    blob.velocity.x += kickX;
                    blob.velocity.y += kickY;
                    console.log('🚀 Gave stuck blob a strong kick!');
                }
            }
        });
        
        console.log('🌊 Nudged nearby blobs from click at', clickX, clickY, 'with ULTRA-enhanced force');
    }
    
    /**
     * Check if blob is near a corner
     */
    isBlobNearCorner(blob) {
        const cornerMargin = 100;
        const topMargin = 80;
        
        return (blob.x < cornerMargin && blob.y < cornerMargin + topMargin) ||
               (blob.x > window.innerWidth - cornerMargin && blob.y < cornerMargin + topMargin) ||
               (blob.x < cornerMargin && blob.y > window.innerHeight - cornerMargin) ||
               (blob.x > window.innerWidth - cornerMargin && blob.y > window.innerHeight - cornerMargin);
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
                const currentOpacity = ripple.opacity * (1 - progress);
                
                if (ripple.isCanvasRipple) {
                    // Subtle canvas ripple - aquamarine color
                    p.stroke(78, 205, 196, currentOpacity * 80);
                    p.strokeWeight(1);
                } else {
                    // Regular blob interaction ripple - white
                    p.stroke(255, 255, 255, currentOpacity * 100);
                    p.strokeWeight(2);
                }
                
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
        // UI elements are now handled by separate panels - keep this clean
        // No overlay text on the canvas to maintain the immersive experience
        
        // Ensure no background elements are drawn that could cause white bars
        if (!this.p5Instance) return;
        
        // Make sure the canvas background is transparent
        const p = this.p5Instance;
        if (p.canvas && p.canvas.style) {
            p.canvas.style.background = 'transparent';
        }
    }
    
    /**
     * Check if click is on UI element
     */
    isClickOnUIElement(x, y) {
        console.log('🎯 Checking if click is on UI element at:', x, y);
        
        const elementsAtPoint = document.elementsFromPoint(x, y);
        console.log('🎯 Elements at point:', elementsAtPoint.map(el => el.tagName + (el.className ? '.' + el.className : '')));
        
        for (let element of elementsAtPoint) {
            // Check for direct UI element classes that should block blob interaction
            if (element.classList.contains('recording-interface') ||
                element.classList.contains('recording-panel') ||
                element.classList.contains('nav-bar') ||
                element.classList.contains('blob-info-panel') ||
                element.classList.contains('analysis-confirmation') ||
                element.classList.contains('instructions-panel') ||
                element.classList.contains('loading-overlay') ||
                element.classList.contains('error-panel') ||
                element.tagName === 'BUTTON' ||
                element.tagName === 'INPUT' ||
                element.tagName === 'SELECT' ||
                element.tagName === 'TEXTAREA') {
                console.log('🚫 Click blocked by element:', element.tagName, element.className);
                return true;
            }
            
            // Check for parent containers that should block blob interaction
            if (element.closest('.recording-interface') ||
                element.closest('.nav-bar') ||
                element.closest('.blob-info-panel') ||
                element.closest('.analysis-confirmation') ||
                element.closest('.instructions-panel') ||
                element.closest('.loading-overlay') ||
                element.closest('.error-panel')) {
                console.log('🚫 Click blocked by parent container:', element.closest('.recording-interface, .nav-bar, .blob-info-panel, .analysis-confirmation, .instructions-panel, .loading-overlay, .error-panel'));
                return true;
            }
        }
        
        console.log('✅ Click not blocked by UI elements');
        return false;
    }
    
    /**
     * Add a new blob to the visualization
     */
    addBlob(blobData) {
        console.log('🫧 Adding blob with data:', blobData);
        
        // Ensure we have all required properties
        const blob = {
            id: blobData.id || `blob_${this.blobIdCounter++}`,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: this.calculateBlobSize(blobData),
            mass: this.calculateBlobMass(blobData),
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
            
            // Enhanced physics properties
            velocity: {
                x: (Math.random() - 0.5) * 0.5,  // Reduced from 2 for calmer start
                y: (Math.random() - 0.5) * 0.5
            },
            acceleration: {
                x: 0,
                y: 0
            },
            maxSpeed: 1.0,  // Further reduced from 1.5 for ultra-calm movement
            radius: 0,    // Will be set after calculation
            
            // Behavioral properties based on emotion
            socialTendency: this.calculateSocialTendency(blobData.category),
            energyLevel: blobData.intensity || 0.5,
            
            // Mark as new for highlighting
            isNewBlob: true,
            addedTime: Date.now()
        };
        
        // Set radius based on size for collision detection
        blob.radius = blob.size + 5;
        
        // Remove oldest blob if we exceed max
        if (this.blobs.length >= this.maxBlobs) {
            this.removeOldestBlob();
        }
        
        this.blobs.push(blob);
        
        // Create wave effect for existing blobs when new blob arrives
        if (this.blobs.length > 1) {
            this.createNewBlobWave(blob);
        }
        
        console.log('🫧 Added blob:', blob);
        console.log('🫧 Total blobs now:', this.blobs.length);
        console.log('🫧 Blob position:', blob.x, blob.y, 'size:', blob.size);
        return blob;
    }
    
    /**
     * Calculate blob size based on data
     * 
     * SCORING SYSTEM EXPLANATION:
     * - score: Sentiment polarity (-1 to 1, where -1=very negative, 0=neutral, 1=very positive)
     * - intensity: Emotional strength (0 to 1, how strong the emotion is)
     * - confidence: AI certainty (0 to 1, how confident the classification is)
     * 
     * Size factors: intensity > confidence > absolute score value
     */
    calculateBlobSize(blobData) {
        const baseSize = 10;  // Minimal base size
        
        // Primary factor: emotional intensity (0-1) 
        const intensityMultiplier = (blobData.intensity || 0.5) * 12;
        
        // Secondary factor: classification confidence (0-1)
        const confidenceMultiplier = (blobData.confidence || 0.5) * 6;
        
        // Tertiary factor: absolute score value (strength regardless of polarity)
        const scoreMultiplier = Math.abs(blobData.score || 0) * 8;
        
        const finalSize = baseSize + intensityMultiplier + confidenceMultiplier + scoreMultiplier;
        
        // Clamp between 8 and 30 pixels
        return Math.max(8, Math.min(30, finalSize));
    }

    /**
     * Calculate blob mass for physics simulation
     */
    calculateBlobMass(blobData) {
        const baseSize = this.calculateBlobSize(blobData);
        // Mass influences physics behavior - larger/more intense emotions have more "weight"
        const intensityFactor = (blobData.intensity || 0.5) * 2;
        const scoreFactor = Math.abs(blobData.score || 0) * 1.5;
        return (baseSize / 10) + intensityFactor + scoreFactor;
    }
    
    /**
     * Find blob at coordinates
     */
    getBlobAt(x, y) {
        console.log('🎯 Looking for blob at:', x, y);
        console.log('🎯 Total blobs to check:', this.blobs.length);
        
        // Find blob at coordinates (reverse order to get topmost)
        for (let i = this.blobs.length - 1; i >= 0; i--) {
            const blob = this.blobs[i];
            if (blob.opacity > 0.1) { // Only check visible blobs
                const distance = Math.sqrt(
                    Math.pow(x - blob.x, 2) + Math.pow(y - blob.y, 2)
                );
                
                // Use the larger glow radius for hit detection (size * 2)
                const hitRadius = blob.size * 2;
                
                console.log(`🎯 Blob ${i}: pos(${blob.x.toFixed(1)}, ${blob.y.toFixed(1)}) size:${blob.size} distance:${distance.toFixed(1)} hitRadius:${hitRadius}`);
                
                if (distance <= hitRadius) {
                    console.log('🎯 HIT! Found blob:', blob);
                    return blob;
                }
            } else {
                console.log(`🎯 Blob ${i}: skipped (opacity: ${blob.opacity})`);
            }
        }
        
        console.log('🎯 No blob found at coordinates');
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
        
        // Update UI elements
        this.updateCategoryUIState(category, visible);
        
        console.log(`🫧 Toggled ${category} visibility:`, visible);
    }
    
    /**
     * Update category UI state
     */
    updateCategoryUIState(category, visible) {
        // Update emotion panel items
        const emotionItems = document.querySelectorAll(`.emotion-item[data-category="${category}"]`);
        emotionItems.forEach(item => {
            if (visible) {
                item.classList.add('active');
                item.classList.remove('inactive');
            } else {
                item.classList.remove('active');
                item.classList.add('inactive');
            }
        });
        
        // Update main category stats if they exist
        const categoryElements = document.querySelectorAll(`.category-stat.${category}`);
        categoryElements.forEach(element => {
            if (visible) {
                element.style.opacity = '1';
                element.style.filter = 'none';
            } else {
                element.style.opacity = '0.5';
                element.style.filter = 'grayscale(100%)';
            }
        });
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

    /**
     * Get blob by ID
     */
    getBlobById(id) {
        return this.blobs.find(blob => blob.id === id);
    }

    /**
     * Get all blobs
     */
    getBlobs() {
        return this.blobs;
    }

    /**
     * Get new blobs (added in the last few seconds)
     */
    getNewBlobs() {
        const currentTime = Date.now();
        return this.blobs.filter(blob => blob.isNewBlob && (currentTime - blob.addedTime) < 30000); // 30 seconds
    }

    /**
     * Clear new blob markers
     */
    clearNewBlobMarkers() {
        this.blobs.forEach(blob => {
            blob.isNewBlob = false;
        });
    }

    /**
     * Calculate social tendency based on emotion category
     * Different emotions have different social behaviors
     */
    calculateSocialTendency(category) {
        const tendencies = {
            hope: 0.7,           // Hopeful emotions seek others
            sorrow: -0.3,        // Sorrowful emotions prefer solitude but may seek gentle comfort
            transformative: 0.5,  // Transformative emotions have moderate social needs
            ambivalent: 0.1,     // Ambivalent emotions are uncertain about social contact
            reflective_neutral: -0.1  // Reflective emotions prefer contemplation
        };
        return tendencies[category] || 0;
    }

    /**
     * Apply physics forces to a blob
     */
    applyForce(blob, force) {
        // F = ma, so a = F/m
        blob.acceleration.x += force.x / blob.mass;
        blob.acceleration.y += force.y / blob.mass;
    }

    /**
     * Limit velocity to max speed
     */
    limitVelocity(blob) {
        const speed = Math.sqrt(blob.velocity.x * blob.velocity.x + blob.velocity.y * blob.velocity.y);
        if (speed > blob.maxSpeed) {
            blob.velocity.x = (blob.velocity.x / speed) * blob.maxSpeed;
            blob.velocity.y = (blob.velocity.y / speed) * blob.maxSpeed;
        }
    }

    /**
     * Check collision between two blobs
     */
    checkCollision(blob1, blob2) {
        const dx = blob2.x - blob1.x;
        const dy = blob2.y - blob1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = blob1.radius + blob2.radius;

        if (distance < minDistance && distance > 0) {
            // Normalize collision vector
            const nx = dx / distance;
            const ny = dy / distance;

            // Stronger separation to prevent sticking
            const overlap = minDistance - distance;
            const separationStrength = 0.08; // Increased from 0.02 for stronger separation
            
            // Add extra separation for very close blobs
            const proximityMultiplier = distance < (minDistance * 0.8) ? 2.0 : 1.0;
            
            // Gradual separation forces with increased strength
            const separationForce1 = {
                x: -nx * overlap * separationStrength * proximityMultiplier / blob1.mass,
                y: -ny * overlap * separationStrength * proximityMultiplier / blob1.mass
            };
            
            const separationForce2 = {
                x: nx * overlap * separationStrength * proximityMultiplier / blob2.mass,
                y: ny * overlap * separationStrength * proximityMultiplier / blob2.mass
            };
            
            // Apply stronger separation forces
            this.applyForce(blob1, separationForce1);
            this.applyForce(blob2, separationForce2);
            
            // Add immediate velocity separation to break contact quickly
            blob1.velocity.x += separationForce1.x * 0.5;
            blob1.velocity.y += separationForce1.y * 0.5;
            blob2.velocity.x += separationForce2.x * 0.5;
            blob2.velocity.y += separationForce2.y * 0.5;
            
            // Reduced velocity damping to maintain separation momentum
            blob1.velocity.x *= 0.995; // Reduced from 0.98
            blob1.velocity.y *= 0.995;
            blob2.velocity.x *= 0.995;
            blob2.velocity.y *= 0.995;
        }
    }

    /**
     * Apply boundary forces with ultra-strong corner repulsion for small blobs
     */
    applyBoundaryForces(blob) {
        const topMargin = 120;   // Increased navigation bar buffer
        const sideMargin = 80;   // Increased side margins
        const bottomMargin = 80; // Increased bottom margin
        const force = { x: 0, y: 0 };

        // Scale boundary strength based on blob size - much stronger for smaller blobs
        const sizeRatio = blob.size / 20; // Normalize against base size
        const smallBlobMultiplier = Math.max(1, 3.0 / (sizeRatio + 0.1)); // Exponential boost for tiny blobs
        const boundaryStrength = 0.25 * smallBlobMultiplier; // Much stronger base strength
        
        // Exponential force increase as blobs get closer to edges
        const edgeForceMultiplier = 3.5; // Increased multiplier
        
        // Ultra-enhanced corner repulsion system - massive zone and extreme forces for small blobs
        const cornerRepulsionZone = 250; // Massive corner repulsion zone
        const cornerStrength = 0.8 * smallBlobMultiplier; // Extreme corner repulsion for small blobs
        
        // Check for corner proximity first (priority over edge forces)
        const distanceToTopLeft = Math.sqrt(blob.x * blob.x + (blob.y - topMargin) * (blob.y - topMargin));
        const distanceToTopRight = Math.sqrt((blob.x - window.innerWidth) * (blob.x - window.innerWidth) + (blob.y - topMargin) * (blob.y - topMargin));
        const distanceToBottomLeft = Math.sqrt(blob.x * blob.x + (blob.y - window.innerHeight) * (blob.y - window.innerHeight));
        const distanceToBottomRight = Math.sqrt((blob.x - window.innerWidth) * (blob.x - window.innerWidth) + (blob.y - window.innerHeight) * (blob.y - window.innerHeight));
        
        // Find closest corner and apply strong repulsion
        const cornerDistances = [
            { distance: distanceToTopLeft, direction: { x: 1, y: 1 } },
            { distance: distanceToTopRight, direction: { x: -1, y: 1 } },
            { distance: distanceToBottomLeft, direction: { x: 1, y: -1 } },
            { distance: distanceToBottomRight, direction: { x: -1, y: -1 } }
        ];
        
        const closestCorner = cornerDistances.reduce((min, corner) => 
            corner.distance < min.distance ? corner : min
        );
        
        if (closestCorner.distance < cornerRepulsionZone) {
            const repulsionStrength = (cornerRepulsionZone - closestCorner.distance) / cornerRepulsionZone;
            const cornerForce = {
                x: closestCorner.direction.x * repulsionStrength * cornerStrength,
                y: closestCorner.direction.y * repulsionStrength * cornerStrength
            };
            force.x += cornerForce.x;
            force.y += cornerForce.y;
            
            // Dampen velocity when near corners to prevent bouncing
            blob.velocity.x *= 0.85;
            blob.velocity.y *= 0.85;
        }
        
        // Regular edge repulsion (weaker than corner repulsion)
        if (blob.x < sideMargin) {
            const penetration = (sideMargin - blob.x) / sideMargin;
            force.x += Math.pow(penetration, edgeForceMultiplier) * boundaryStrength * sideMargin;
        } else if (blob.x > window.innerWidth - sideMargin) {
            const penetration = (blob.x - (window.innerWidth - sideMargin)) / sideMargin;
            force.x -= Math.pow(penetration, edgeForceMultiplier) * boundaryStrength * sideMargin;
        }

        if (blob.y < topMargin) {
            const penetration = (topMargin - blob.y) / topMargin;
            force.y += Math.pow(penetration, edgeForceMultiplier) * boundaryStrength * topMargin * 1.5; // Strong for nav bar
        } else if (blob.y > window.innerHeight - bottomMargin) {
            const penetration = (blob.y - (window.innerHeight - bottomMargin)) / bottomMargin;
            force.y -= Math.pow(penetration, edgeForceMultiplier) * boundaryStrength * bottomMargin;
        }

        this.applyForce(blob, force);
        
        // Emergency teleport system for completely stuck blobs in corners
        const currentSpeed = Math.sqrt(blob.velocity.x * blob.velocity.x + blob.velocity.y * blob.velocity.y);
        const isInCornerDangerZone = closestCorner.distance < 100; // Very close to corner
        const isStuck = currentSpeed < 0.05; // Nearly motionless
        
        // Track how long blob has been stuck
        if (!blob.stuckTimer) blob.stuckTimer = 0;
        if (isStuck && isInCornerDangerZone) {
            blob.stuckTimer += 1;
        } else {
            blob.stuckTimer = 0;
        }
        
        // Teleport if stuck for too long (60 frames = ~1 second at 60fps)
        if (blob.stuckTimer > 60) {
            console.log('🚨 Emergency teleporting stuck blob from corner!');
            const safeZone = {
                minX: window.innerWidth * 0.25,
                maxX: window.innerWidth * 0.75,
                minY: window.innerHeight * 0.3,
                maxY: window.innerHeight * 0.7
            };
            
            blob.x = safeZone.minX + Math.random() * (safeZone.maxX - safeZone.minX);
            blob.y = safeZone.minY + Math.random() * (safeZone.maxY - safeZone.minY);
            
            // Give it a random velocity to start moving
            blob.velocity.x = (Math.random() - 0.5) * 2;
            blob.velocity.y = (Math.random() - 0.5) * 2;
            
            blob.stuckTimer = 0;
        }
        
        // Gentle center-pulling force for overall distribution (reduced to avoid conflicts)
        const centerX = window.innerWidth * 0.5;
        const centerY = window.innerHeight * 0.55;
        
        const toCenterX = centerX - blob.x;
        const toCenterY = centerY - blob.y;
        const distanceToCenter = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
        
        // Very gentle center pull only when extremely far from center
        const centerPullDistance = 350; // Increased distance threshold
        if (distanceToCenter > centerPullDistance) {
            const centerStrength = 0.003; // Further reduced strength to avoid corner conflicts
            const centerForce = {
                x: (toCenterX / distanceToCenter) * centerStrength,
                y: (toCenterY / distanceToCenter) * centerStrength
            };
            this.applyForce(blob, centerForce);
        }
    }

    /**
     * Calculate social forces between blobs
     */
    calculateSocialForces(blob, otherBlobs) {
        const force = { x: 0, y: 0 };

        otherBlobs.forEach(other => {
            if (other === blob) return;

            const dx = other.x - blob.x;
            const dy = other.y - blob.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && distance < 100) { // Further reduced from 120 to prevent clustering
                const nx = dx / distance;
                const ny = dy / distance;

                // Calculate base social tendency
                let socialForce = (blob.socialTendency + other.socialTendency) * 0.008; // Further reduced from 0.015
                
                // Add repulsion for very close blobs regardless of social tendency
                if (distance < 60) {
                    // Close blobs should repel to prevent sticking
                    const repulsionStrength = (60 - distance) / 60 * 0.02;
                    socialForce = -repulsionStrength; // Negative = repulsion
                }
                
                const distanceForce = 1 / (distance * distance + 1);

                force.x += nx * socialForce * distanceForce;
                force.y += ny * socialForce * distanceForce;
            }
        });

        return force;
    }

    /**
     * Create wave effect when new blob is added
     */
    createNewBlobWave(newBlob) {
        this.blobs.forEach(blob => {
            if (blob === newBlob) return;

            const dx = blob.x - newBlob.x;
            const dy = blob.y - newBlob.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && distance < 250) { // Reduced range from 300
                const strength = (250 - distance) / 250;
                const pushForce = {
                    x: (dx / distance) * strength * 0.8, // Reduced from 2 to 0.8
                    y: (dy / distance) * strength * 0.8
                };
                this.applyForce(blob, pushForce);
            }
        });
    }
}

// Export for global access
window.BlobEmotionVisualizer = BlobEmotionVisualizer; 