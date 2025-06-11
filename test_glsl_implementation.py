#!/usr/bin/env python3
"""
Test script to verify GLSL-enhanced emotion visualizer implementation
"""

import requests
import time
import json
from bs4 import BeautifulSoup

def test_server_running():
    """Test if the Flask server is running"""
    print("🔍 Testing server availability...")
    
    try:
        response = requests.get('http://localhost:5000/', timeout=5)
        if response.status_code == 200:
            print("✅ Server is running")
            return True
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Server not accessible: {e}")
        return False

def test_glsl_html_structure():
    """Test if GLSL elements are present in HTML"""
    print("\n🎨 Testing GLSL HTML structure...")
    
    try:
        response = requests.get('http://localhost:5000/app')
        if response.status_code != 200:
            print(f"❌ App page returned status {response.status_code}")
            return False
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Check for visualization container
        viz_container = soup.find('div', id='visualization-container')
        if viz_container:
            print("✅ Visualization container found")
        else:
            print("❌ Visualization container not found")
            return False
            
        # Check for GLSL canvas
        glsl_canvas = soup.find('canvas', id='glsl-canvas')
        if glsl_canvas:
            print("✅ GLSL canvas element found")
        else:
            print("❌ GLSL canvas element not found")
            
        # Check for P5 container
        p5_container = soup.find('div', id='p5-container')
        if p5_container:
            print("✅ P5 container found")
        else:
            print("❌ P5 container not found")
            
        # Check for EmotionVisualizer script
        scripts = soup.find_all('script')
        emotion_visualizer_found = False
        for script in scripts:
            if script.get('src') and 'emotion-visualizer.js' in script.get('src'):
                emotion_visualizer_found = True
                break
                
        if emotion_visualizer_found:
            print("✅ EmotionVisualizer script included")
        else:
            print("❌ EmotionVisualizer script not found")
            
        return True
        
    except Exception as e:
        print(f"❌ HTML structure test failed: {e}")
        return False

def test_emotion_visualizer_js():
    """Test if the emotion visualizer JS file contains GLSL code"""
    print("\n🔧 Testing EmotionVisualizer JavaScript...")
    
    try:
        response = requests.get('http://localhost:5000/static/js/emotion-visualizer.js')
        if response.status_code != 200:
            print(f"❌ EmotionVisualizer JS returned status {response.status_code}")
            return False
            
        js_content = response.text
        
        # Check for GLSL-related code
        glsl_indicators = [
            'WebGL',
            'gl.createShader',
            'gl.shaderSource',
            'fragmentShader',
            'vertexShader',
            'uniform',
            'attribute'
        ]
        
        found_indicators = []
        for indicator in glsl_indicators:
            if indicator in js_content:
                found_indicators.append(indicator)
                
        if len(found_indicators) >= 4:
            print(f"✅ GLSL code detected ({len(found_indicators)}/{len(glsl_indicators)} indicators found)")
            print(f"   Found: {', '.join(found_indicators)}")
        else:
            print(f"❌ Insufficient GLSL code ({len(found_indicators)}/{len(glsl_indicators)} indicators)")
            
        # Check for EmotionVisualizer class
        if 'class EmotionVisualizer' in js_content:
            print("✅ EmotionVisualizer class found")
        else:
            print("❌ EmotionVisualizer class not found")
            
        return len(found_indicators) >= 4
        
    except Exception as e:
        print(f"❌ JavaScript test failed: {e}")
        return False

def test_app_js_integration():
    """Test if app.js properly integrates with GLSL visualizer"""
    print("\n🔗 Testing app.js integration...")
    
    try:
        response = requests.get('http://localhost:5000/static/js/app.js')
        if response.status_code != 200:
            print(f"❌ App JS returned status {response.status_code}")
            return False
            
        js_content = response.text
        
        # Check for GLSL integration
        integration_indicators = [
            'GLSL',
            'emotionVisualizer',
            'initializeVisualizer',
            'HopesSorrowsApp'
        ]
        
        found_indicators = []
        for indicator in integration_indicators:
            if indicator in js_content:
                found_indicators.append(indicator)
                
        if len(found_indicators) >= 3:
            print(f"✅ GLSL integration detected ({len(found_indicators)}/{len(integration_indicators)} indicators)")
        else:
            print(f"❌ Insufficient integration ({len(found_indicators)}/{len(integration_indicators)} indicators)")
            
        return len(found_indicators) >= 3
        
    except Exception as e:
        print(f"❌ App.js integration test failed: {e}")
        return False

def test_css_glsl_styles():
    """Test if CSS contains GLSL-specific styles"""
    print("\n🎨 Testing GLSL CSS styles...")
    
    try:
        response = requests.get('http://localhost:5000/static/css/main.css')
        if response.status_code != 200:
            print(f"❌ CSS returned status {response.status_code}")
            return False
            
        css_content = response.text
        
        # Check for GLSL-specific styles
        glsl_styles = [
            '#glsl-canvas',
            '#p5-container',
            '.blob-tooltip',
            '.webgl-fallback',
            '.performance-indicator',
            '.glsl-ripple'
        ]
        
        found_styles = []
        for style in glsl_styles:
            if style in css_content:
                found_styles.append(style)
                
        if len(found_styles) >= 4:
            print(f"✅ GLSL styles found ({len(found_styles)}/{len(glsl_styles)} styles)")
            print(f"   Found: {', '.join(found_styles)}")
        else:
            print(f"❌ Insufficient GLSL styles ({len(found_styles)}/{len(glsl_styles)} styles)")
            
        return len(found_styles) >= 4
        
    except Exception as e:
        print(f"❌ CSS test failed: {e}")
        return False

def test_api_endpoints():
    """Test if API endpoints are working"""
    print("\n📡 Testing API endpoints...")
    
    try:
        # Test blob API
        response = requests.get('http://localhost:5000/api/get_all_blobs')
        if response.status_code == 200:
            data = response.json()
            if 'blobs' in data:
                print(f"✅ Blob API working ({len(data['blobs'])} blobs available)")
            else:
                print("❌ Blob API response missing 'blobs' field")
                return False
        else:
            print(f"❌ Blob API returned status {response.status_code}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 GLSL-Enhanced Emotion Visualizer Implementation Test")
    print("=" * 60)
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(3)
    
    tests = [
        test_server_running,
        test_glsl_html_structure,
        test_emotion_visualizer_js,
        test_app_js_integration,
        test_css_glsl_styles,
        test_api_endpoints
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! GLSL implementation is ready.")
    elif passed >= total * 0.8:
        print("⚠️  Most tests passed. Minor issues may exist.")
    else:
        print("❌ Multiple tests failed. Implementation needs review.")
    
    print("\n🚀 You can now visit http://localhost:5000/app to see the GLSL-enhanced visualizer!")

if __name__ == "__main__":
    main() 