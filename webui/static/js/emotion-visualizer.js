/**
 * GLSL-Enhanced Emotion Visualizer for Hopes & Sorrows
 * Integrates GLSL shaders with P5.js overlay for sentiment visualization
 */

class EmotionVisualizer {
    constructor() {
        // WebGL/GLSL properties
        this.gl = null;
        this.program = null;
        this.canvas = null;
        this.uniforms = {};
        this.startTime = Date.now();
        this.mouseX = 0;
        this.mouseY = 0;
        this.intensity = 1;
        this.timeScale = 1;
        this.zoom = 1;
        this.sentimentColor = [1, 1, 1]; // Default white
        
        // P5.js overlay properties
        this.p5Instance = null;
        this.blobs = [];
        this.blobIdCounter = 0;
        this.maxBlobs = 80;
        
        // Interaction properties
        this.lastClickedBlob = null;
        this.ripples = [];
        
        // Sentiment color palettes
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
        
        console.log('🎨 GLSL-Enhanced Emotion Visualizer initialized');
    }
    
    /**
     * Initialize the visualizer with a container
     * @param {HTMLElement} container - The container element
     */
    async init(container) {
        console.log('🎨 Initializing GLSL-Enhanced Emotion Visualizer...');
        
        try {
            // Store container reference
            this.container = container;
            
            // Initialize canvas and WebGL
            const success = this.initializeCanvas();
            
            if (!success) {
                throw new Error('Failed to initialize canvas');
            }
            
            // Start animation loop
            this.animate();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.handleResize();
            });
            
            console.log('✅ GLSL-Enhanced Emotion Visualizer ready');
            return true;
            
        } catch (error) {
            console.error('❌ Visualizer initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        if (this.canvas && this.gl) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
        
        if (this.p5Instance) {
            this.p5Instance.resizeCanvas(window.innerWidth, window.innerHeight);
        }
    }
    
    initializeCanvas() {
        try {
            // Get the visualization container
            const container = document.getElementById('visualization-container');
            if (!container) {
                console.error('❌ Visualization container not found');
                return false;
            }
            
            // Create GLSL canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'glsl-canvas';
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                width: 100%;
                height: 100%;
            `;
            container.appendChild(this.canvas);
            
            // Create P5 container
            const p5Container = document.createElement('div');
            p5Container.id = 'p5-container';
            p5Container.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                z-index: 2;
                width: 100%;
                height: 100%;
                pointer-events: auto;
            `;
            container.appendChild(p5Container);
            
            // Initialize WebGL and P5
            this.setupWebGL();
            this.setupP5();
            this.createBackgroundParticles();
            
            console.log('✅ GLSL-Enhanced canvas initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Canvas initialization failed:', error);
            return false;
        }
    }
    
    setupWebGL() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.error('❌ WebGL not supported');
            return;
        }
        
        // Vertex shader source
        const vertexSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Fragment shader source with enhanced sentiment visualization
        const fragmentSource = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_time;
            uniform float u_intensity;
            uniform float u_timeScale;
            uniform float u_zoom;
            uniform vec3 u_sentimentColor;
            
            #define PI 3.14159265358979
            #define TAU 6.283185307179586
            
            void main() {
                vec3 c = vec3(0.0);
                vec2 R = u_resolution;
                vec2 m = (u_mouse - 0.5 * R) / R.y * 2.0;
                
                float t = (length(u_mouse) > 0.0) ? 
                          atan(m.x, -m.y) : 
                          -0.54 + (u_time * u_timeScale * TAU) / 3600.0;
                      
                float n = (cos(t) > 0.0) ? sin(t) : 1.0 / sin(t);
                float e = n * 2.0;
                float z = clamp(pow(500.0, n), 1e-16, 1e+18) * u_zoom;
                
                vec2 uv = (gl_FragCoord.xy - 0.5 * R) / R.y * 2.0;
                vec2 u = uv * z;
                
                float ro = -PI / 2.0;
                float cr = u_time * u_timeScale * TAU / 5.0;
                float a = atan(u.y, u.x) - ro;
                float i = a / TAU;
                float r = exp(log(length(u)) / e);
                float sc = ceil(r - i);
                float s = pow(sc + i, 2.0);
                float vd = cos((sc * TAU + a) / n);
                float ts = cr + s / n * TAU;
                
                c += sin(ts / 2.0) * u_intensity;
                c *= cos(ts);
                c *= pow(abs(sin((r - i) * PI)), abs(e) + 5.0);
                c *= 0.2 + abs(vd);
                c = min(c, pow(length(u) / z, -1.0 / n));
                
                // Enhanced color mixing with sentiment
                vec3 rgb = mix(
                    vec3(vd + 1.0, abs(sin(t)), 1.0 - vd), 
                    u_sentimentColor, 
                    0.3
                );
                
                c += (c * 2.0) - (rgb * 0.5);
                
                // Add subtle vignette effect
                float dist = length(uv);
                c *= 1.0 - smoothstep(0.8, 1.2, dist);
                
                gl_FragColor = vec4(c, 1.0);
            }
        `;
        
        // Create shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        // Create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('❌ Program link error:', this.gl.getProgramInfoLog(this.program));
            return;
        }
        
        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
            timeScale: this.gl.getUniformLocation(this.program, 'u_timeScale'),
            zoom: this.gl.getUniformLocation(this.program, 'u_zoom'),
            sentimentColor: this.gl.getUniformLocation(this.program, 'u_sentimentColor')
        };
        
        // Create vertex buffer for full-screen quad
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        
        // Get position attribute location and enable it
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // Set viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Mouse interaction
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = window.innerHeight - e.clientY; // Flip Y
        });
        
        // Start animation loop
        this.animate();
        
        console.log('✅ WebGL setup complete');
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('❌ Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    setupP5() {
        const self = this;
        
        const sketch = (p) => {
            self.p5Instance = p;
            
            p.setup = () => {
                const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
                canvas.parent('p5-container');
                canvas.style('pointer-events', 'auto');
                
                p.colorMode(p.RGB, 255);
                console.log('✅ P5.js overlay setup complete');
            };
            
            p.draw = () => {
                p.clear(); // Transparent background for overlay
                self.updateBlobPhysics();
                self.drawBackgroundParticles();
                self.drawBlobs();
                self.drawRipples();
                self.cleanupRipples();
            };
            
            p.mousePressed = () => {
                if (!self.isClickOnUIElement(p.mouseX, p.mouseY)) {
                    self.handleInteraction(p.mouseX, p.mouseY);
                }
            };
            
            p.windowResized = () => {
                p.resizeCanvas(window.innerWidth, window.innerHeight);
                if (self.canvas) {
                    self.canvas.width = window.innerWidth;
                    self.canvas.height = window.innerHeight;
                    self.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
                }
            };
        };
        
        new p5(sketch);
    }
    
    animate() {
        if (!this.gl || !this.program) return;
        
        const currentTime = (Date.now() - this.startTime) / 1000;
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.program);
        
        // Set uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
        this.gl.uniform1f(this.uniforms.time, currentTime);
        this.gl.uniform1f(this.uniforms.intensity, this.intensity);
        this.gl.uniform1f(this.uniforms.timeScale, this.timeScale);
        this.gl.uniform1f(this.uniforms.zoom, this.zoom);
        this.gl.uniform3f(this.uniforms.sentimentColor, ...this.sentimentColor);
        
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(() => this.animate());
    }
    
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
    
    createBackgroundParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.2 + 0.1,
                life: Math.random() * 500 + 250,
                noiseOffset: Math.random() * 1000
            });
        }
        
        console.log(`✨ Created ${this.numParticles} background particles`);
    }
    
    updateBlobPhysics() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        
        this.blobs.forEach(blob => {
            // Apply gentle gravity toward center
            const centerX = p.width / 2;
            const centerY = p.height / 2;
            const distToCenter = Math.sqrt((blob.x - centerX) ** 2 + (blob.y - centerY) ** 2);
            
            if (distToCenter > 50) {
                const gravity = 0.1;
                blob.vx += (centerX - blob.x) / distToCenter * gravity;
                blob.vy += (centerY - blob.y) / distToCenter * gravity;
            }
            
            // Blob-to-blob repulsion
            this.blobs.forEach(otherBlob => {
                if (blob !== otherBlob) {
                    const dx = blob.x - otherBlob.x;
                    const dy = blob.y - otherBlob.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = blob.radius + otherBlob.radius + 10;
                    
                    if (distance < minDistance && distance > 0) {
                        const repulsion = 50;
                        const force = repulsion / (distance * distance);
                        blob.vx += (dx / distance) * force;
                        blob.vy += (dy / distance) * force;
                    }
                }
            });
            
            // Apply friction
            blob.vx *= 0.98;
            blob.vy *= 0.98;
            
            // Update position
            blob.x += blob.vx;
            blob.y += blob.vy;
            
            // Boundary bouncing
            if (blob.x - blob.radius < 0 || blob.x + blob.radius > p.width) {
                blob.vx *= -0.8;
                blob.x = Math.max(blob.radius, Math.min(p.width - blob.radius, blob.x));
            }
            
            if (blob.y - blob.radius < 100 || blob.y + blob.radius > p.height) {
                blob.vy *= -0.8;
                blob.y = Math.max(100 + blob.radius, Math.min(p.height - blob.radius, blob.y));
            }
            
            // Organic floating movement
            blob.noiseOffset += 0.01;
            const noiseX = (this.p5Instance.noise(blob.noiseOffset) - 0.5) * 0.5;
            const noiseY = (this.p5Instance.noise(blob.noiseOffset + 1000) - 0.5) * 0.5;
            blob.vx += noiseX;
            blob.vy += noiseY;
            
            // Update rotation
            blob.angle += blob.rotationSpeed;
        });
    }
    
    drawBackgroundParticles() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        
        this.particles.forEach(particle => {
            // Update position with Perlin noise
            particle.noiseOffset += 0.005;
            const noiseX = (p.noise(particle.noiseOffset) - 0.5) * 0.2;
            const noiseY = (p.noise(particle.noiseOffset + 1000) - 0.5) * 0.2;
            
            particle.x += particle.vx + noiseX;
            particle.y += particle.vy + noiseY;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = p.width;
            if (particle.x > p.width) particle.x = 0;
            if (particle.y < 0) particle.y = p.height;
            if (particle.y > p.height) particle.y = 0;
            
            // Twinkling effect
            const twinkle = Math.sin(Date.now() * 0.003 + particle.noiseOffset) * 0.5 + 0.5;
            const alpha = particle.alpha * twinkle;
            
            // Draw particle
            p.fill(255, 255, 255, alpha * 255);
            p.noStroke();
            p.ellipse(particle.x, particle.y, particle.size, particle.size);
        });
    }
    
    drawBlobs() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        
        this.blobs.forEach(blob => {
            const color = this.sentimentColors[blob.category] || [1, 1, 1];
            
            // Breathing animation
            const breathe = Math.sin(Date.now() * 0.002 + blob.id * 0.1) * 0.1 + 1;
            const currentRadius = blob.radius * breathe;
            
            // Main blob with glow effect
            p.fill(color[0] * 255, color[1] * 255, color[2] * 255, 180);
            p.noStroke();
            p.ellipse(blob.x, blob.y, currentRadius * 2, currentRadius * 2);
            
            // Inner glow
            p.fill(255, 255, 255, 80);
            p.ellipse(blob.x, blob.y, currentRadius, currentRadius);
            
            // Outer glow
            p.fill(color[0] * 255, color[1] * 255, color[2] * 255, 40);
            p.ellipse(blob.x, blob.y, currentRadius * 2.5, currentRadius * 2.5);
        });
    }
    
    handleInteraction(x, y) {
        // Find clicked blob
        const clickedBlob = this.getBlobAt(x, y);
        
        if (clickedBlob) {
            // Show tooltip
            this.showBlobDetails(clickedBlob, x, y);
            
            // Add impulse
            clickedBlob.vx += (Math.random() - 0.5) * 5;
            clickedBlob.vy += (Math.random() - 0.5) * 5;
            
            this.lastClickedBlob = clickedBlob;
        }
        
        // Create ripple effect
        this.createRippleEffect(x, y);
    }
    
    showBlobDetails(blob, x, y) {
        // Remove existing tooltip
        this.hideTooltip();
        
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
            pointer-events: auto;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            left: ${Math.min(x + 10, window.innerWidth - 320)}px;
            top: ${Math.max(y - 10, 10)}px;
        `;
        
        const category = blob.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const confidence = Math.round((blob.confidence || 0.5) * 100);
        const createdDate = new Date(blob.created_at).toLocaleDateString();
        
        tooltip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px; color: #FFD700;">
                ${category}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Speaker:</strong> ${blob.speaker || 'Unknown'}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Confidence:</strong> ${confidence}%
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Created:</strong> ${createdDate}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Message:</strong><br>
                <em style="color: rgba(255, 255, 255, 0.8);">"${blob.text.substring(0, 150)}${blob.text.length > 150 ? '...' : ''}"</em>
            </div>
            <button class="close-btn" style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: rgba(255, 255, 255, 0.6); font-size: 18px; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
        `;
        
        document.body.appendChild(tooltip);
        
        // Setup auto-hide functionality
        this.setupTooltipAutoHide(tooltip);
        
        // Close button functionality
        const closeBtn = tooltip.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideTooltip();
            });
        }
        
        console.log('💬 Showing blob details for:', blob.category);
    }
    
    setupTooltipAutoHide(tooltip) {
        let hideTimer = null;
        
        const startHideTimer = () => {
            hideTimer = setTimeout(() => {
                if (tooltip.parentElement) {
                    this.hideTooltip();
                }
            }, 3000); // 3 seconds
        };
        
        const cancelHideTimer = () => {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
        };
        
        // Start the timer immediately
        startHideTimer();
        
        // Cancel timer on mouse enter, restart on mouse leave
        tooltip.addEventListener('mouseenter', cancelHideTimer);
        tooltip.addEventListener('mouseleave', startHideTimer);
        
        // Store timer reference for cleanup
        tooltip._hideTimer = hideTimer;
        tooltip._cancelHideTimer = cancelHideTimer;
    }
    
    hideTooltip() {
        const existingTooltips = document.querySelectorAll('.blob-tooltip');
        existingTooltips.forEach(tooltip => {
            // Clean up timers
            if (tooltip._cancelHideTimer) {
                tooltip._cancelHideTimer();
            }
            
            // Remove with animation if anime.js is available
            if (window.anime) {
                window.anime({
                    targets: tooltip,
                    opacity: 0,
                    scale: 0.8,
                    duration: 200,
                    easing: 'easeOutQuad',
                    complete: () => {
                        if (tooltip.parentElement) {
                            tooltip.remove();
                        }
                    }
                });
            } else {
                tooltip.remove();
            }
        });
    }
    
    createRippleEffect(x, y) {
        const ripple = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 100,
            opacity: 1,
            createdAt: Date.now(),
            duration: 1000
        };
        
        this.ripples.push(ripple);
        console.log('💫 Created ripple effect at', x, y);
    }
    
    drawRipples() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        const currentTime = Date.now();
        
        this.ripples.forEach(ripple => {
            const elapsed = currentTime - ripple.createdAt;
            const progress = elapsed / ripple.duration;
            
            if (progress < 1) {
                ripple.radius = progress * ripple.maxRadius;
                ripple.opacity = 1 - progress;
                
                p.noFill();
                p.stroke(255, 215, 0, ripple.opacity * 0.4 * 255);
                p.strokeWeight(2);
                p.circle(ripple.x, ripple.y, ripple.radius * 2);
                
                p.stroke(255, 255, 102, ripple.opacity * 0.6 * 255);
                p.strokeWeight(1);
                p.circle(ripple.x, ripple.y, ripple.radius);
            }
        });
    }
    
    cleanupRipples() {
        const currentTime = Date.now();
        const initialLength = this.ripples.length;
        
        this.ripples = this.ripples.filter(ripple => {
            const elapsed = currentTime - ripple.createdAt;
            return elapsed < ripple.duration;
        });
        
        if (this.ripples.length < initialLength) {
            console.log(`🧹 Cleaned up ${initialLength - this.ripples.length} expired ripples`);
        }
    }
    
    addBlob(blobData) {
        console.log('🫧 Adding GLSL-enhanced blob:', blobData.category, 'with data:', {
            confidence: blobData.confidence,
            score: blobData.score,
            confidenceType: typeof blobData.confidence,
            scoreType: typeof blobData.score
        });
        
        if (!this.p5Instance) {
            console.warn('⚠️ P5.js not ready, queuing blob');
            setTimeout(() => this.addBlob(blobData), 100);
            return;
        }
        
        // Calculate size with proper validation
        const calculatedRadius = this.calculateBlobSize(blobData);
        
        const blob = {
            id: blobData.id || `blob_${this.blobIdCounter++}`,
            x: Math.random() * (window.innerWidth - 200) + 100,
            y: Math.random() * (window.innerHeight - 300) + 200,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: calculatedRadius,
            angle: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.01,
            noiseOffset: Math.random() * 1000,
            
            // Data from analysis
            category: blobData.category || 'reflective_neutral',
            speaker: blobData.speaker_name || blobData.speaker || 'Unknown',
            text: blobData.text || '',
            confidence: (typeof blobData.confidence === 'number' && !isNaN(blobData.confidence)) ? blobData.confidence : 0.5,
            score: (typeof blobData.score === 'number' && !isNaN(blobData.score)) ? blobData.score : 0,
            created_at: blobData.created_at || new Date().toISOString()
        };
        
        // Final validation
        if (isNaN(blob.radius)) {
            console.error('❌ Invalid blob radius detected, using fallback');
            blob.radius = 35;
        }
        
        this.blobs.push(blob);
        
        // Remove oldest blob if we have too many
        if (this.blobs.length > this.maxBlobs) {
            this.removeOldestBlob();
        }
        
        // Update background sentiment color
        this.updateBackgroundSentiment();
        
        // Animate blob entrance
        if (window.anime) {
            const originalRadius = blob.radius;
            blob.radius = 0;
            window.anime({
                targets: blob,
                radius: originalRadius,
                duration: 600,
                easing: 'easeOutElastic(1, .6)'
            });
        }
        
        console.log(`🎨 GLSL-enhanced blob created: ${blob.category} at (${Math.round(blob.x)}, ${Math.round(blob.y)}) with radius ${Math.round(blob.radius)}`);
    }
    
    calculateBlobSize(blobData) {
        const confidence = (typeof blobData.confidence === 'number' && !isNaN(blobData.confidence)) ? blobData.confidence : 0.5;
        const score = (typeof blobData.score === 'number' && !isNaN(blobData.score)) ? blobData.score : 0;
        
        const baseSize = 30;
        const confidenceMultiplier = confidence * 25;
        const intensityMultiplier = Math.abs(score) * 20;
        
        const calculatedSize = Math.max(25, Math.min(60, baseSize + confidenceMultiplier + intensityMultiplier));
        return isNaN(calculatedSize) ? 35 : calculatedSize;
    }
    
    updateBackgroundSentiment() {
        if (this.blobs.length === 0) return;
        
        // Calculate dominant sentiment
        const sentimentCounts = {};
        this.blobs.forEach(blob => {
            sentimentCounts[blob.category] = (sentimentCounts[blob.category] || 0) + 1;
        });
        
        const dominantSentiment = Object.keys(sentimentCounts).reduce((a, b) => 
            sentimentCounts[a] > sentimentCounts[b] ? a : b
        );
        
        // Smoothly transition to new color
        const targetColor = this.sentimentColors[dominantSentiment] || [1, 1, 1];
        
        if (window.anime) {
            window.anime({
                targets: this.sentimentColor,
                0: targetColor[0],
                1: targetColor[1],
                2: targetColor[2],
                duration: 2000,
                easing: 'easeInOutQuad'
            });
        } else {
            this.sentimentColor = targetColor;
        }
        
        console.log('🎨 Updated background sentiment to:', dominantSentiment);
    }
    
    getBlobAt(x, y) {
        for (let i = this.blobs.length - 1; i >= 0; i--) {
            const blob = this.blobs[i];
            const distance = Math.sqrt((x - blob.x) ** 2 + (y - blob.y) ** 2);
            if (distance <= blob.radius) {
                return blob;
            }
        }
        return null;
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
        this.hideTooltip();
        this.lastClickedBlob = null;
        this.sentimentColor = [1, 1, 1]; // Reset to white
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
}

// Make EmotionVisualizer available globally
window.EmotionVisualizer = EmotionVisualizer; 