let blobs = [];
const numBlobs = 100;
const mouseInfluence = 0.9; // How strongly the mouse affects the blobs
const mouseRadius = 200;    // How far the mouse influence reaches

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 1);
    
    // Create initial blobs
    for (let i = 0; i < numBlobs; i++) {
        blobs.push(new Blob(
            random(width),
            random(height),
            random(50, 100)
        ));
    }
}

function draw() {
    background(0, 0, 10);
    
    // Update and display blobs
    for (let blob of blobs) {
        blob.update();
        blob.display();
    }
}

class Blob {
    constructor(x, y, r) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.r = r;
        this.hue = random(360);
    }
    
    update() {
        // Mouse interaction
        let mouseForce = createVector(mouseX - this.pos.x, mouseY - this.pos.y);
        let distance = mouseForce.mag();
        
        if (distance < mouseRadius) {
            // Normalize and scale the force based on distance
            mouseForce.normalize();
            let strength = map(distance, 0, mouseRadius, mouseInfluence, 0);
            mouseForce.mult(strength);
            this.acc.add(mouseForce);
        }
        
        // Add some random movement
        this.acc.add(createVector(random(-0.1, 0.1), random(-0.1, 0.1)));
        
        // Apply physics
        this.vel.add(this.acc);
        this.vel.limit(5); // Increased speed limit for more dynamic movement
        this.pos.add(this.vel);
        this.acc.mult(0);
        
        // Add some damping
        this.vel.mult(1);
        
        // Keep blob within bounds
        this.pos.x = constrain(this.pos.x, this.r, width - this.r);
        this.pos.y = constrain(this.pos.y, this.r, height - this.r);
    }
    
    display() {
        noStroke();
        fill(this.hue, 80, 100, 0.7);
        circle(this.pos.x, this.pos.y, this.r * 2);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
} 


// LavaLamp.js - P5.js implementation of a lava lamp fluid simulation

// let canvas;
// let blobs = [];
// let numBlobs = 10;
// let gravity = 0.02;
// let baseColor, accentColor;
// let speedFactor = 1.0;
// let complexity = 5;

// // DOM element references
// let baseColorPicker, accentColorPicker;
// let speedSlider, complexitySlider;
// let speedValue, complexityValue;

// function setup() {
//   // Create the canvas and place it in the lava-lamp-canvas div
//   canvas = createCanvas(400, 600);
//   canvas.parent('lava-lamp-canvas');
  
//   // Initialize color pickers and slider controls
//   baseColorPicker = select('#base-color');
//   accentColorPicker = select('#accent-color');
//   speedSlider = select('#speed-control');
//   complexitySlider = select('#complexity-control');
//   speedValue = select('#speed-value');
//   complexityValue = select('#complexity-value');
  
//   // Set up event listeners for controls
//   baseColorPicker.input(updateColors);
//   accentColorPicker.input(updateColors);
//   speedSlider.input(updateSpeed);
//   complexitySlider.input(updateComplexity);
  
//   // Initialize colors from the color pickers
//   updateColors();
  
//   // Create initial blobs
//   resetBlobs();
// }

// function draw() {
//   // Clear the background
//   background(0, 0, 0, 20); // Slight transparency for trail effect
  
//   // Draw the lamp container
//   drawLampContainer();
  
//   // Update and display all blobs
//   for (let i = 0; i < blobs.length; i++) {
//     updateBlob(blobs[i]);
//     displayBlob(blobs[i]);
//   }
  
//   // Handle blob interactions
//   handleBlobInteractions();
// }

// function resetBlobs() {
//   blobs = [];
//   numBlobs = complexity * 2; // Number of blobs depends on complexity
  
//   for (let i = 0; i < numBlobs; i++) {
//     let blobSize = random(30, 60);
//     let newBlob = {
//       x: random(width * 0.2, width * 0.8),
//       y: random(height * 0.1, height * 0.9),
//       size: blobSize,
//       originalSize: blobSize,
//       xSpeed: random(-0.5, 0.5),
//       ySpeed: random(-0.2, 0.5),
//       colorRatio: random(0, 1), // Blend between base and accent color
//       lifespan: random(200, 400),
//       age: 0,
//       // Metaballs system needs multiple control points for realistic fluid
//       controlPoints: []
//     };
    
//     // Generate control points for metaball effect
//     let controlPointCount = int(blobSize / 10) + 2;
//     for (let j = 0; j < controlPointCount; j++) {
//       newBlob.controlPoints.push({
//         offsetX: random(-blobSize * 0.3, blobSize * 0.3),
//         offsetY: random(-blobSize * 0.3, blobSize * 0.3),
//         angle: random(TWO_PI),
//         speed: random(0.01, 0.03)
//       });
//     }
    
//     blobs.push(newBlob);
//   }
// }

// function updateBlob(blob) {
//   // Update position based on speed and gravity
//   blob.x += blob.xSpeed * speedFactor;
//   blob.y += (blob.ySpeed + gravity) * speedFactor;
  
//   // Update control points
//   for (let pt of blob.controlPoints) {
//     pt.angle += pt.speed * speedFactor;
//   }
  
//   // Bounce off edges
//   if (blob.x < blob.size/2 || blob.x > width - blob.size/2) {
//     blob.xSpeed *= -0.8;
//     blob.x = constrain(blob.x, blob.size/2, width - blob.size/2);
//   }
  
//   // Bottom and top boundary behavior
//   if (blob.y > height - blob.size/2) {
//     // Bounce off bottom
//     blob.ySpeed *= -0.9;
//     blob.y = height - blob.size/2;
    
//     // Add some horizontal drift when hitting bottom
//     blob.xSpeed += random(-0.1, 0.1);
//   } else if (blob.y < blob.size/2) {
//     // Bounce off top
//     blob.ySpeed *= -0.9;
//     blob.y = blob.size/2;
//   }
  
//   // Add some random motion to simulate fluid dynamics
//   if (frameCount % 20 === 0) {
//     blob.xSpeed += random(-0.05, 0.05) * speedFactor;
//     blob.ySpeed += random(-0.05, 0.05) * speedFactor;
//   }
  
//   // Limit max speed
//   blob.xSpeed = constrain(blob.xSpeed, -2, 2);
//   blob.ySpeed = constrain(blob.ySpeed, -2, 2);
  
//   // Life cycle - blobs can shrink and grow over time
//   blob.age++;
//   if (blob.age > blob.lifespan) {
//     // Reset the blob
//     blob.size = blob.originalSize * (0.7 + 0.3 * sin(frameCount * 0.01));
//     blob.age = 0;
//     blob.lifespan = random(200, 400);
    
//     // Sometimes reposition it
//     if (random() > 0.7) {
//       blob.y = height - random(50, 100);
//       blob.x = random(width * 0.2, width * 0.8);
//       blob.ySpeed = random(-1, -0.5);
//     }
//   }
// }

// function displayBlob(blob) {
//   // Calculate the color based on the blob's position and properties
//   let baseRGB = hexToRgb(baseColorPicker.value());
//   let accentRGB = hexToRgb(accentColorPicker.value());
  
//   // Create color gradient based on position (bottom = more base color, top = more accent color)
//   let positionFactor = map(blob.y, height, 0, 0, 1); 
  
//   // Combine position factor with blob's individual color ratio
//   let colorBlendFactor = lerp(0.2, 0.8, (positionFactor + blob.colorRatio) / 2);
  
//   // Calculate final color
//   let r = lerp(baseRGB.r, accentRGB.r, colorBlendFactor);
//   let g = lerp(baseRGB.g, accentRGB.g, colorBlendFactor);
//   let b = lerp(baseRGB.b, accentRGB.b, colorBlendFactor);
  
//   // Draw the metaball-like blob with perlin noise effect
//   push();
//   // Create a slight glow effect
//   drawingContext.shadowBlur = 15;
//   drawingContext.shadowColor = color(r, g, b, 100);
  
//   noStroke();
//   fill(r, g, b, 180);
  
//   beginShape();
//   // Draw blob using control points and perlin noise for organic shape
//   for (let i = 0; i <= 20; i++) {
//     let angle = map(i, 0, 20, 0, TWO_PI);
//     let radius = blob.size/2;
    
//     // Apply distortions from control points
//     for (let pt of blob.controlPoints) {
//       let distFactor = 0.5 + 0.5 * sin(angle + pt.angle);
//       radius += distFactor * 5;
//     }
    
//     // Add perlin noise for more organic feel
//     let noiseVal = noise(cos(angle) + 1, sin(angle) + 1, frameCount * 0.01) * 10;
//     radius += noiseVal;
    
//     let x = blob.x + cos(angle) * radius;
//     let y = blob.y + sin(angle) * radius;
    
//     curveVertex(x, y);
    
//     // Add extra vertices at the beginning and end for smooth shape
//     if (i === 0 || i === 20) {
//       curveVertex(x, y);
//     }
//   }
//   endShape(CLOSE);
//   pop();
// }

// function drawLampContainer() {
//   // Draw lamp base
//   fill(40);
//   noStroke();
//   rect(width/2 - 80, height - 20, 160, 20, 5);
  
//   // Draw subtle glass reflection
//   stroke(255, 255, 255, 10);
//   strokeWeight(1);
//   line(width * 0.1, 0, width * 0.05, height);
//   line(width * 0.9, 0, width * 0.95, height);
// }

// function handleBlobInteractions() {
//   // Check for blob collisions and interactions
//   for (let i = 0; i < blobs.length; i++) {
//     for (let j = i + 1; j < blobs.length; j++) {
//       let b1 = blobs[i];
//       let b2 = blobs[j];
      
//       // Calculate distance between blobs
//       let dx = b2.x - b1.x;
//       let dy = b2.y - b1.y;
//       let distance = sqrt(dx * dx + dy * dy);
//       let minDist = (b1.size + b2.size) / 2;
      
//       // Handle collision
//       if (distance < minDist) {
//         // Calculate collision response
//         let angle = atan2(dy, dx);
//         let targetX = b1.x + cos(angle) * minDist;
//         let targetY = b1.y + sin(angle) * minDist;
//         let ax = (targetX - b2.x) * 0.03;
//         let ay = (targetY - b2.y) * 0.03;
        
//         // Apply acceleration to speed
//         b1.xSpeed -= ax;
//         b1.ySpeed -= ay;
//         b2.xSpeed += ax;
//         b2.ySpeed += ay;
        
//         // Sometimes merge smaller blobs into larger ones
//         if (random() > 0.98 && b1.size < b2.size) {
//           b2.size += b1.size * 0.2;
//           b1.size *= 0.8;
//         }
//       }
//     }
//   }
  
//   // Create new blobs occasionally from the bottom
//   if (frameCount % 200 === 0 && blobs.length < 20) {
//     let blobSize = random(30, 60);
//     let newBlob = {
//       x: random(width * 0.2, width * 0.8),
//       y: height - blobSize/2,
//       size: blobSize,
//       originalSize: blobSize,
//       xSpeed: random(-0.2, 0.2),
//       ySpeed: random(-1.5, -0.5), // Start moving up
//       colorRatio: random(0, 1),
//       lifespan: random(200, 400),
//       age: 0,
//       controlPoints: []
//     };
    
//     // Generate control points
//     let controlPointCount = int(blobSize / 10) + 2;
//     for (let j = 0; j < controlPointCount; j++) {
//       newBlob.controlPoints.push({
//         offsetX: random(-blobSize * 0.3, blobSize * 0.3),
//         offsetY: random(-blobSize * 0.3, blobSize * 0.3),
//         angle: random(TWO_PI),
//         speed: random(0.01, 0.03)
//       });
//     }
    
//     blobs.push(newBlob);
//   }
  
//   // Remove excess blobs
//   while (blobs.length > 20) {
//     // Find smallest blob and remove it
//     let minSize = Infinity;
//     let minIndex = 0;
//     for (let i = 0; i < blobs.length; i++) {
//       if (blobs[i].size < minSize) {
//         minSize = blobs[i].size;
//         minIndex = i;
//       }
//     }
//     blobs.splice(minIndex, 1);
//   }
// }

// // Utility functions
// function updateColors() {
//   let baseHex = baseColorPicker.value();
//   let accentHex = accentColorPicker.value();
  
//   // Update lamp glow color based on base color
//   let baseRGB = hexToRgb(baseHex);
//   document.getElementById('lava-lamp-canvas').style.boxShadow = 
//     `0 0 30px rgba(${baseRGB.r}, ${baseRGB.g}, ${baseRGB.b}, 0.5)`;
// }

// function updateSpeed() {
//   speedFactor = speedSlider.value();
//   speedValue.html(speedFactor);
// }

// function updateComplexity() {
//   complexity = parseInt(complexitySlider.value());
//   complexityValue.html(complexity);
//   resetBlobs();
// }

// function hexToRgb(hex) {
//   // Remove # if present
//   hex = hex.replace('#', '');
  
//   // Parse hex values
//   let r = parseInt(hex.substring(0, 2), 16);
//   let g = parseInt(hex.substring(2, 4), 16);
//   let b = parseInt(hex.substring(4, 6), 16);
  
//   return { r, g, b };
// }

// // Function to handle sentiment analysis data (for future use)
// function updateFromSentimentData(data) {
//   // This function would be called when sentiment data is received
//   // It would update the lava lamp colors and behavior based on the emotional data
  
//   if (data && data.colorConfig) {
//     let config = data.colorConfig;
    
//     // Update colors based on sentiment
//     baseColorPicker.value('#' + rgbToHex(config.baseColor[0], config.baseColor[1], config.baseColor[2]));
//     accentColorPicker.value('#' + rgbToHex(config.accentColor[0], config.accentColor[1], config.accentColor[2]));
    
//     // Update other parameters
//     speedSlider.value(config.intensity);
//     complexitySlider.value(config.complexity);
    
//     // Apply updates
//     updateColors();
//     updateSpeed();
//     updateComplexity();
//   }
// }

// function rgbToHex(r, g, b) {
//   return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
// }

// // Window resize handler
// function windowResized() {
//   // Keep the canvas size proportional to the container
//   let container = document.getElementById('lava-lamp-canvas');
//   let parentWidth = container.parentElement.clientWidth;
  
//   // Maintain aspect ratio but fit within parent
//   let newWidth = min(parentWidth * 0.8, 400);
//   let newHeight = newWidth * 1.5; // 2:3 aspect ratio
  
//   resizeCanvas(newWidth, newHeight);
// }