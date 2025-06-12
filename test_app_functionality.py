#!/usr/bin/env python3
"""
Test script to verify the Hopes & Sorrows application functionality
"""

import requests
import json
import time
import sys
import os

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from database import DatabaseManager, AnalyzerType
from sentiment_analysis.sa_transformers import analyze_sentiment

def test_server_connection():
    """Test if the Flask server is running and responding"""
    try:
        response = requests.get('http://localhost:5000/', timeout=5)
        print(f"✅ Server is running (Status: {response.status_code})")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Server connection failed: {e}")
        return False

def test_app_page():
    """Test if the main app page loads"""
    try:
        response = requests.get('http://localhost:5000/app', timeout=5)
        if response.status_code == 200:
            print("✅ App page loads successfully")
            
            # Check for key elements in the HTML
            html = response.text
            required_elements = [
                'visualization-container',
                'record-button',
                'blob-info-panel',
                'loading-overlay'
            ]
            
            missing_elements = []
            for element in required_elements:
                if element not in html:
                    missing_elements.append(element)
            
            if missing_elements:
                print(f"⚠️ Missing elements in HTML: {missing_elements}")
            else:
                print("✅ All required HTML elements found")
            
            return True
        else:
            print(f"❌ App page failed to load (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ App page test failed: {e}")
        return False

def test_static_files():
    """Test if static files are being served"""
    static_files = [
        '/static/js/app.js',
        '/static/js/emotion-visualizer.js',
        '/static/js/audio-recorder.js',
        '/static/css/main.css'
    ]
    
    all_good = True
    for file_path in static_files:
        try:
            response = requests.head(f'http://localhost:5000{file_path}', timeout=5)
            if response.status_code == 200:
                print(f"✅ {file_path} - OK")
            else:
                print(f"❌ {file_path} - Status: {response.status_code}")
                all_good = False
        except requests.exceptions.RequestException as e:
            print(f"❌ {file_path} - Error: {e}")
            all_good = False
    
    return all_good

def test_api_endpoints():
    """Test API endpoints"""
    try:
        # Test get_all_blobs endpoint
        response = requests.get('http://localhost:5000/api/get_all_blobs', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API get_all_blobs works - Found {len(data.get('blobs', []))} blobs")
        else:
            print(f"❌ API get_all_blobs failed (Status: {response.status_code})")
            return False
        
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ API test failed: {e}")
        return False

def add_demo_data():
    """Add some demo sentiment data to test visualization"""
    try:
        # Initialize database
        db_path = os.path.join(current_dir, "sentiment_analysis.db")
        db_manager = DatabaseManager(f"sqlite:///{db_path}")
        
        # Demo texts with different emotions
        demo_texts = [
            {
                'text': "I feel so hopeful about the future and excited for what's coming next!",
                'speaker': 'Demo User 1'
            },
            {
                'text': "Sometimes I feel overwhelmed by sadness and don't know how to cope.",
                'speaker': 'Demo User 2'
            },
            {
                'text': "This experience has completely transformed how I see the world.",
                'speaker': 'Demo User 3'
            },
            {
                'text': "I'm torn between feeling excited and terrified about this change.",
                'speaker': 'Demo User 4'
            },
            {
                'text': "I wonder what this all means and where I'm heading in life.",
                'speaker': 'Demo User 5'
            }
        ]
        
        added_count = 0
        for demo in demo_texts:
            try:
                # Create speaker
                speaker = db_manager.create_speaker(demo['speaker'])
                
                # Create transcription
                transcription = db_manager.create_transcription(
                    speaker_id=speaker.id,
                    text=demo['text'],
                    audio_file_path=None
                )
                
                # Analyze sentiment
                sentiment_result = analyze_sentiment(demo['text'])
                
                # Store sentiment analysis
                db_manager.create_sentiment_analysis(
                    transcription_id=transcription.id,
                    analyzer_type=AnalyzerType.TRANSFORMER,
                    category=sentiment_result['category'],
                    score=float(sentiment_result['score']),
                    confidence=float(sentiment_result['confidence']),
                    label=sentiment_result['label'],
                    explanation=sentiment_result.get('explanation', '')
                )
                
                added_count += 1
                print(f"✅ Added demo data: {demo['text'][:50]}... -> {sentiment_result['category']}")
                
            except Exception as e:
                print(f"⚠️ Failed to add demo data: {e}")
        
        print(f"✅ Added {added_count} demo sentiment entries")
        return added_count > 0
        
    except Exception as e:
        print(f"❌ Demo data creation failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Hopes & Sorrows Application")
    print("=" * 50)
    
    # Test server connection
    if not test_server_connection():
        print("\n❌ Server is not running. Please start the server with:")
        print("   python3 -m webui.app")
        return False
    
    # Test app page
    if not test_app_page():
        return False
    
    # Test static files
    print("\n📁 Testing static files...")
    if not test_static_files():
        print("⚠️ Some static files are not loading properly")
    
    # Test API endpoints
    print("\n🔌 Testing API endpoints...")
    if not test_api_endpoints():
        return False
    
    # Add demo data
    print("\n📊 Adding demo data...")
    if add_demo_data():
        print("✅ Demo data added successfully")
    
    print("\n" + "=" * 50)
    print("🎉 Application tests completed!")
    print("\n📋 Next steps:")
    print("1. Open http://localhost:5000/app in your browser")
    print("2. Check the browser console for any JavaScript errors")
    print("3. Try clicking the record button to test functionality")
    print("4. Check the blob info panel (📊 button) to see demo data")
    
    return True

if __name__ == "__main__":
    main() 