/**
 * Integrated GLSL Blob-Particle Emotion Visualizer
 * Blobs as particles within the vortex shader
 * Integrated GLSL Blob-Particle Emotion Visualizer
 * Blobs as particles within the vortex shader
 */

class IntegratedEmotionVisualizer {
class IntegratedEmotionVisualizer {
    constructor() {
        // WebGL/GLSL properties
        this.gl = null;
        this.programs = {}; // Multiple shader programs for different modes
        this.canvas = null;
        this.uniforms = {};
        this.startTime = Date.now();
        this.mouseX = 0;
        this.mouseY = 0;
        this.intensity = 1;
        this.timeScale = 1;
        this.zoom = 1;
        this.sentimentColor = [1, 1, 1];
        this.sentimentColor = [1, 1, 1];
        
        // Blob data for shader
        // Blob data for shader
        this.blobs = [];
        this.maxBlobs = 80;
        this.blobIdCounter = 0;
        
        // Uniforms for blob data
        this.blobPositions = new Float32Array(this.maxBlobs * 2); // x, y pairs
        this.blobColors = new Float32Array(this.maxBlobs * 3);    // r, g, b triplets
        this.blobSizes = new Float32Array(this.maxBlobs);         // radius values
        this.blobCount = 0;
        this.blobIdCounter = 0;
        
        // Uniforms for blob data
        this.blobPositions = new Float32Array(this.maxBlobs * 2); // x, y pairs
        this.blobColors = new Float32Array(this.maxBlobs * 3);    // r, g, b triplets
        this.blobSizes = new Float32Array(this.maxBlobs);         // radius values
        this.blobCount = 0;
        
        // Sentiment color palettes
        this.sentimentColors = {
            hope: [1.0, 0.84, 0.0],
            sorrow: [0.29, 0.56, 0.89],
            transformative: [0.61, 0.35, 0.71],
            ambivalent: [0.91, 0.30, 0.24],
            reflective_neutral: [0.58, 0.65, 0.65]
            hope: [1.0, 0.84, 0.0],
            sorrow: [0.29, 0.56, 0.89],
            transformative: [0.61, 0.35, 0.71],
            ambivalent: [0.91, 0.30, 0.24],
            reflective_neutral: [0.58, 0.65, 0.65]
        };
        
        // Interaction
        this.selectedBlobIndex = -1;
        this.tooltipVisible = false;
        // Interaction
        this.selectedBlobIndex = -1;
        this.tooltipVisible = false;
        
        console.log('🎨 Integrated GLSL Blob-Particle Visualizer initialized');
        console.log('🎨 Integrated GLSL Blob-Particle Visualizer initialized');
    }
    
    async init(container) {
        console.log('🎨 Initializing Integrated Visualizer...');
        console.log('🎨 Initializing Integrated Visualizer...');
        
        try {
            if (!container) {
                throw new Error('Container element is required');
            }
            
            if (!container) {
                throw new Error('Container element is required');
            }
            
            this.container = container;
            console.log('📦 Container found:', container.id);
            console.log('📦 Container found:', container.id);
            
            const success = this.initializeCanvas();
            
            if (!success) {
                console.warn('⚠️ GLSL initialization failed, falling back to basic mode');
                this.initializeFallbackMode();
                return true; // Still return success for fallback mode
            }
            
            console.log('🎯 Starting animation loop...');
            console.log('🎯 Starting animation loop...');
            this.animate();
            
            // Add sample data for testing (remove this in production)
            setTimeout(() => {
                this.addSampleData();
            }, 1000);
            
            // Add sample data for testing (remove this in production)
            setTimeout(() => {
                this.addSampleData();
            }, 1000);
            
            window.addEventListener('resize', () => {
                console.log('📏 Window resized, updating canvas...');
                console.log('📏 Window resized, updating canvas...');
                this.handleResize();
            });
            
            console.log('✅ Integrated Visualizer ready');
            console.log('✅ Integrated Visualizer ready');
            return true;
            
        } catch (error) {
            console.error('❌ Visualizer initialization failed:', error);
            console.error('Stack trace:', error.stack);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }
    
    handleResize() {
        if (this.canvas && this.gl) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    initializeCanvas() {
        try {
            const container = document.getElementById('visualization-container');
            if (!container) {
                console.error('❌ Visualization container not found');
                return false;
            }
            
            // Create single GLSL canvas
            // Create single GLSL canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'integrated-canvas';
            this.canvas.id = 'integrated-canvas';
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                width: 100%;
                height: 100%;
                cursor: pointer;
                cursor: pointer;
            `;
            container.appendChild(this.canvas);
            
            this.setupWebGL();
            
            console.log('✅ Integrated canvas initialized');
            console.log('✅ Integrated canvas initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Canvas initialization failed:', error);
            return false;
        }
    }
    
    setupWebGL() {
        console.log('🔧 Setting up WebGL...');
        
        console.log('🔧 Setting up WebGL...');
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        console.log(`📐 Canvas size: ${this.canvas.width}x${this.canvas.height}`);
        console.log(`📐 Canvas size: ${this.canvas.width}x${this.canvas.height}`);
        
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.error('❌ WebGL not supported');
            throw new Error('WebGL not supported by this browser');
            throw new Error('WebGL not supported by this browser');
        }
        
        console.log('✅ WebGL context created');
        console.log('🔍 WebGL info:', {
            vendor: this.gl.getParameter(this.gl.VENDOR),
            renderer: this.gl.getParameter(this.gl.RENDERER),
            version: this.gl.getParameter(this.gl.VERSION)
        });
        
        console.log('✅ WebGL context created');
        console.log('🔍 WebGL info:', {
            vendor: this.gl.getParameter(this.gl.VENDOR),
            renderer: this.gl.getParameter(this.gl.RENDERER),
            version: this.gl.getParameter(this.gl.VERSION)
        });
        
        // Vertex shader
        // Vertex shader
        const vertexSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        console.log('🔨 Compiling shaders...');
        
        // Enhanced fragment shader with blob particles
        console.log('🔨 Compiling shaders...');
        
        // Enhanced fragment shader with blob particles
        const fragmentSource = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform vec2 u_camera;
            uniform float u_zoom;
            uniform float u_time;
            uniform float u_intensity;
            uniform float u_timeScale;
            uniform vec3 u_sentimentColor;
            
            // Blob data
            uniform int u_blobCount;
            uniform vec2 u_blobPositions[${this.maxBlobs}];
            uniform vec3 u_blobColors[${this.maxBlobs}];
            uniform float u_blobSizes[${this.maxBlobs}];
            uniform int u_selectedBlob;
            
            // Blob data
            uniform int u_blobCount;
            uniform vec2 u_blobPositions[${this.maxBlobs}];
            uniform vec3 u_blobColors[${this.maxBlobs}];
            uniform float u_blobSizes[${this.maxBlobs}];
            uniform int u_selectedBlob;
            
            #define PI 3.14159265358979
            #define TAU 6.283185307179586
            #define MAX_BLOBS ${this.maxBlobs}
            
            // Smooth minimum function for blob blending
            float smin(float a, float b, float k) {
                float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
                return mix(b, a, h) - k * h * (1.0 - h);
            }
            
            // Distance to blob field
            float blobField(vec2 pos) {
                float dist = 1000.0;
                
                for (int i = 0; i < MAX_BLOBS; i++) {
                    if (i >= u_blobCount) break;
                    
                    vec2 blobPos = u_blobPositions[i];
                    float blobSize = u_blobSizes[i];
                    
                    // Convert screen coordinates to shader coordinates
                    vec2 screenPos = (blobPos / u_resolution) * 2.0 - 1.0;
                    screenPos.y = -screenPos.y; // Flip Y coordinate
                    
                    float blobDist = length(pos - screenPos) - (blobSize / u_resolution.y * 2.0);
                    dist = smin(dist, blobDist, 0.1);
                }
                
                return dist;
            }
            
            // Get blob influence at position
            vec3 getBlobInfluence(vec2 pos) {
                vec3 influence = vec3(0.0);
                float totalWeight = 0.0;
                
                for (int i = 0; i < MAX_BLOBS; i++) {
                    if (i >= u_blobCount) break;
                    
                    vec2 blobPos = u_blobPositions[i];
                    vec3 blobColor = u_blobColors[i];
                    float blobSize = u_blobSizes[i];
                    
                    vec2 screenPos = (blobPos / u_resolution) * 2.0 - 1.0;
                    screenPos.y = -screenPos.y;
                    
                    float dist = length(pos - screenPos);
                    float radius = (blobSize / u_resolution.y * 2.0) * 2.0; // Larger influence area
                    
                    if (dist < radius) {
                        float weight = 1.0 - smoothstep(0.0, radius, dist);
                        weight = pow(weight, 0.5); // Softer falloff
                        
                        // Highlight selected blob
                        if (i == u_selectedBlob) {
                            weight *= 1.5;
                            blobColor = mix(blobColor, vec3(1.0, 1.0, 1.0), 0.4);
                        }
                        
                        influence += blobColor * weight;
                        totalWeight += weight;
                    }
                }
                
                return totalWeight > 0.0 ? influence / totalWeight : vec3(0.0);
            }
            
            // Enhanced vortex function with blob integration
            vec3 vortexWithBlobs(vec2 uv) {
            #define MAX_BLOBS ${this.maxBlobs}
            
            // Smooth minimum function for blob blending
            float smin(float a, float b, float k) {
                float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
                return mix(b, a, h) - k * h * (1.0 - h);
            }
            
            // Distance to blob field
            float blobField(vec2 pos) {
                float dist = 1000.0;
                
                for (int i = 0; i < MAX_BLOBS; i++) {
                    if (i >= u_blobCount) break;
                    
                    vec2 blobPos = u_blobPositions[i];
                    float blobSize = u_blobSizes[i];
                    
                    // Convert screen coordinates to shader coordinates
                    vec2 screenPos = (blobPos / u_resolution) * 2.0 - 1.0;
                    screenPos.y = -screenPos.y; // Flip Y coordinate
                    
                    float blobDist = length(pos - screenPos) - (blobSize / u_resolution.y * 2.0);
                    dist = smin(dist, blobDist, 0.1);
                }
                
                return dist;
            }
            
            // Get blob influence at position
            vec3 getBlobInfluence(vec2 pos) {
                vec3 influence = vec3(0.0);
                float totalWeight = 0.0;
                
                for (int i = 0; i < MAX_BLOBS; i++) {
                    if (i >= u_blobCount) break;
                    
                    vec2 blobPos = u_blobPositions[i];
                    vec3 blobColor = u_blobColors[i];
                    float blobSize = u_blobSizes[i];
                    
                    vec2 screenPos = (blobPos / u_resolution) * 2.0 - 1.0;
                    screenPos.y = -screenPos.y;
                    
                    float dist = length(pos - screenPos);
                    float radius = (blobSize / u_resolution.y * 2.0) * 2.0; // Larger influence area
                    
                    if (dist < radius) {
                        float weight = 1.0 - smoothstep(0.0, radius, dist);
                        weight = pow(weight, 0.5); // Softer falloff
                        
                        // Highlight selected blob
                        if (i == u_selectedBlob) {
                            weight *= 1.5;
                            blobColor = mix(blobColor, vec3(1.0, 1.0, 1.0), 0.4);
                        }
                        
                        influence += blobColor * weight;
                        totalWeight += weight;
                    }
                }
                
                return totalWeight > 0.0 ? influence / totalWeight : vec3(0.0);
            }
            
            // Enhanced vortex function with blob integration
            vec3 vortexWithBlobs(vec2 uv) {
                vec2 R = u_resolution;
                vec2 m = (u_mouse - 0.5 * R) / R.y * 2.0;
                
                // Vortex calculations
                // Vortex calculations
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
                
                // Base vortex pattern
                vec3 c = vec3(0.0);
                c += sin(ts / 2.0) * u_intensity * 0.4;
                // Base vortex pattern
                vec3 c = vec3(0.0);
                c += sin(ts / 2.0) * u_intensity * 0.4;
                c *= cos(ts);
                c *= pow(abs(sin((r - i) * PI)), abs(e) + 5.0);
                c *= 0.3 + abs(vd);
                c *= 0.3 + abs(vd);
                c = min(c, pow(length(u) / z, -1.0 / n));
                
                // Get blob influence
                vec3 blobInfluence = getBlobInfluence(uv);
                float blobStrength = length(blobInfluence);
                
                // Blend vortex with blob data
                if (blobStrength > 0.0) {
                    // Create data-driven vortex coloring
                    vec3 dataColor = mix(
                        vec3(vd + 1.0, abs(sin(t)), 1.0 - vd), 
                        blobInfluence, 
                        0.7
                    );
                    
                    // Enhance vortex intensity near data points
                    float dataIntensity = 1.0 + blobStrength * 2.0;
                    c *= dataIntensity;
                    c += (c * 1.5) - (dataColor * 0.4);
                    
                    // Add blob color influence
                    c = mix(c, blobInfluence, smoothstep(0.0, 1.0, blobStrength * 0.8));
                } else {
                    // Standard vortex coloring when no data nearby
                    vec3 rgb = mix(
                        vec3(vd + 1.0, abs(sin(t)), 1.0 - vd), 
                        u_sentimentColor, 
                        0.4
                    );
                    c += (c * 1.2) - (rgb * 0.6);
                }
                
                return c;
            }
            
            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y * 2.0;
                
                // Get vortex with blob integration
                vec3 color = vortexWithBlobs(uv);
                // Get blob influence
                vec3 blobInfluence = getBlobInfluence(uv);
                float blobStrength = length(blobInfluence);
                
                // Blend vortex with blob data
                if (blobStrength > 0.0) {
                    // Create data-driven vortex coloring
                    vec3 dataColor = mix(
                        vec3(vd + 1.0, abs(sin(t)), 1.0 - vd), 
                        blobInfluence, 
                        0.7
                    );
                    
                    // Enhance vortex intensity near data points
                    float dataIntensity = 1.0 + blobStrength * 2.0;
                    c *= dataIntensity;
                    c += (c * 1.5) - (dataColor * 0.4);
                    
                    // Add blob color influence
                    c = mix(c, blobInfluence, smoothstep(0.0, 1.0, blobStrength * 0.8));
                } else {
                    // Standard vortex coloring when no data nearby
                    vec3 rgb = mix(
                        vec3(vd + 1.0, abs(sin(t)), 1.0 - vd), 
                        u_sentimentColor, 
                        0.4
                    );
                    c += (c * 1.2) - (rgb * 0.6);
                }
                
                return c;
            }
            
            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y * 2.0;
                
                // Get vortex with blob integration
                vec3 color = vortexWithBlobs(uv);
                
                // Add subtle vignette
                // Add subtle vignette
                float dist = length(uv);
                color *= 1.0 - smoothstep(0.7, 1.3, dist);
                
                // Enhance areas near blob data
                float blobField = blobField(uv);
                if (blobField < 0.2) {
                    float enhancement = 1.0 + (0.2 - blobField) * 3.0;
                    color *= enhancement;
                }
                
                // Add subtle glow effect for data points
                vec3 blobInfluence = getBlobInfluence(uv);
                if (length(blobInfluence) > 0.0) {
                    color += blobInfluence * 0.3 * sin(u_time * 2.0) * 0.5 + 0.5;
                }
                color *= 1.0 - smoothstep(0.7, 1.3, dist);
                
                // Enhance areas near blob data
                float blobField = blobField(uv);
                if (blobField < 0.2) {
                    float enhancement = 1.0 + (0.2 - blobField) * 3.0;
                    color *= enhancement;
                }
                
                // Add subtle glow effect for data points
                vec3 blobInfluence = getBlobInfluence(uv);
                if (length(blobInfluence) > 0.0) {
                    color += blobInfluence * 0.3 * sin(u_time * 2.0) * 0.5 + 0.5;
                }
                
                gl_FragColor = vec4(color, 1.0);
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        // Create and link shaders
        // Create and link shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
        if (!vertexShader || !fragmentShader) {
            throw new Error('Failed to compile shaders');
        }
        
        console.log('✅ Shaders compiled successfully');
        
        if (!vertexShader || !fragmentShader) {
            throw new Error('Failed to compile shaders');
        }
        
        console.log('✅ Shaders compiled successfully');
        
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(this.program);
            console.error('❌ Program link error:', error);
            throw new Error(`Shader program link failed: ${error}`);
            const error = this.gl.getProgramInfoLog(this.program);
            console.error('❌ Program link error:', error);
            throw new Error(`Shader program link failed: ${error}`);
        }
        
        console.log('✅ Shader program linked successfully');
        
        console.log('✅ Shader program linked successfully');
        
        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
            timeScale: this.gl.getUniformLocation(this.program, 'u_timeScale'),
            zoom: this.gl.getUniformLocation(this.program, 'u_zoom'),
            sentimentColor: this.gl.getUniformLocation(this.program, 'u_sentimentColor'),
            blobCount: this.gl.getUniformLocation(this.program, 'u_blobCount'),
            blobPositions: this.gl.getUniformLocation(this.program, 'u_blobPositions'),
            blobColors: this.gl.getUniformLocation(this.program, 'u_blobColors'),
            blobSizes: this.gl.getUniformLocation(this.program, 'u_blobSizes'),
            selectedBlob: this.gl.getUniformLocation(this.program, 'u_selectedBlob')
        };
        
        console.log('🎯 Uniforms located:', Object.keys(this.uniforms).length);
        
        // Create vertex buffer
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
            sentimentColor: this.gl.getUniformLocation(this.program, 'u_sentimentColor'),
            blobCount: this.gl.getUniformLocation(this.program, 'u_blobCount'),
            blobPositions: this.gl.getUniformLocation(this.program, 'u_blobPositions'),
            blobColors: this.gl.getUniformLocation(this.program, 'u_blobColors'),
            blobSizes: this.gl.getUniformLocation(this.program, 'u_blobSizes'),
            selectedBlob: this.gl.getUniformLocation(this.program, 'u_selectedBlob')
        };
        
        console.log('🎯 Uniforms located:', Object.keys(this.uniforms).length);
        
        // Create vertex buffer
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        
        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Mouse interactions
        // Mouse interactions
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = window.innerHeight - e.clientY;
            this.mouseY = window.innerHeight - e.clientY;
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e.clientX, e.clientY);
        });
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e.clientX, e.clientY);
        });
        
        console.log('✅ WebGL setup complete with blob integration');
        
        // Test GLSL functionality
        if (!this.testGLSL()) {
            throw new Error('GLSL functionality test failed');
        }
        console.log('✅ WebGL setup complete with blob integration');
        
        // Test GLSL functionality
        if (!this.testGLSL()) {
            throw new Error('GLSL functionality test failed');
        }
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
    
    animate() {
        if (!this.gl || !this.programs[this.currentMode]) return;
        
        const currentTime = (Date.now() - this.startTime) / 1000;
        
        // Update blob physics
        this.updateBlobPhysics();
        
        // Update blob physics
        this.updateBlobPhysics();
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        const currentProgram = this.programs[this.currentMode];
        const currentUniforms = this.uniforms[this.currentMode];
        
        this.gl.useProgram(currentProgram);
        
        // Set standard uniforms
        // Set standard uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
        this.gl.uniform1f(this.uniforms.time, currentTime);
        this.gl.uniform1f(this.uniforms.intensity, this.intensity);
        this.gl.uniform1f(this.uniforms.timeScale, this.timeScale);
        this.gl.uniform1f(this.uniforms.zoom, this.zoom);
        this.gl.uniform3f(this.uniforms.sentimentColor, ...this.sentimentColor);
        
        // Set blob uniforms
        this.gl.uniform1i(this.uniforms.blobCount, this.blobCount);
        this.gl.uniform2fv(this.uniforms.blobPositions, this.blobPositions);
        this.gl.uniform3fv(this.uniforms.blobColors, this.blobColors);
        this.gl.uniform1fv(this.uniforms.blobSizes, this.blobSizes);
        this.gl.uniform1i(this.uniforms.selectedBlob, this.selectedBlobIndex);
        
        // Set blob uniforms
        this.gl.uniform1i(this.uniforms.blobCount, this.blobCount);
        this.gl.uniform2fv(this.uniforms.blobPositions, this.blobPositions);
        this.gl.uniform3fv(this.uniforms.blobColors, this.blobColors);
        this.gl.uniform1fv(this.uniforms.blobSizes, this.blobSizes);
        this.gl.uniform1i(this.uniforms.selectedBlob, this.selectedBlobIndex);
        
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(() => this.animate());
    }
    
    updateBlobPhysics() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const time = Date.now() * 0.001;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const time = Date.now() * 0.001;
        
        this.blobs.forEach((blob, index) => {
            // Create more dynamic orbital motion based on emotion category
            const categoryOffset = this.getCategoryOffset(blob.category);
            const angle = time * 0.2 + blob.initialAngle + categoryOffset;
            
            // Vary orbit radius based on confidence and emotion intensity
            const baseRadius = blob.orbitRadius;
            const confidenceRadius = baseRadius * (0.5 + blob.confidence * 0.5);
            const emotionRadius = confidenceRadius + Math.sin(time * 0.5 + blob.id) * 30;
        this.blobs.forEach((blob, index) => {
            // Create more dynamic orbital motion based on emotion category
            const categoryOffset = this.getCategoryOffset(blob.category);
            const angle = time * 0.2 + blob.initialAngle + categoryOffset;
            
            // Vary orbit radius based on confidence and emotion intensity
            const baseRadius = blob.orbitRadius;
            const confidenceRadius = baseRadius * (0.5 + blob.confidence * 0.5);
            const emotionRadius = confidenceRadius + Math.sin(time * 0.5 + blob.id) * 30;
            
            // Create elliptical orbits with different eccentricities per category
            const eccentricity = this.getCategoryEccentricity(blob.category);
            blob.x = centerX + Math.cos(angle) * emotionRadius;
            blob.y = centerY + Math.sin(angle) * emotionRadius * eccentricity;
            
            // Add subtle breathing effect based on emotion intensity
            const breathingScale = 1.0 + Math.sin(time * 1.5 + blob.id) * 0.1;
            const currentRadius = blob.radius * breathingScale;
            
            // Update shader arrays
            const i = index * 2;
            this.blobPositions[i] = blob.x;
            this.blobPositions[i + 1] = blob.y;
            
            const colorIndex = index * 3;
            const baseColor = this.sentimentColors[blob.category] || [1, 1, 1];
            
            // Enhance color based on confidence and selection
            let color = [...baseColor];
            if (index === this.selectedBlobIndex) {
                color = color.map(c => Math.min(1.0, c * 1.3));
            }
            // Create elliptical orbits with different eccentricities per category
            const eccentricity = this.getCategoryEccentricity(blob.category);
            blob.x = centerX + Math.cos(angle) * emotionRadius;
            blob.y = centerY + Math.sin(angle) * emotionRadius * eccentricity;
            
            // Add subtle breathing effect based on emotion intensity
            const breathingScale = 1.0 + Math.sin(time * 1.5 + blob.id) * 0.1;
            const currentRadius = blob.radius * breathingScale;
            
            // Update shader arrays
            const i = index * 2;
            this.blobPositions[i] = blob.x;
            this.blobPositions[i + 1] = blob.y;
            
            const colorIndex = index * 3;
            const baseColor = this.sentimentColors[blob.category] || [1, 1, 1];
            
            // Enhance color based on confidence and selection
            let color = [...baseColor];
            if (index === this.selectedBlobIndex) {
                color = color.map(c => Math.min(1.0, c * 1.3));
            }
            
            // Add subtle pulsing based on confidence
            const pulse = 0.8 + 0.2 * Math.sin(time * 2.0 + blob.id);
            color = color.map(c => c * pulse);
            // Add subtle pulsing based on confidence
            const pulse = 0.8 + 0.2 * Math.sin(time * 2.0 + blob.id);
            color = color.map(c => c * pulse);
            
            this.blobColors[colorIndex] = color[0];
            this.blobColors[colorIndex + 1] = color[1];
            this.blobColors[colorIndex + 2] = color[2];
            
            this.blobSizes[index] = currentRadius;
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
    
    handleClick(x, y) {
            this.blobColors[colorIndex] = color[0];
            this.blobColors[colorIndex + 1] = color[1];
            this.blobColors[colorIndex + 2] = color[2];
            
            this.blobSizes[index] = currentRadius;
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
    
    handleClick(x, y) {
        // Find clicked blob
        let clickedBlobIndex = -1;
        let minDistance = Infinity;
        
        this.blobs.forEach((blob, index) => {
            const distance = Math.sqrt((x - blob.x) ** 2 + (y - blob.y) ** 2);
            if (distance <= blob.radius && distance < minDistance) {
                minDistance = distance;
                clickedBlobIndex = index;
            }
        });
        
        if (clickedBlobIndex !== -1) {
            this.selectedBlobIndex = clickedBlobIndex;
            this.showBlobTooltip(this.blobs[clickedBlobIndex], x, y);
        let clickedBlobIndex = -1;
        let minDistance = Infinity;
        
        this.blobs.forEach((blob, index) => {
            const distance = Math.sqrt((x - blob.x) ** 2 + (y - blob.y) ** 2);
            if (distance <= blob.radius && distance < minDistance) {
                minDistance = distance;
                clickedBlobIndex = index;
            }
        });
        
        if (clickedBlobIndex !== -1) {
            this.selectedBlobIndex = clickedBlobIndex;
            this.showBlobTooltip(this.blobs[clickedBlobIndex], x, y);
            
            // Add some visual feedback
            this.blobs[clickedBlobIndex].radius *= 1.2;
            setTimeout(() => {
                if (this.blobs[clickedBlobIndex]) {
                    this.blobs[clickedBlobIndex].radius /= 1.2;
                }
            }, 200);
        } else {
            this.selectedBlobIndex = -1;
            this.hideTooltip();
        }
            // Add some visual feedback
            this.blobs[clickedBlobIndex].radius *= 1.2;
            setTimeout(() => {
                if (this.blobs[clickedBlobIndex]) {
                    this.blobs[clickedBlobIndex].radius /= 1.2;
                }
            }, 200);
        } else {
            this.selectedBlobIndex = -1;
            this.hideTooltip();
        }
    }
    
    showBlobTooltip(blob, x, y) {
    showBlobTooltip(blob, x, y) {
        this.hideTooltip();
        
        // Create new tooltip with enhanced analysis information
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
        `;
        
        const category = blob.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const confidence = Math.round((blob.confidence || 0.5) * 100);
        
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="tooltip-category ${blob.category}">
                    <div class="category-dot"></div>
                    <span>${blob.category.replace('_', ' ').toUpperCase()}</span>
                </div>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Confidence:</strong> ${confidence}%
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Message:</strong><br>
                <em style="color: rgba(255, 255, 255, 0.8);">"${blob.text.substring(0, 150)}${blob.text.length > 150 ? '...' : ''}"</em>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        this.tooltipVisible = true;
        this.tooltipVisible = true;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.tooltipVisible) {
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.tooltipVisible) {
                this.hideTooltip();
            }
        }, 5000);
            }
        }, 5000);
    }
    
    hideTooltip() {
        const tooltips = document.querySelectorAll('.blob-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
        this.tooltipVisible = false;
        const tooltips = document.querySelectorAll('.blob-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
        this.tooltipVisible = false;
    }
    
    addBlob(blobData) {
        console.log('🫧 Adding integrated blob particle:', blobData.category);
        
        // Calculate better positioning based on category and existing blobs
        const categoryCount = this.blobs.filter(b => b.category === blobData.category).length;
        const categoryOffset = this.getCategoryOffset(blobData.category);
        console.log('🫧 Adding integrated blob particle:', blobData.category);
        
        // Calculate better positioning based on category and existing blobs
        const categoryCount = this.blobs.filter(b => b.category === blobData.category).length;
        const categoryOffset = this.getCategoryOffset(blobData.category);
        
        const blob = {
            id: blobData.id || `blob_${this.blobIdCounter++}`,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            radius: this.calculateBlobSize(blobData),
            
            // Enhanced orbital motion properties
            orbitRadius: this.calculateOrbitRadius(blobData, categoryCount),
            initialAngle: categoryOffset + (categoryCount * Math.PI * 0.3) + Math.random() * Math.PI * 0.2,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            radius: this.calculateBlobSize(blobData),
            
            // Enhanced orbital motion properties
            orbitRadius: this.calculateOrbitRadius(blobData, categoryCount),
            initialAngle: categoryOffset + (categoryCount * Math.PI * 0.3) + Math.random() * Math.PI * 0.2,
            
            // Data properties
            // Data properties
            category: blobData.category || 'reflective_neutral',
            score: blobData.score || 0,
            confidence: blobData.confidence || 0,
            intensity: blobData.intensity || Math.abs(blobData.score || 0),
            label: blobData.label || 'neutral',
            text: blobData.text || '',
            confidence: (typeof blobData.confidence === 'number') ? blobData.confidence : 0.5,
            score: (typeof blobData.score === 'number') ? blobData.score : 0,
            confidence: (typeof blobData.confidence === 'number') ? blobData.confidence : 0.5,
            score: (typeof blobData.score === 'number') ? blobData.score : 0,
            created_at: blobData.created_at || new Date().toISOString()
        };
        
        this.blobs.push(blob);
        
        // Remove oldest if too many
        // Remove oldest if too many
        if (this.blobs.length > this.maxBlobs) {
            this.blobs.shift();
            this.blobs.shift();
        }
        
        this.blobCount = this.blobs.length;
        this.blobCount = this.blobs.length;
        this.updateBackgroundSentiment();
        
        console.log(`🎨 Integrated blob particle created: ${blob.category} (${this.blobCount} total)`);
    }
    
    calculateOrbitRadius(blobData, categoryCount) {
        const baseRadius = 120;
        const categorySpread = 80;
        const confidenceRadius = (blobData.confidence || 0.5) * 60;
        const countOffset = categoryCount * 15; // Spread similar categories
        
        return baseRadius + categorySpread + confidenceRadius + countOffset + (Math.random() * 40 - 20);
        console.log(`🎨 Integrated blob particle created: ${blob.category} (${this.blobCount} total)`);
    }
    
    calculateOrbitRadius(blobData, categoryCount) {
        const baseRadius = 120;
        const categorySpread = 80;
        const confidenceRadius = (blobData.confidence || 0.5) * 60;
        const countOffset = categoryCount * 15; // Spread similar categories
        
        return baseRadius + categorySpread + confidenceRadius + countOffset + (Math.random() * 40 - 20);
    }
    
    calculateBlobSize(blobData) {
        const confidence = (typeof blobData.confidence === 'number') ? blobData.confidence : 0.5;
        const score = (typeof blobData.score === 'number') ? blobData.score : 0;
        const confidence = (typeof blobData.confidence === 'number') ? blobData.confidence : 0.5;
        const score = (typeof blobData.score === 'number') ? blobData.score : 0;
        
        const baseSize = 25;
        const baseSize = 25;
        const confidenceMultiplier = confidence * 25;
        const intensityMultiplier = Math.abs(score) * 20;
        
        return Math.max(15, Math.min(50, baseSize + confidenceMultiplier + intensityMultiplier));
        return Math.max(15, Math.min(50, baseSize + confidenceMultiplier + intensityMultiplier));
    }
    
    updateBackgroundSentiment() {
        if (this.blobs.length === 0) {
            this.sentimentColor = [1, 1, 1];
            return;
        }
        
        const sentimentCounts = {};
        this.blobs.forEach(blob => {
            sentimentCounts[blob.category] = (sentimentCounts[blob.category] || 0) + 1;
        });
        
        const dominantSentiment = Object.keys(sentimentCounts).reduce((a, b) => 
            sentimentCounts[a] > sentimentCounts[b] ? a : b
        );
        
        const targetColor = this.sentimentColors[dominantSentiment] || [1, 1, 1];
        
        // Smooth transition
        this.sentimentColor[0] += (targetColor[0] - this.sentimentColor[0]) * 0.1;
        this.sentimentColor[1] += (targetColor[1] - this.sentimentColor[1]) * 0.1;
        this.sentimentColor[2] += (targetColor[2] - this.sentimentColor[2]) * 0.1;
        // Smooth transition
        this.sentimentColor[0] += (targetColor[0] - this.sentimentColor[0]) * 0.1;
        this.sentimentColor[1] += (targetColor[1] - this.sentimentColor[1]) * 0.1;
        this.sentimentColor[2] += (targetColor[2] - this.sentimentColor[2]) * 0.1;
        
        console.log('🎨 Updated background sentiment to:', dominantSentiment);
    }
    
    clearAllBlobs() {
        this.blobs = [];
        this.blobCount = 0;
        this.selectedBlobIndex = -1;
        this.blobCount = 0;
        this.selectedBlobIndex = -1;
        this.hideTooltip();
        this.sentimentColor = [1, 1, 1];
        
        // Clear shader arrays
        this.blobPositions.fill(0);
        this.blobColors.fill(0);
        this.blobSizes.fill(0);
        
        console.log('🧹 Cleared all integrated blob particles');
        this.sentimentColor = [1, 1, 1];
        
        // Clear shader arrays
        this.blobPositions.fill(0);
        this.blobColors.fill(0);
        this.blobSizes.fill(0);
        
        console.log('🧹 Cleared all integrated blob particles');
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
        this.blobs.forEach(blob => {
            if (counts.hasOwnProperty(blob.category)) {
                counts[blob.category]++;
            }
        });
        });
        
        return counts;
    }
    
    // Test function to verify GLSL functionality
    testGLSL() {
        console.log('🧪 Testing GLSL functionality...');
        
        if (!this.gl || !this.program) {
            console.error('❌ WebGL or program not initialized');
            return false;
        }
        
        try {
            this.gl.useProgram(this.program);
            this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
            this.gl.uniform1f(this.uniforms.time, 0);
            this.gl.uniform1i(this.uniforms.blobCount, 0);
            
            // Try a simple draw
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            
            const error = this.gl.getError();
            if (error !== this.gl.NO_ERROR) {
                console.error('❌ WebGL error during test:', error);
                return false;
            }
            
            console.log('✅ GLSL test passed');
            return true;
            
        } catch (error) {
            console.error('❌ GLSL test failed:', error);
            return false;
        }
    }
    
    // Add sample data for testing
    addSampleData() {
        console.log('🎭 Adding sample emotion data for testing...');
        
        const sampleData = [
            {
                id: 'sample_1',
                category: 'hope',
                speaker: 'Test User 1',
                text: 'I feel hopeful about the future and excited about new possibilities.',
                confidence: 0.8,
                score: 0.7
            },
            {
                id: 'sample_2',
                category: 'sorrow',
                speaker: 'Test User 2',
                text: 'Sometimes I feel overwhelmed by sadness and uncertainty.',
                confidence: 0.6,
                score: -0.5
            },
            {
                id: 'sample_3',
                category: 'transformative',
                speaker: 'Test User 3',
                text: 'This experience has changed me in ways I never expected.',
                confidence: 0.9,
                score: 0.3
            },
            {
                id: 'sample_4',
                category: 'ambivalent',
                speaker: 'Test User 4',
                text: 'I have mixed feelings about this situation.',
                confidence: 0.4,
                score: 0.1
            },
            {
                id: 'sample_5',
                category: 'reflective_neutral',
                speaker: 'Test User 5',
                text: 'I am thinking deeply about what this all means.',
                confidence: 0.7,
                score: 0.0
            }
        ];
        
        sampleData.forEach((data, index) => {
            setTimeout(() => {
                this.addBlob(data);
            }, index * 500); // Stagger the additions
        });
        
        console.log('✅ Sample data added');
    }
}

// Make available globally
window.IntegratedEmotionVisualizer = IntegratedEmotionVisualizer;
    
    // Test function to verify GLSL functionality
    testGLSL() {
        console.log('🧪 Testing GLSL functionality...');
        
        if (!this.gl || !this.program) {
            console.error('❌ WebGL or program not initialized');
            return false;
        }
        
        try {
            this.gl.useProgram(this.program);
            this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
            this.gl.uniform1f(this.uniforms.time, 0);
            this.gl.uniform1i(this.uniforms.blobCount, 0);
            
            // Try a simple draw
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            
            const error = this.gl.getError();
            if (error !== this.gl.NO_ERROR) {
                console.error('❌ WebGL error during test:', error);
                return false;
            }
            
            console.log('✅ GLSL test passed');
            return true;
            
        } catch (error) {
            console.error('❌ GLSL test failed:', error);
            return false;
        }
    }
    
    // Add sample data for testing
    addSampleData() {
        console.log('🎭 Adding sample emotion data for testing...');
        
        const sampleData = [
            {
                id: 'sample_1',
                category: 'hope',
                speaker: 'Test User 1',
                text: 'I feel hopeful about the future and excited about new possibilities.',
                confidence: 0.8,
                score: 0.7
            },
            {
                id: 'sample_2',
                category: 'sorrow',
                speaker: 'Test User 2',
                text: 'Sometimes I feel overwhelmed by sadness and uncertainty.',
                confidence: 0.6,
                score: -0.5
            },
            {
                id: 'sample_3',
                category: 'transformative',
                speaker: 'Test User 3',
                text: 'This experience has changed me in ways I never expected.',
                confidence: 0.9,
                score: 0.3
            },
            {
                id: 'sample_4',
                category: 'ambivalent',
                speaker: 'Test User 4',
                text: 'I have mixed feelings about this situation.',
                confidence: 0.4,
                score: 0.1
            },
            {
                id: 'sample_5',
                category: 'reflective_neutral',
                speaker: 'Test User 5',
                text: 'I am thinking deeply about what this all means.',
                confidence: 0.7,
                score: 0.0
            }
        ];
        
        sampleData.forEach((data, index) => {
            setTimeout(() => {
                this.addBlob(data);
            }, index * 500); // Stagger the additions
        });
        
        console.log('✅ Sample data added');
    }
}

// Make available globally
window.IntegratedEmotionVisualizer = IntegratedEmotionVisualizer;