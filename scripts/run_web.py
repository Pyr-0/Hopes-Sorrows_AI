#!/usr/bin/env python3
"""
Dedicated script to run the Hopes & Sorrows web application.
"""

import sys
from pathlib import Path

# Add src to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / 'src'))

from hopes_sorrows.core.config import get_config
from hopes_sorrows.web.api.app import create_app

def main():
    """Run the web application."""
    print("🎭 Starting Hopes & Sorrows Web Application...")
    
    config = get_config()
    config.ensure_directories()
    
    app = create_app()
    
    print("📊 Database connected")
    print("🎤 Audio analysis ready") 
    print("🎨 Visualization engine loaded")
    print(f"🌐 Server running on http://{config.get('FLASK_HOST')}:{config.get('FLASK_PORT')}")
    
    try:
        # Use socketio.run() instead of app.run() for Socket.IO support
        app.socketio.run(
            app,
            host=config.get('FLASK_HOST'),
            port=config.get('FLASK_PORT'),
            debug=config.get('FLASK_ENV') == 'development'
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down gracefully...")
    except Exception as e:
        print(f"❌ Error starting application: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 