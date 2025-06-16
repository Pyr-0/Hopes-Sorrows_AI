#!/usr/bin/env python3
"""
Database setup and initialization script for Hopes & Sorrows.
"""

import sys
from pathlib import Path

# Add src to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / 'src'))

from hopes_sorrows.core.config import get_config
from hopes_sorrows.data import DatabaseManager

def main():
    """Initialize the database."""
    print("🗄️  Initializing Hopes & Sorrows Database...")
    
    config = get_config()
    config.ensure_directories()
    
    try:
        db_manager = DatabaseManager(config.get_database_url())
        # Database is initialized automatically in the constructor
        speakers = db_manager.get_all_speakers()
        print(f"📊 Found {len(speakers)} existing speakers.")
        
        print("✅ Database initialized successfully!")
        print(f"📍 Database location: {config.get_database_url()}")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 