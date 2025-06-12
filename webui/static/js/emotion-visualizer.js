/**
 * GLSL-Enhanced Emotion Visualizer for Hopes & Sorrows
 * Enhanced with multiple visualization modes, camera controls, and individual blob interaction
 */

class EmotionVisualizer {
    constructor() {
        // WebGL/GLSL properties
        this.gl = null;
        this.programs = {}; // Multiple shader programs for different modes
        this.canvas = null;
        this.uniforms = {};
        this.startTime = Date.now();
        
        // Camera controls
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0,
            targetZoom: 1.0,
            rotation: 0,
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0
        };
        
        // Mouse interaction
        this.mouse = {
            x: 0,
            y: 0,
            normalizedX: 0,
            normalizedY: 0,
            isPressed: false
        };
        
        // Visualization modes
        this.currentMode = 'landscape'; // 'landscape' or 'geometric'
        this.modes = {
            landscape: {
                name: 'Emotional Landscape',
                description: 'Flowing organic visualization'
            },
            geometric: {
                name: 'Geometric Patterns',
                description: 'Mathematical geometric forms'
            }
        };
        
        // P5.js overlay properties
        this.p5Instance = null;
        this.blobs = [];
        this.blobIdCounter = 0;
        this.maxBlobs = 80;
        this.selectedBlobs = new Set(); // For filtering by emotion
        this.visibleCategories = new Set(['hope', 'sorrow', 'transformative', 'ambivalent', 'reflective_neutral']);
        
        // Interaction properties
        this.lastClickedBlob = null;
        this.ripples = [];
        this.hoveredBlob = null;
        
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
        
        // Animation properties
        this.intensity = 1;
        this.timeScale = 1;
        this.sentimentColor = [1, 1, 1]; // Default white
        
        console.log('🎨 Enhanced GLSL Emotion Visualizer initialized');
    }
    
    /**
     * Initialize the visualizer with a container
     */
    async init(container) {
        console.log('🎨 Initializing Enhanced GLSL Emotion Visualizer...');
        
        try {
            this.container = container;
            
            if (!container) {
                throw new Error('Container element not provided');
            }
            
            const success = this.initializeCanvas();
            
            if (!success) {
                console.warn('⚠️ GLSL initialization failed, falling back to basic mode');
                this.initializeFallbackMode();
                return true; // Still return success for fallback mode
            }
            
            this.setupEventListeners();
            this.animate();
            
            console.log('✅ Enhanced GLSL Emotion Visualizer initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Visualizer initialization failed:', error);
            console.log('🔄 Attempting fallback initialization...');
            
            try {
                this.initializeFallbackMode();
                return true;
            } catch (fallbackError) {
                console.error('❌ Fallback initialization also failed:', fallbackError);
                throw error;
            }
        }
    }
    
    /**
     * Initialize fallback mode when WebGL fails
     */
    initializeFallbackMode() {
        console.log('🔄 Initializing fallback visualization mode...');
        
        // Create a simple canvas-based fallback
        const fallbackContainer = document.createElement('div');
        fallbackContainer.id = 'fallback-visualization';
        fallbackContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #0a0a0a, #1a1a2e);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Inter', sans-serif;
            z-index: 1;
        `;
        
        fallbackContainer.innerHTML = `
            <div style="text-align: center; max-width: 400px; padding: 20px;">
                <h3 style="color: #FFD700; margin-bottom: 15px;">🎨 Emotion Visualization</h3>
                <p style="margin-bottom: 20px; line-height: 1.5; opacity: 0.8;">
                    Your browser doesn't support advanced WebGL features. 
                    The visualization is running in compatibility mode.
                </p>
                <div id="fallback-stats" style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 15px;
                    margin-top: 20px;
                ">
                    <div style="font-size: 24px; font-weight: bold; color: #FFD700;">
                        <span id="fallback-blob-count">0</span>
                    </div>
                    <div style="font-size: 14px; opacity: 0.8;">voices shared</div>
                </div>
            </div>
        `;
        
        this.container.appendChild(fallbackContainer);
        
        // Setup basic P5 overlay for interaction
        this.setupP5();
        
        // Mark as fallback mode
        this.isFallbackMode = true;
        
        console.log('✅ Fallback visualization mode initialized');
    }
    
    /**
     * Setup event listeners for camera controls and interaction
     */
    setupEventListeners() {
        // Mouse controls for camera
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.camera.isDragging = true;
                this.camera.lastMouseX = e.clientX;
                this.camera.lastMouseY = e.clientY;
                this.mouse.isPressed = true;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = window.innerHeight - e.clientY; // Flip Y for WebGL
            this.mouse.normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.normalizedY = ((window.innerHeight - e.clientY) / window.innerHeight) * 2 - 1;
            
            if (this.camera.isDragging) {
                const deltaX = e.clientX - this.camera.lastMouseX;
                const deltaY = e.clientY - this.camera.lastMouseY;
                
                this.camera.x -= deltaX * 0.01 / this.camera.zoom;
                this.camera.y += deltaY * 0.01 / this.camera.zoom;
                
                this.camera.lastMouseX = e.clientX;
                this.camera.lastMouseY = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.camera.isDragging = false;
                this.mouse.isPressed = false;
            }
        });
        
        // Zoom controls
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.targetZoom = Math.max(0.1, Math.min(5.0, this.camera.targetZoom * zoomFactor));
        });
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'r':
                case 'R':
                    this.resetCamera();
                    break;
                case 'm':
                case 'M':
                    this.toggleVisualizationMode();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    this.toggleEmotionCategory(parseInt(e.key) - 1);
                    break;
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    /**
     * Reset camera to default position
     */
    resetCamera() {
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.targetZoom = 1.0;
        this.camera.rotation = 0;
    }
    
    /**
     * Toggle visualization mode
     */
    toggleVisualizationMode() {
        this.currentMode = this.currentMode === 'landscape' ? 'geometric' : 'landscape';
        console.log(`🎨 Switched to ${this.modes[this.currentMode].name} mode`);
        
        // Emit event for UI update
        if (window.app && window.app.onVisualizationModeChanged) {
            window.app.onVisualizationModeChanged(this.currentMode, this.modes[this.currentMode]);
        }
    }
    
    /**
     * Toggle emotion category visibility
     */
    toggleEmotionCategory(index) {
        const categories = ['hope', 'sorrow', 'transformative', 'ambivalent', 'reflective_neutral'];
        if (index >= 0 && index < categories.length) {
            const category = categories[index];
            if (this.visibleCategories.has(category)) {
                this.visibleCategories.delete(category);
            } else {
                this.visibleCategories.add(category);
            }
            console.log(`🎨 Toggled ${category} visibility:`, this.visibleCategories.has(category));
            
            // Emit event for UI update
            if (window.app && window.app.onCategoryToggled) {
                window.app.onCategoryToggled(category, this.visibleCategories.has(category));
            }
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
                cursor: grab;
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
            
            console.log('✅ Enhanced GLSL canvas initialized');
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
        
        // Create shader programs for different modes
        this.createShaderPrograms();
        
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
        
        // Set viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        console.log('✅ WebGL setup complete');
    }
    
    createShaderPrograms() {
        // Vertex shader (same for both modes)
        const vertexSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Landscape mode fragment shader
        const landscapeFragmentSource = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform vec2 u_camera;
            uniform float u_zoom;
            uniform float u_time;
            uniform float u_intensity;
            uniform float u_timeScale;
            uniform vec3 u_sentimentColor;
            
            #define PI 3.14159265358979
            #define TAU 6.283185307179586
            
            void main() {
                vec3 c = vec3(0.0);
                vec2 R = u_resolution;
                vec2 uv = (gl_FragCoord.xy - 0.5 * R) / R.y * 2.0;
                
                // Apply camera transformations
                uv = (uv - u_camera) * u_zoom;
                
                vec2 m = u_mouse / R.y * 2.0 - vec2(R.x/R.y, 1.0);
                
                float t = (length(u_mouse) > 0.0) ? 
                          atan(m.x, -m.y) : 
                          -0.54 + (u_time * u_timeScale * TAU) / 3600.0;
                      
                float n = (cos(t) > 0.0) ? sin(t) : 1.0 / sin(t);
                float e = n * 2.0;
                float z = clamp(pow(500.0, n), 1e-16, 1e+18);
                
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
        
        // Geometric mode fragment shader (your provided shader)
        const geometricFragmentSource = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform vec2 u_camera;
            uniform float u_zoom;
            uniform float u_time;
            uniform float u_intensity;
            uniform vec3 u_sentimentColor;
            
            #define T (u_time*5.)
            #define A(v) mat2(cos(m.v*3.1416 + vec4(0, -1.5708, 1.5708, 0)))
            #define H(v) (cos(((v)+.5)*6.2832 + radians(vec3(60, 0, -60)))*.5+.5)
            
            float map(vec3 u) {
                float t = T,
                      l = 5.,
                      w = 40.,
                      s = .4,
                      f = 1e20, i = 0., y, z;
                
                u.yz = -u.zy;
                u.xy = vec2(atan(u.x, u.y), length(u.xy));
                u.x += t/6.;
                
                vec3 p;
                for (; i++<l;) {
                    p = u;
                    y = round(max(p.y-i, 0.)/l)*l+i;
                    p.x *= y;
                    p.x -= sqrt(y*t*t*2.);
                    p.x -= round(p.x/6.2832)*6.2832;
                    p.y -= y;
                    p.z += sqrt(y/w)*w;
                    z = cos(y*t/50.)*.5+.5;
                    p.z += z*2.;
                    p = abs(p);
                    f = min(f, max(p.x, max(p.y, p.z)) - s*z);
                }
                
                return f;
            }
            
            void main() {
                float l = 50.,
                      i = 0., d = i, s, r;
                
                vec2 R = u_resolution.xy;
                vec2 uv = (gl_FragCoord.xy - R/2.) / R.y;
                
                // Apply camera transformations
                uv = (uv - u_camera) * u_zoom;
                
                vec2 m = u_mouse.xy / R.y;
                if (length(u_mouse) == 0.0) {
                    m = vec2(0, -.17);
                } else {
                    m = (u_mouse.xy - R/2.)/R.y;
                }
                
                vec3 o = vec3(0, 20, -120),
                     u = normalize(vec3(uv, R.y/R.x)),
                     c = vec3(0), p;
                
                mat2 v = A(y),
                     h = A(x);
                
                for (; i++<l;) {
                    p = u*d + o;
                    p.yz *= v;
                    p.xz *= h;
                    
                    s = map(p);
                    r = (cos(round(length(p.xz))*T/50.)*.7 - 1.8)/2.;
                    c += min(s, exp(-s/.07))
                       * H(r+.5) * (r+2.4);
                    
                    if (s < 1e-3 || d > 1e3) break;
                    d += s*.7;
                }
                
                // Mix with sentiment color
                c = mix(c, u_sentimentColor, 0.2);
                
                gl_FragColor = vec4(exp(log(c)/2.2), 1);
            }
        `;
        
        // Create programs
        this.programs.landscape = this.createProgram(vertexSource, landscapeFragmentSource);
        this.programs.geometric = this.createProgram(vertexSource, geometricFragmentSource);
        
        // Get uniform locations for both programs
        this.uniforms.landscape = this.getUniformLocations(this.programs.landscape);
        this.uniforms.geometric = this.getUniformLocations(this.programs.geometric);
    }
    
    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('❌ Program link error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        
        // Get position attribute location and enable it
        const positionLocation = this.gl.getAttribLocation(program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        return program;
    }
    
    getUniformLocations(program) {
        return {
            resolution: this.gl.getUniformLocation(program, 'u_resolution'),
            mouse: this.gl.getUniformLocation(program, 'u_mouse'),
            camera: this.gl.getUniformLocation(program, 'u_camera'),
            zoom: this.gl.getUniformLocation(program, 'u_zoom'),
            time: this.gl.getUniformLocation(program, 'u_time'),
            intensity: this.gl.getUniformLocation(program, 'u_intensity'),
            timeScale: this.gl.getUniformLocation(program, 'u_timeScale'),
            sentimentColor: this.gl.getUniformLocation(program, 'u_sentimentColor')
        };
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
                self.drawUI();
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
        if (!this.gl || !this.programs[this.currentMode]) return;
        
        const currentTime = (Date.now() - this.startTime) / 1000;
        
        // Smooth camera zoom
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        const currentProgram = this.programs[this.currentMode];
        const currentUniforms = this.uniforms[this.currentMode];
        
        this.gl.useProgram(currentProgram);
        
        // Set uniforms
        this.gl.uniform2f(currentUniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(currentUniforms.mouse, this.mouse.x, this.mouse.y);
        this.gl.uniform2f(currentUniforms.camera, this.camera.x, this.camera.y);
        this.gl.uniform1f(currentUniforms.zoom, this.camera.zoom);
        this.gl.uniform1f(currentUniforms.time, currentTime);
        this.gl.uniform1f(currentUniforms.intensity, this.intensity);
        if (currentUniforms.timeScale) {
            this.gl.uniform1f(currentUniforms.timeScale, this.timeScale);
        }
        this.gl.uniform3f(currentUniforms.sentimentColor, ...this.sentimentColor);
        
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawUI() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        
        // Draw mode indicator
        p.fill(255, 255, 255, 200);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        p.text(`Mode: ${this.modes[this.currentMode].name} (M to toggle)`, 20, 20);
        
        // Draw camera info
        p.text(`Zoom: ${this.camera.zoom.toFixed(2)}x (Mouse wheel)`, 20, 45);
        p.text(`Camera: (${this.camera.x.toFixed(2)}, ${this.camera.y.toFixed(2)}) (Drag to move)`, 20, 70);
        
        // Draw controls help
        p.textSize(12);
        p.fill(255, 255, 255, 150);
        p.text('Controls: M=Mode, R=Reset, 1-5=Toggle emotions, Wheel=Zoom, Drag=Move', 20, p.height - 30);
        
        // Draw visible categories
        let y = 100;
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
    
    updateBlobPhysics() {
        // Update blob positions and interactions
        this.blobs.forEach(blob => {
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
            
            // Boundary checking
            if (blob.x < -blob.size) blob.x = window.innerWidth + blob.size;
            if (blob.x > window.innerWidth + blob.size) blob.x = -blob.size;
            if (blob.y < -blob.size) blob.y = window.innerHeight + blob.size;
            if (blob.y > window.innerHeight + blob.size) blob.y = -blob.size;
        });
    }
    
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
            
            // Draw particle
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
    
    drawBlobs() {
        if (!this.p5Instance) return;
        
        const p = this.p5Instance;
        
        this.blobs.forEach(blob => {
            if (blob.opacity <= 0.01) return; // Skip invisible blobs
            
            const color = this.sentimentColors[blob.category] || [1, 1, 1];
            
            // Draw blob glow
            p.fill(
                color[0] * 255,
                color[1] * 255,
                color[2] * 255,
                blob.opacity * 30
            );
            p.noStroke();
            p.circle(blob.x, blob.y, blob.size * 2);
            
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
            }
        });
    }
    
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
    
    showBlobDetails(blob, x, y) {
        // Remove existing tooltip
        this.hideTooltip();
        
        // Create new tooltip with enhanced analysis information
        const tooltip = document.createElement('div');
        tooltip.className = 'blob-tooltip';
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'scale(0.8) translateY(10px)';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="tooltip-category ${blob.category}">
                    <div class="category-dot"></div>
                    <span>${blob.category.replace('_', ' ').toUpperCase()}</span>
                </div>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="tooltip-content">
                <div class="tooltip-text">"${blob.text}"</div>
                <div class="tooltip-stats">
                    <div class="stat">
                        <span class="stat-label">Confidence:</span>
                        <span class="stat-value">${(blob.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Intensity:</span>
                        <span class="stat-value">${(blob.intensity * 100).toFixed(1)}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Score:</span>
                        <span class="stat-value">${blob.score.toFixed(3)}</span>
                    </div>
                </div>
                ${blob.explanation ? `<div class="tooltip-explanation">${blob.explanation}</div>` : ''}
                <div class="tooltip-meta">
                    <div class="meta-item">
                        <span class="meta-label">Speaker:</span>
                        <span class="meta-value">${blob.speaker_name || 'Anonymous'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Time:</span>
                        <span class="meta-value">${blob.created_at ? new Date(blob.created_at).toLocaleString() : 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Position tooltip
        const rect = this.canvas.getBoundingClientRect();
        tooltip.style.left = `${Math.min(x + 20, window.innerWidth - 320)}px`;
        tooltip.style.top = `${Math.max(y - 100, 20)}px`;
        
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
        
        // Animate tooltip entrance
        if (typeof anime !== 'undefined') {
            anime({
                targets: tooltip,
                opacity: [0, 1],
                scale: [0.8, 1],
                translateY: [10, 0],
                duration: 400,
                easing: 'easeOutElastic(1, .8)',
                complete: () => {
                    tooltip.classList.add('visible');
                }
            });
            
            // Animate stats with stagger
            const stats = tooltip.querySelectorAll('.stat');
            anime({
                targets: stats,
                opacity: [0, 1],
                translateY: [10, 0],
                delay: anime.stagger(100, {start: 200}),
                duration: 300,
                easing: 'easeOutCubic'
            });
        } else {
            // Fallback animation
            setTimeout(() => {
                tooltip.style.opacity = '1';
                tooltip.style.transform = 'scale(1) translateY(0)';
                tooltip.classList.add('visible');
            }, 50);
        }
        
        // Auto-hide after delay
        this.setupTooltipAutoHide(tooltip);
    }
    
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
    
    cleanupRipples() {
        const currentTime = Date.now();
        this.ripples = this.ripples.filter(ripple => {
            return (currentTime - ripple.startTime) < 1000;
        });
    }
    
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
        this.updateBackgroundSentiment();
        
        // Update fallback mode if applicable
        if (this.isFallbackMode) {
            this.updateFallbackStats();
        }
        
        console.log('🎨 Added blob:', blob);
        return blob;
    }
    
    calculateBlobSize(blobData) {
        const baseSize = 20;
        const intensityMultiplier = (blobData.intensity || 0.5) * 30;
        const confidenceMultiplier = (blobData.confidence || 0.5) * 20;
        return Math.max(15, Math.min(50, baseSize + intensityMultiplier + confidenceMultiplier));
    }
    
    updateBackgroundSentiment() {
        if (this.blobs.length === 0) {
            this.sentimentColor = [1, 1, 1];
            return;
        }
        
        // Calculate average sentiment color from visible blobs
        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        
        this.blobs.forEach(blob => {
            if (this.visibleCategories.has(blob.category)) {
                const color = this.sentimentColors[blob.category] || [1, 1, 1];
                const weight = blob.confidence || 0.5;
                
                totalR += color[0] * weight;
                totalG += color[1] * weight;
                totalB += color[2] * weight;
                count += weight;
            }
        });
        
        if (count > 0) {
            this.sentimentColor = [
                totalR / count,
                totalG / count,
                totalB / count
            ];
        }
    }
    
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
    
    removeOldestBlob() {
        if (this.blobs.length > 0) {
            const removed = this.blobs.shift();
            this.selectedBlobs.delete(removed.id);
            console.log('🗑️ Removed oldest blob:', removed.id);
        }
    }
    
    clearAllBlobs() {
        this.blobs = [];
        this.selectedBlobs.clear();
        this.hideTooltip();
        this.updateBackgroundSentiment();
        console.log('🧹 Cleared all blobs');
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
    
    // Public API methods
    setVisualizationMode(mode) {
        if (this.modes[mode]) {
            this.currentMode = mode;
            console.log(`🎨 Visualization mode set to: ${this.modes[mode].name}`);
        }
    }
    
    getVisualizationMode() {
        return {
            current: this.currentMode,
            available: this.modes
        };
    }
    
    setCategoryVisibility(category, visible) {
        if (visible) {
            this.visibleCategories.add(category);
        } else {
            this.visibleCategories.delete(category);
        }
        this.updateBackgroundSentiment();
    }
    
    getCategoryVisibility() {
        return Array.from(this.visibleCategories);
    }
    
    /**
     * Update fallback mode statistics
     */
    updateFallbackStats() {
        const fallbackCount = document.getElementById('fallback-blob-count');
        if (fallbackCount) {
            fallbackCount.textContent = this.blobs.length;
            
            // Add a simple animation
            fallbackCount.style.transform = 'scale(1.2)';
            fallbackCount.style.color = '#FFD700';
            
            setTimeout(() => {
                fallbackCount.style.transform = 'scale(1)';
                fallbackCount.style.color = '#FFD700';
            }, 200);
        }
    }
}

// Export for global access
window.EmotionVisualizer = EmotionVisualizer; 