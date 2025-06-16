#!/usr/bin/env python3
"""
Main entry point for Hopes & Sorrows application.
Provides a unified interface to run different components.
"""

import sys
import argparse
from pathlib import Path

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.hopes_sorrows.core.config import get_config

def run_web_app():
    """Run the web application."""
    print("🎭 Starting Hopes & Sorrows Web Application...")
    
    config = get_config()
    config.ensure_directories()
    
    # Import here to avoid circular imports
    from src.hopes_sorrows.web.api.app import create_app
    
    app = create_app()
    
    print("📊 Database connected")
    print("🎤 Audio analysis ready") 
    print("🎨 Visualization engine loaded")
    print(f"🌐 Server starting on http://{config.get('FLASK_HOST')}:{config.get('FLASK_PORT')}")
    
    # Use socketio.run() instead of app.run() for Socket.IO support  
    app.socketio.run(
        app,
        host=config.get('FLASK_HOST'),
        port=config.get('FLASK_PORT'),
        debug=config.get('FLASK_ENV') == 'development'
    )

def run_cli_analysis():
    """Run CLI-based sentiment analysis."""
    print("🤖 Starting CLI Sentiment Analysis...")
    
    # Import here to avoid circular imports
    from src.hopes_sorrows.analysis.sentiment import analyze_sentiment
    
    while True:
        text = input("\nEnter text to analyze (or 'quit' to exit): ")
        if text.lower() == 'quit':
            break
        
        if text.strip():
            result = analyze_sentiment(text)
            print(f"\nResults:")
            print(f"  Sentiment: {result['label']}")
            print(f"  Category: {result['category']}")
            print(f"  Score: {result['score']:.3f}")
            print(f"  Confidence: {result['confidence']:.3f}")
            print(f"  Explanation: {result['explanation']}")

def run_audio_analysis():
    """Run audio recording and analysis."""
    print("🎤 Starting Audio Analysis...")
    
    # Import here to avoid circular imports
    from src.hopes_sorrows.analysis.audio import record_audio, analyze_audio
    
    print("Recording audio for 10 seconds...")
    audio_file = record_audio(duration=10)
    
    print("Analyzing audio...")
    result = analyze_audio(audio_file)
    
    print("\nAudio Analysis Results:")
    print(f"Status: {result.get('status', 'unknown')}")
    if result.get('utterances'):
        for i, utterance in enumerate(result['utterances']):
            print(f"\nUtterance {i+1}:")
            print(f"  Speaker: {utterance.get('speaker', 'Unknown')}")
            print(f"  Text: {utterance.get('text', '')}")
            if 'sentiment_analysis' in utterance:
                sentiment = utterance['sentiment_analysis']
                print(f"  Sentiment: {sentiment.get('label', 'Unknown')}")
                print(f"  Category: {sentiment.get('category', 'Unknown')}")
                print(f"  Score: {sentiment.get('score', 0):.3f}")

def init_database():
    """Initialize the database."""
    print("🗄️  Initializing database...")
    
    config = get_config()
    config.ensure_directories()
    
    from src.hopes_sorrows.data import DatabaseManager
    
    # Database is initialized automatically in the constructor
    db_manager = DatabaseManager(config.get_database_url())
    
    # Test the connection
    speakers = db_manager.get_all_speakers()
    print(f"📊 Database connection successful. Found {len(speakers)} speakers.")
    
    print("✅ Database initialized successfully!")

def main():
    """Main entry point with command-line argument parsing."""
    parser = argparse.ArgumentParser(description='Hopes & Sorrows - Interactive Emotional Voice Analysis')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Web application
    web_parser = subparsers.add_parser('web', help='Run the web application')
    
    # CLI analysis
    cli_parser = subparsers.add_parser('cli', help='Run CLI sentiment analysis')
    
    # Audio analysis
    audio_parser = subparsers.add_parser('audio', help='Run audio recording and analysis')
    
    # Database initialization
    db_parser = subparsers.add_parser('init-db', help='Initialize the database')
    
    # Version
    version_parser = subparsers.add_parser('version', help='Show version information')
    
    args = parser.parse_args()
    
    if args.command == 'web':
        run_web_app()
    elif args.command == 'cli':
        run_cli_analysis()
    elif args.command == 'audio':
        run_audio_analysis()
    elif args.command == 'init-db':
        init_database()
    elif args.command == 'version':
        from src.hopes_sorrows import __version__
        print(f"Hopes & Sorrows v{__version__}")
    else:
        parser.print_help()

if __name__ == '__main__':
    main() 