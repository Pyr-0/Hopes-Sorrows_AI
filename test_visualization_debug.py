#!/usr/bin/env python3
"""
Debug script to test the GLSL visualization functionality
"""

import requests
import time
import json

def test_visualization_debug():
    """Test the visualization for common issues"""
    
    print("🔍 GLSL Visualization Debug Test")
    print("=" * 50)
    
    # Test 1: Server availability
    try:
        response = requests.get('http://localhost:5000/app', timeout=5)
        if response.status_code == 200:
            print("✅ Server is responding")
        else:
            print(f"❌ Server error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server not accessible: {e}")
        return False
    
    # Test 2: Check for required elements in HTML
    html_content = response.text
    required_elements = [
        'id="visualization-container"',
        'id="record-button"',
        'id="glsl-canvas"',
        'id="p5-container"',
        'emotion-visualizer.js',
        'app.js'
    ]
    
    print("\n🎯 Checking HTML elements...")
    for element in required_elements:
        if element in html_content:
            print(f"✅ Found: {element}")
        else:
            print(f"❌ Missing: {element}")
    
    # Test 3: Check JavaScript files are accessible
    print("\n📜 Checking JavaScript files...")
    js_files = [
        '/static/js/p5.min.js',
        '/static/js/emotion-visualizer.js',
        '/static/js/app.js'
    ]
    
    for js_file in js_files:
        try:
            js_response = requests.get(f'http://localhost:5000{js_file}', timeout=5)
            if js_response.status_code == 200:
                print(f"✅ {js_file} - {len(js_response.text)} bytes")
            else:
                print(f"❌ {js_file} - HTTP {js_response.status_code}")
        except Exception as e:
            print(f"❌ {js_file} - Error: {e}")
    
    # Test 4: Check API endpoints
    print("\n🔗 Checking API endpoints...")
    try:
        api_response = requests.get('http://localhost:5000/api/get_all_blobs', timeout=5)
        if api_response.status_code == 200:
            data = api_response.json()
            if data.get('success'):
                blob_count = len(data.get('blobs', []))
                print(f"✅ API working - {blob_count} blobs available")
            else:
                print(f"❌ API error: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ API HTTP error: {api_response.status_code}")
    except Exception as e:
        print(f"❌ API error: {e}")
    
    # Test 5: Check for common JavaScript issues
    print("\n🔧 Checking for common issues...")
    
    # Check if EmotionVisualizer class is properly defined
    emotion_viz_response = requests.get('http://localhost:5000/static/js/emotion-visualizer.js')
    emotion_viz_content = emotion_viz_response.text
    
    if 'class EmotionVisualizer' in emotion_viz_content:
        print("✅ EmotionVisualizer class found")
    else:
        print("❌ EmotionVisualizer class not found")
    
    if 'async init(container)' in emotion_viz_content:
        print("✅ init() method found")
    else:
        print("❌ init() method missing")
    
    if 'animate()' in emotion_viz_content:
        print("✅ animate() method found")
    else:
        print("❌ animate() method missing")
    
    # Check app.js integration
    app_response = requests.get('http://localhost:5000/static/js/app.js')
    app_content = app_response.text
    
    if 'new EmotionVisualizer()' in app_content:
        print("✅ EmotionVisualizer instantiation found")
    else:
        print("❌ EmotionVisualizer instantiation missing")
    
    if 'getElementById(\'record-button\')' in app_content:
        print("✅ Correct record button ID used")
    else:
        print("❌ Record button ID mismatch")
    
    print("\n🎉 Debug test complete!")
    print("\n💡 If visualization is still frozen:")
    print("   1. Open browser console (F12) and check for JavaScript errors")
    print("   2. Refresh the page (Ctrl+F5 or Cmd+Shift+R)")
    print("   3. Check if WebGL is enabled in your browser")
    print("   4. Try visiting: http://localhost:5000/app")
    
    return True

if __name__ == "__main__":
    test_visualization_debug() 