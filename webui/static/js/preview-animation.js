/**
 * Preview Animation for Landing Page
 * Shows a demo of the emotion visualization system
 */

class PreviewAnimation {
    constructor(containerId) {
        this.containerId = containerId;
        this.canvas = null;
        this.blobs = [];
        this.animationId = null;
        this.isRunning = false;
        
        // Demo emotion data
        this.demoEmotions = [
            { category: 'hope', text: 'I believe in a brighter tomorrow...', intensity: 0.8, confidence: 0.9 },
            { category: 'sorrow', text: 'Sometimes the weight feels overwhelming...', intensity: 0.7, confidence: 0.8 },
            { category: 'transformative', text: 'Through struggle, I found my strength...', intensity: 0.9, confidence: 0.85 },
            { category: 'ambivalent', text: 'I feel both excited and terrified...', intensity: 0.6, confidence: 0.7 },
            { category: 'reflective_neutral', text: 'I wonder what this all means...', intensity: 0.5, confidence: 0.75 }
        ];
        
        this.emotionColors = {
            hope: { r: 255, g: 215, b: 0 },
            sorrow: { r: 74, g: 144, b: 226 },
            transformative: { r: 155, g: 89, b: 182 },
            ambivalent: { r: 231, g: 76, b: 60 },
            reflective_neutral: { r: 149, g: 165, b: 166 }
        };
        
        this.init();
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn(`Container ${this.containerId} not found`);
            return;
        }
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.borderRadius = '20px';
        
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Initialize demo blobs
        this.createDemoBlobs();
        
        // Start animation
        this.start();
    }
    
    createDemoBlobs() {
        this.blobs = [];
        
        this.demoEmotions.forEach((emotion, index) => {
            const blob = {
                id: `demo-${index}`,
                category: emotion.category,
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                size: 30 + emotion.intensity * 40,
                baseSize: 30 + emotion.intensity * 40,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                age: 0,
                intensity: emotion.intensity,
                confidence: emotion.confidence,
                text: emotion.text,
                controlPoints: this.generateControlPoints(),
                color: this.emotionColors[emotion.category]
            };
            
            this.blobs.push(blob);
        });
    }
    
    generateControlPoints() {
        const points = [];
        const numPoints = 6;
        
        for (let i = 0; i < numPoints; i++) {
            points.push({
                angle: (i / numPoints) * Math.PI * 2,
                distance: 10 + Math.random() * 15,
                speed: 0.01 + Math.random() * 0.02
            });
        }
        
        return points;
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isRunning = false;
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    update() {
        const time = Date.now() * 0.001;
        
        this.blobs.forEach(blob => {
            // Update age
            blob.age += 0.016;
            
            // Organic movement with perlin-like noise simulation
            const noiseX = Math.sin(blob.x * 0.01 + time) * 0.1;
            const noiseY = Math.cos(blob.y * 0.01 + time) * 0.1;
            
            blob.vx += noiseX;
            blob.vy += noiseY;
            
            // Movement patterns based on emotion
            switch (blob.category) {
                case 'hope':
                    blob.vy -= 0.05; // Float upward
                    break;
                case 'sorrow':
                    blob.vy += 0.02; // Sink slightly
                    break;
                case 'transformative':
                    // More dynamic movement
                    blob.vx += Math.sin(time + blob.id.charCodeAt(5)) * 0.1;
                    break;
            }
            
            // Apply velocity damping
            blob.vx *= 0.99;
            blob.vy *= 0.99;
            
            // Limit velocity
            const maxSpeed = 1.5;
            if (Math.abs(blob.vx) > maxSpeed) blob.vx = Math.sign(blob.vx) * maxSpeed;
            if (Math.abs(blob.vy) > maxSpeed) blob.vy = Math.sign(blob.vy) * maxSpeed;
            
            // Update position
            blob.x += blob.vx;
            blob.y += blob.vy;
            
            // Boundary wrapping
            const margin = blob.size;
            if (blob.x < -margin) blob.x = this.canvas.width + margin;
            if (blob.x > this.canvas.width + margin) blob.x = -margin;
            if (blob.y < -margin) blob.y = this.canvas.height + margin;
            if (blob.y > this.canvas.height + margin) blob.y = -margin;
            
            // Update size with breathing effect
            blob.size = blob.baseSize * (0.9 + 0.1 * Math.sin(blob.age * 2));
            
            // Update control points
            blob.controlPoints.forEach(cp => {
                cp.angle += cp.speed;
            });
        });
        
        // Simple gravitational attraction
        this.applyGravitation();
    }
    
    applyGravitation() {
        const gravitationalStrength = 0.0005;
        
        for (let i = 0; i < this.blobs.length; i++) {
            for (let j = i + 1; j < this.blobs.length; j++) {
                const blob1 = this.blobs[i];
                const blob2 = this.blobs[j];
                
                const dx = blob2.x - blob1.x;
                const dy = blob2.y - blob1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Check emotional affinity
                const affinity = this.getEmotionalAffinity(blob1.category, blob2.category);
                
                if (affinity > 0 && distance > 60 && distance < 200) {
                    const force = gravitationalStrength * affinity / (distance * 0.01);
                    const forceX = (dx / distance) * force;
                    const forceY = (dy / distance) * force;
                    
                    blob1.vx += forceX;
                    blob1.vy += forceY;
                    blob2.vx -= forceX;
                    blob2.vy -= forceY;
                }
            }
        }
    }
    
    getEmotionalAffinity(category1, category2) {
        const affinities = {
            hope: { hope: 1.0, transformative: 0.8, reflective_neutral: 0.3 },
            sorrow: { sorrow: 1.0, transformative: 0.6, reflective_neutral: 0.4 },
            transformative: { transformative: 1.0, hope: 0.8, sorrow: 0.6, ambivalent: 0.7 },
            ambivalent: { ambivalent: 1.0, transformative: 0.7 },
            reflective_neutral: { reflective_neutral: 1.0, hope: 0.3, sorrow: 0.4 }
        };
        
        return affinities[category1]?.[category2] || 0;
    }
    
    draw() {
        // Clear canvas with subtle gradient
        this.drawBackground();
        
        // Draw connections between related blobs
        this.drawConnections();
        
        // Draw blobs
        this.blobs.forEach(blob => this.drawBlob(blob));
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(10, 10, 10, 1)');
        gradient.addColorStop(1, 'rgba(15, 15, 20, 1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawConnections() {
        this.ctx.globalAlpha = 0.1;
        
        for (let i = 0; i < this.blobs.length; i++) {
            for (let j = i + 1; j < this.blobs.length; j++) {
                const blob1 = this.blobs[i];
                const blob2 = this.blobs[j];
                
                const dx = blob2.x - blob1.x;
                const dy = blob2.y - blob1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const affinity = this.getEmotionalAffinity(blob1.category, blob2.category);
                
                if (affinity > 0.5 && distance < 150) {
                    this.ctx.strokeStyle = `rgba(${blob1.color.r}, ${blob1.color.g}, ${blob1.color.b}, ${affinity * 0.3})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(blob1.x, blob1.y);
                    this.ctx.lineTo(blob2.x, blob2.y);
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawBlob(blob) {
        this.ctx.save();
        
        // Glow effect
        this.ctx.shadowBlur = 15 * blob.intensity;
        this.ctx.shadowColor = `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.6)`;
        
        // Main blob shape
        this.ctx.beginPath();
        
        const numPoints = 16;
        let firstPoint = null;
        
        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            let radius = blob.size;
            
            // Apply control point influences
            blob.controlPoints.forEach(cp => {
                const influence = (Math.cos(angle - cp.angle) + 1) * 0.5;
                radius += influence * cp.distance * 0.3;
            });
            
            // Add noise for organic feel
            const noiseValue = (Math.sin(angle * 3 + blob.age) + 1) * 0.5;
            radius += noiseValue * 5;
            
            const x = blob.x + Math.cos(angle) * radius;
            const y = blob.y + Math.sin(angle) * radius;
            
            if (i === 0) {
                firstPoint = { x, y };
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        
        // Fill with gradient
        const gradient = this.ctx.createRadialGradient(
            blob.x, blob.y, 0,
            blob.x, blob.y, blob.size
        );
        
        const alpha = 0.6 + blob.confidence * 0.4;
        gradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${alpha * 0.3})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Inner glow for high intensity
        if (blob.intensity > 0.7) {
            this.ctx.fillStyle = `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.3)`;
            this.ctx.beginPath();
            this.ctx.arc(blob.x, blob.y, blob.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    handleResize() {
        const container = document.getElementById(this.containerId);
        if (container && this.canvas) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            
            // Reposition blobs if they're outside new bounds
            this.blobs.forEach(blob => {
                if (blob.x > this.canvas.width) blob.x = this.canvas.width - 50;
                if (blob.y > this.canvas.height) blob.y = this.canvas.height - 50;
            });
        }
    }
    
    destroy() {
        this.stop();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize preview animation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const previewContainer = document.getElementById('preview-animation');
    if (previewContainer) {
        window.previewAnimation = new PreviewAnimation('preview-animation');
        
        // Pause animation when not visible (intersection observer)
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        window.previewAnimation.start();
                    } else {
                        window.previewAnimation.stop();
                    }
                });
            });
            
            observer.observe(previewContainer);
        }
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreviewAnimation;
} 