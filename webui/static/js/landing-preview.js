// Landing Preview Animation - Mini version of the emotion visualizer
class LandingPreview {
    constructor() {
        this.blobs = [];
        this.particles = [];
        this.time = 0;
        this.p = null;
        
        // Color palettes matching the main visualizer
        this.emotionColors = {
            hope: { primary: '#FFD700', particles: '#FFFF8D' },
            sorrow: { primary: '#4A90E2', particles: '#BBDEFB' },
            transformative: { primary: '#9B59B6', particles: '#E1BEE7' },
            ambivalent: { primary: '#E74C3C', particles: '#FFCDD2' },
            reflective_neutral: { primary: '#95A5A6', particles: '#ECEFF1' }
        };
        
        this.setupPreview();
    }
    
    setupPreview() {
        const container = document.getElementById('preview-animation');
        if (!container) return;
        
        const self = this;
        
        new p5((p) => {
            self.p = p;
            
            p.setup = () => {
                const canvas = p.createCanvas(400, 300);
                canvas.parent('preview-animation');
                p.colorMode(p.RGB, 255, 255, 255, 1);
                
                // Create demo blobs
                self.createDemoBlobs();
                self.createDemoParticles();
            };
            
            p.draw = () => {
                self.drawPreview();
            };
        });
    }
    
    createDemoBlobs() {
        const categories = Object.keys(this.emotionColors);
        
        for (let i = 0; i < 8; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            
            this.blobs.push({
                position: this.p.createVector(
                    this.p.random(50, 350),
                    this.p.random(50, 250)
                ),
                velocity: this.p.createVector(
                    this.p.random(-0.5, 0.5),
                    this.p.random(-0.5, 0.5)
                ),
                size: this.p.random(20, 40),
                category: category,
                age: this.p.random(0, 100),
                intensity: this.p.random(0.3, 0.8)
            });
        }
    }
    
    createDemoParticles() {
        const categories = Object.keys(this.emotionColors);
        
        for (let i = 0; i < 40; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            
            this.particles.push({
                position: this.p.createVector(
                    this.p.random(0, 400),
                    this.p.random(0, 300)
                ),
                velocity: this.p.createVector(
                    this.p.random(-1, 1),
                    this.p.random(-1, 1)
                ),
                size: this.p.random(1, 3),
                alpha: this.p.random(0.1, 0.3),
                color: this.emotionColors[category].particles,
                twinkle: this.p.random(0, this.p.TWO_PI)
            });
        }
    }
    
    drawPreview() {
        this.time = this.p.millis() * 0.001;
        
        // Gradient background
        this.drawBackground();
        
        // Update and draw particles
        this.updateParticles();
        this.drawParticles();
        
        // Update and draw blobs
        this.updateBlobs();
        this.drawBlobs();
    }
    
    drawBackground() {
        const gradientSteps = 20;
        this.p.noStroke();
        
        for (let i = 0; i < gradientSteps; i++) {
            const inter = this.p.map(i, 0, gradientSteps - 1, 0, 1);
            const time = this.p.millis() * 0.0001;
            
            const r1 = 10 + this.p.sin(time) * 2;
            const g1 = 10 + this.p.cos(time) * 2;
            const b1 = 10 + this.p.sin(time * 0.7) * 2;
            
            const r2 = 15 + this.p.cos(time * 0.5) * 3;
            const g2 = 15 + this.p.sin(time * 0.3) * 3;
            const b2 = 15 + this.p.cos(time * 0.9) * 3;
            
            const r = this.p.lerp(r1, r2, inter);
            const g = this.p.lerp(g1, g2, inter);
            const b = this.p.lerp(b1, b2, inter);
            
            this.p.fill(r, g, b);
            
            const y = this.p.map(i, 0, gradientSteps - 1, 0, this.p.height);
            const nextY = this.p.map(i + 1, 0, gradientSteps - 1, 0, this.p.height);
            this.p.rect(0, y, this.p.width, nextY - y);
        }
    }
    
    updateParticles() {
        for (const particle of this.particles) {
            // Simple movement
            particle.position.add(particle.velocity);
            particle.twinkle += 0.05;
            
            // Wrap around edges
            if (particle.position.x < 0) particle.position.x = 400;
            if (particle.position.x > 400) particle.position.x = 0;
            if (particle.position.y < 0) particle.position.y = 300;
            if (particle.position.y > 300) particle.position.y = 0;
        }
    }
    
    drawParticles() {
        this.p.noStroke();
        
        for (const particle of this.particles) {
            const color = this.p.color(particle.color);
            const twinkleAlpha = particle.alpha * (0.5 + 0.5 * this.p.sin(particle.twinkle));
            color.setAlpha(twinkleAlpha);
            this.p.fill(color);
            
            const size = particle.size * (0.8 + 0.2 * this.p.sin(particle.twinkle * 0.7));
            this.p.ellipse(particle.position.x, particle.position.y, size);
        }
    }
    
    updateBlobs() {
        for (const blob of this.blobs) {
            // Gentle movement
            blob.velocity.x += (this.p.noise(blob.position.x * 0.01, this.time) - 0.5) * 0.02;
            blob.velocity.y += (this.p.noise(blob.position.y * 0.01, this.time + 100) - 0.5) * 0.02;
            
            blob.velocity.limit(0.8);
            blob.position.add(blob.velocity);
            
            // Boundary wrapping
            if (blob.position.x < -50) blob.position.x = 450;
            if (blob.position.x > 450) blob.position.x = -50;
            if (blob.position.y < -50) blob.position.y = 350;
            if (blob.position.y > 350) blob.position.y = -50;
            
            blob.age += 0.02;
        }
    }
    
    drawBlobs() {
        for (const blob of this.blobs) {
            const colors = this.emotionColors[blob.category];
            
            this.p.push();
            
            // Glow effect
            this.p.drawingContext.shadowBlur = 15 * blob.intensity;
            this.p.drawingContext.shadowColor = colors.primary;
            
            const color = this.p.color(colors.primary);
            color.setAlpha(0.7);
            this.p.fill(color);
            this.p.noStroke();
            
            // Organic shape
            this.p.beginShape();
            const numPoints = 12;
            for (let i = 0; i <= numPoints; i++) {
                const angle = this.p.map(i, 0, numPoints, 0, this.p.TWO_PI);
                let radius = blob.size * (0.8 + 0.3 * this.p.sin(blob.age * 0.5));
                
                // Add organic variation
                radius += this.p.noise(
                    blob.position.x * 0.02,
                    blob.position.y * 0.02,
                    angle * 2 + this.time
                ) * 8;
                
                const x = blob.position.x + this.p.cos(angle) * radius;
                const y = blob.position.y + this.p.sin(angle) * radius;
                
                if (i === 0) this.p.curveVertex(x, y);
                this.p.curveVertex(x, y);
                if (i === numPoints) this.p.curveVertex(x, y);
            }
            this.p.endShape(this.p.CLOSE);
            
            this.p.pop();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LandingPreview();
}); 