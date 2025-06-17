#!/usr/bin/env python3
"""
Run the web application with enhanced debugging for WebUI issues.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from hopes_sorrows.web.api.app import create_app
import logging

def main():
    """Run the web application with debug logging."""
    # Configure enhanced logging
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('webui_debug.log')
        ]
    )
    
    logger = logging.getLogger(__name__)
    logger.info("🚀 Starting Hopes & Sorrows WebUI with enhanced debugging")
    
    try:
        app, socketio = create_app()
        
        # Run with debug mode and detailed request logging
        socketio.run(
            app, 
            host='0.0.0.0', 
            port=5000, 
            debug=True,
            log_output=True,
            use_reloader=False  # Disable reloader to prevent double startup
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to start web server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 