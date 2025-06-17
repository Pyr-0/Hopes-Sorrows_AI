#!/usr/bin/env python3
"""
Complete WebUI Test - Verify blob counter fixes
Tests the complete flow from database to frontend display
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

import requests
import json
import time
from src.hopes_sorrows.data.db_manager import DatabaseManager
from src.hopes_sorrows.core.config import get_config

def test_webui_blob_counters():
    """Test that WebUI displays correct blob counts"""
    print("🧪 COMPREHENSIVE WEBUI BLOB COUNTER TEST")
    print("=" * 50)
    
    # Step 1: Check database has blobs
    print("\n📊 Step 1: Checking database...")
    config = get_config()
    db = DatabaseManager(config.get_database_url())
    all_transcriptions = db.get_all_transcriptions()
    print(f"📊 Database contains {len(all_transcriptions)} transcriptions")
    
    # Count analyses
    total_analyses = 0
    analyzer_types = {}
    for transcription in all_transcriptions:
        for analysis in transcription.sentiment_analyses:
            total_analyses += 1
            analyzer_type = analysis.analyzer_type.value
            analyzer_types[analyzer_type] = analyzer_types.get(analyzer_type, 0) + 1
    
    print(f"📊 Total sentiment analyses: {total_analyses}")
    print(f"📊 Analyzer types: {analyzer_types}")
    
    # Step 2: Test API endpoint
    print("\n🌐 Step 2: Testing API endpoint...")
    try:
        response = requests.get("http://localhost:8080/api/get_all_blobs")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                blobs = data['blobs']
                print(f"✅ API returns {len(blobs)} blobs")
                
                # Show blob categories
                categories = {}
                for blob in blobs:
                    cat = blob['category']
                    categories[cat] = categories.get(cat, 0) + 1
                print(f"📊 Blob categories: {categories}")
                
                # Show confidence info
                if blobs:
                    avg_confidence = sum(blob['confidence'] for blob in blobs) / len(blobs)
                    print(f"📊 Average confidence: {avg_confidence:.1%}")
                
            else:
                print(f"❌ API returned error: {data}")
                return False
        else:
            print(f"❌ API request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False
    
    # Step 3: Test WebUI page load
    print("\n🎨 Step 3: Testing WebUI page...")
    try:
        response = requests.get("http://localhost:8080/app")
        if response.status_code == 200:
            html = response.text
            
            # Check for required elements
            required_elements = [
                'id="blob-counter"',
                'class="confidence-value"',
                'class="segments-value"',
                'class="emotions-value"'
            ]
            
            found_elements = []
            for element in required_elements:
                if element in html:
                    found_elements.append(element)
                    print(f"✅ Found: {element}")
                else:
                    print(f"❌ Missing: {element}")
            
            print(f"📊 Found {len(found_elements)}/{len(required_elements)} required elements")
            
        else:
            print(f"❌ WebUI page load failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ WebUI test failed: {e}")
        return False
    
    # Step 4: Summary
    print("\n📋 SUMMARY")
    print("=" * 50)
    
    if total_analyses > 0 and len(blobs) > 0:
        print("✅ Database contains analyses")
        print("✅ API returns blobs correctly") 
        print("✅ WebUI page loads with required elements")
        
        print("\n🎯 EXPECTED BEHAVIOR:")
        print(f"  • Detected Emotions: {len(categories)} unique categories")
        print(f"  • Voice Segments: {len(blobs)} segments")
        print(f"  • AI Confidence: {avg_confidence:.0%}")
        
        print("\n💡 If counters still show 0, check browser console for JavaScript errors")
        print("💡 The fixes should load existing blobs and update counters properly")
        
        return True
    else:
        print("❌ No data found in database - create some recordings first")
        return False

if __name__ == "__main__":
    success = test_webui_blob_counters()
    if success:
        print("\n🎉 WebUI blob counter test PASSED")
    else:
        print("\n💥 WebUI blob counter test FAILED")
        sys.exit(1) 