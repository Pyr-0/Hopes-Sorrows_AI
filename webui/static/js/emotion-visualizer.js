/**
 * Integrated GLSL Blob-Particle Emotion Visualizer
 * Blobs as particles within the vortex shader
 */

class IntegratedEmotionVisualizer {
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
        this.sentimentColor = [1, 1, 1];
        
        // Blob data for shader
        this.blobs = [];
        this.maxBlobs = 80;
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
        };
        
        // Interaction
        this.selectedBlobIndex = -1;
        this.tooltipVisible = false;
        
        console.log('🎨 Integrated GLSL Blob-Particle Visualizer initialized');
    }
    
    async init(container) {
        console.log('🎨 Initializing Integrated Visualizer...');
        
        try {
            this.container = container;
            const success = this.initializeCanvas();
            
            if (!success) {
                throw new Error('Failed to initialize canvas');
            }
            
            this.animate();
            
            window.addEventListener('resize', () => {
                this.handleResize();
            });
            
            console.log('✅ Integrated Visualizer ready');
            return true;
            
        } catch (error) {
            console.error('❌ Visualizer initialization failed:', error);
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
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'integrated-canvas';
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                width: 100%;
                height: 100%;
                cursor: pointer;
            `;
            container.appendChild(this.canvas);
            
            this.setupWebGL();
            
            console.log('✅ Integrated canvas initialized');
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
        
        // Vertex shader
        const vertexSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Enhanced fragment shader with blob particles
        const fragmentSource = `
            precision highp float;
            
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_time;
            uniform float u_intensity;
            uniform float u_timeScale;
            uniform float u_zoom;
            uniform vec3 u_sentimentColor;
            
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
            
            // Get blob color at position
            vec3 getBlobColor(vec2 pos) {
                vec3 color = vec3(0.0);
                float totalWeight = 0.0;
                
                for (int i = 0; i < MAX_BLOBS; i++) {
                    if (i >= u_blobCount) break;
                    
                    vec2 blobPos = u_blobPositions[i];
                    vec3 blobColor = u_blobColors[i];
                    float blobSize = u_blobSizes[i];
                    
                    vec2 screenPos = (blobPos / u_resolution) * 2.0 - 1.0;
                    screenPos.y = -screenPos.y;
                    
                    float dist = length(pos - screenPos);
                    float influence = (blobSize / u_resolution.y * 2.0) * 1.5;
                    
                    if (dist < influence) {
                        float weight = 1.0 - smoothstep(0.0, influence, dist);
                        
                        // Highlight selected blob
                        if (i == u_selectedBlob) {
                            weight *= 2.0;
                            blobColor = mix(blobColor, vec3(1.0, 1.0, 1.0), 0.3);
                        }
                        
                        color += blobColor * weight;
                        totalWeight += weight;
                    }
                }
                
                return totalWeight > 0.0 ? color / totalWeight : vec3(0.0);
            }
            
            void main() {
                vec3 c = vec3(0.0);
                vec2 R = u_resolution;
                vec2 m = (u_mouse - 0.5 * R) / R.y * 2.0;
                
                // Vortex calculations
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
                
                // Base vortex pattern
                c += sin(ts / 2.0) * u_intensity * 0.3;
                c *= cos(ts);
                c *= pow(abs(sin((r - i) * PI)), abs(e) + 5.0);
                c *= 0.2 + abs(vd);
                c = min(c, pow(length(u) / z, -1.0 / n));
                
                // Blend with blob colors
                vec3 blobColor = getBlobColor(uv);
                float blobInfluence = length(blobColor);
                
                if (blobInfluence > 0.0) {
                    // Blend vortex with blob colors
                    vec3 vortexColor = mix(
                        vec3(vd + 1.0, abs(sin(t)), 1.0 - vd), 
                        u_sentimentColor, 
                        0.3
                    );
                    
                    c += (c * 2.0) - (vortexColor * 0.3);
                    c = mix(c, blobColor, smoothstep(0.0, 1.0, blobInfluence));
                } else {
                    // Standard vortex coloring
                    vec3 rgb = mix(
                        vec3(vd + 1.0, abs(sin(t)), 1.0 - vd), 
                        u_sentimentColor, 
                        0.3
                    );
                    c += (c * 2.0) - (rgb * 0.5);
                }
                
                // Add subtle vignette
                float dist = length(uv);
                c *= 1.0 - smoothstep(0.8, 1.2, dist);
                
                // Enhance blob areas
                float blobField = blobField(uv);
                if (blobField < 0.0) {
                    c *= 1.0 + abs(blobField) * 2.0;
                }
                
                gl_FragColor = vec4(c, 1.0);
            }
        `;
        
        // Create and link shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        
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
            sentimentColor: this.gl.getUniformLocation(this.program, 'u_sentimentColor'),
            blobCount: this.gl.getUniformLocation(this.program, 'u_blobCount'),
            blobPositions: this.gl.getUniformLocation(this.program, 'u_blobPositions'),
            blobColors: this.gl.getUniformLocation(this.program, 'u_blobColors'),
            blobSizes: this.gl.getUniformLocation(this.program, 'u_blobSizes'),
            selectedBlob: this.gl.getUniformLocation(this.program, 'u_selectedBlob')
        };
        
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
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = window.innerHeight - e.clientY;
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e.clientX, e.clientY);
        });
        
        console.log('✅ WebGL setup complete with blob integration');
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
        if (!this.gl || !this.program) return;
        
        const currentTime = (Date.now() - this.startTime) / 1000;
        
        // Update blob physics
        this.updateBlobPhysics();
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.useProgram(this.program);
        
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
        
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(() => this.animate());
    }
    
    updateBlobPhysics() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        this.blobs.forEach((blob, index) => {
            // Apply gentle orbital motion
            const angle = Date.now() * 0.0001 + blob.initialAngle;
            const radius = blob.orbitRadius + Math.sin(Date.now() * 0.001 + blob.id) * 20;
            
            blob.x = centerX + Math.cos(angle) * radius;
            blob.y = centerY + Math.sin(angle) * radius * 0.7; // Elliptical orbit
            
            // Update shader arrays
            const i = index * 2;
            this.blobPositions[i] = blob.x;
            this.blobPositions[i + 1] = blob.y;
            
            const colorIndex = index * 3;
            const color = this.sentimentColors[blob.category] || [1, 1, 1];
            this.blobColors[colorIndex] = color[0];
            this.blobColors[colorIndex + 1] = color[1];
            this.blobColors[colorIndex + 2] = color[2];
            
            this.blobSizes[index] = blob.radius;
        });
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
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 215, 0, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            left: ${Math.min(x + 10, window.innerWidth - 320)}px;
            top: ${Math.max(y - 10, 10)}px;
        `;
        
        const category = blob.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const confidence = Math.round((blob.confidence || 0.5) * 100);
        
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
                <strong>Message:</strong><br>
                <em style="color: rgba(255, 255, 255, 0.8);">"${blob.text.substring(0, 150)}${blob.text.length > 150 ? '...' : ''}"</em>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        this.tooltipVisible = true;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.tooltipVisible) {
                this.hideTooltip();

            }
        }, 5000);
    }
    
    hideTooltip() {
        const tooltips = document.querySelectorAll('.blob-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
        this.tooltipVisible = false;
    }
    
    addBlob(blobData) {
        console.log('🫧 Adding integrated blob particle:', blobData.category);
        
        const blob = {
            id: blobData.id || `blob_${this.blobIdCounter++}`,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            radius: this.calculateBlobSize(blobData),
            
            // Orbital motion properties
            orbitRadius: 100 + Math.random() * 200,
            initialAngle: Math.random() * Math.PI * 2,
            
            // Data properties
            category: blobData.category || 'reflective_neutral',
            speaker: blobData.speaker_name || blobData.speaker || 'Unknown',
            text: blobData.text || '',
            confidence: (typeof blobData.confidence === 'number') ? blobData.confidence : 0.5,
            score: (typeof blobData.score === 'number') ? blobData.score : 0,
            created_at: blobData.created_at || new Date().toISOString()
        };
        
        this.blobs.push(blob);
        
        // Remove oldest if too many
        if (this.blobs.length > this.maxBlobs) {
            this.blobs.shift();
        }
        
        this.blobCount = this.blobs.length;
        this.updateBackgroundSentiment();
        
        console.log(`🎨 Integrated blob particle created: ${blob.category} (${this.blobCount} total)`);
    }
    
    calculateBlobSize(blobData) {
        const confidence = (typeof blobData.confidence === 'number') ? blobData.confidence : 0.5;
        const score = (typeof blobData.score === 'number') ? blobData.score : 0;
        
        const baseSize = 30;
        const confidenceMultiplier = confidence * 20;
        const intensityMultiplier = Math.abs(score) * 15;
        
        return Math.max(20, Math.min(60, baseSize + confidenceMultiplier + intensityMultiplier));
    }
    
    updateBackgroundSentiment() {
        if (this.blobs.length === 0) return;
        
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
        
        console.log('🎨 Updated background sentiment to:', dominantSentiment);
    }
    
    clearAllBlobs() {
        this.blobs = [];
        this.blobCount = 0;
        this.selectedBlobIndex = -1;
        this.hideTooltip();
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
            if (counts.hasOwnProperty(blob.category)) {
                counts[blob.category]++;
            }
        });
        
        return counts;
    }
}

// Make available globally
window.IntegratedEmotionVisualizer = IntegratedEmotionVisualizer;window.IntegratedEmotionVisualizer = IntegratedEmotionVisualizer;
