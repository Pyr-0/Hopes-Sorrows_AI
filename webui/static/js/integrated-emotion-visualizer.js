/**
 * Integrated Emotion Visualizer
 * Wrapper around the working EmotionVisualizer for dual visualizer compatibility
 * Provides GLSL vortex visualization with integrated blob functionality
 */

class IntegratedEmotionVisualizer {
    constructor() {
        // Create the underlying EmotionVisualizer instance
        this.visualizer = new EmotionVisualizer();
        
        // Proxy properties for compatibility
        this.isInitialized = false;
        this.container = null;
        
        console.log('🌀 Integrated Emotion Visualizer (GLSL Vortex) initialized');
    }
    
    /**
     * Initialize the integrated visualizer
     */
    async init(container) {
        console.log('🌀 Initializing Integrated Emotion Visualizer...');
        
        try {
            this.container = container;
            
            // Initialize the underlying visualizer
            const success = await this.visualizer.init(container);
            
            if (success) {
                this.isInitialized = true;
                console.log('✅ Integrated Emotion Visualizer initialized successfully');
                return true;
            } else {
                throw new Error('Underlying visualizer initialization failed');
            }
            
        } catch (error) {
            console.error('❌ Integrated visualizer initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Add a blob to the visualization
     */
    addBlob(blobData) {
        if (this.visualizer && this.visualizer.addBlob) {
            return this.visualizer.addBlob(blobData);
        }
        console.warn('⚠️ Visualizer not ready for adding blobs');
        return null;
    }
    
    /**
     * Clear all blobs
     */
    clearAllBlobs() {
        if (this.visualizer && this.visualizer.clearAllBlobs) {
            this.visualizer.clearAllBlobs();
        }
    }
    
    /**
     * Get blob count
     */
    getBlobCount() {
        if (this.visualizer && this.visualizer.getBlobCount) {
            return this.visualizer.getBlobCount();
        }
        return 0;
    }
    
    /**
     * Get category counts
     */
    getCategoryCounts() {
        if (this.visualizer && this.visualizer.getCategoryCounts) {
            return this.visualizer.getCategoryCounts();
        }
        return {
            hope: 0,
            sorrow: 0,
            transformative: 0,
            ambivalent: 0,
            reflective_neutral: 0
        };
    }
    
    /**
     * Set category visibility
     */
    setCategoryVisibility(category, visible) {
        if (this.visualizer && this.visualizer.setCategoryVisibility) {
            this.visualizer.setCategoryVisibility(category, visible);
        }
    }
    
    /**
     * Get visible categories
     */
    getCategoryVisibility() {
        if (this.visualizer && this.visualizer.getCategoryVisibility) {
            return this.visualizer.getCategoryVisibility();
        }
        return ['hope', 'sorrow', 'transformative', 'ambivalent', 'reflective_neutral'];
    }
    
    /**
     * Set visualization mode (for GLSL shader switching)
     */
    setVisualizationMode(mode) {
        if (this.visualizer && this.visualizer.setVisualizationMode) {
            this.visualizer.setVisualizationMode(mode);
        }
    }
    
    /**
     * Get visualization mode info
     */
    getVisualizationMode() {
        if (this.visualizer && this.visualizer.getVisualizationMode) {
            return this.visualizer.getVisualizationMode();
        }
        return {
            current: 'landscape',
            available: {
                landscape: { name: 'Emotional Landscape' },
                geometric: { name: 'Geometric Patterns' }
            }
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.visualizer && this.visualizer.cleanup) {
            this.visualizer.cleanup();
        }
        this.isInitialized = false;
        console.log('🧹 Integrated visualizer cleaned up');
    }
    
    /**
     * Destroy the visualizer
     */
    destroy() {
        this.cleanup();
        this.visualizer = null;
        console.log('💥 Integrated visualizer destroyed');
    }
    
    /**
     * Get the underlying visualizer instance (for advanced access)
     */
    getUnderlyingVisualizer() {
        return this.visualizer;
    }
}

// Export for global access
window.IntegratedEmotionVisualizer = IntegratedEmotionVisualizer; 