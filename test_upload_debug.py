#!/usr/bin/env python3
"""
Test script to debug the upload endpoint
"""

import requests
import tempfile
import os

def test_upload_endpoint():
    """Test the upload endpoint with a simulated workflow"""
    
    # Create a temporary "audio" file (not real audio, but will trigger the workflow)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
        # Write some dummy content
        temp_file.write(b"dummy audio content for testing")
        temp_file_path = temp_file.name
    
    try:
        print("🧪 Testing upload endpoint...")
        
        # Prepare the request
        files = {'audio': open(temp_file_path, 'rb')}
        data = {'session_id': 'test_debug_123'}
        
        # Make the request
        response = requests.post(
            'http://localhost:8080/upload_audio',
            files=files,
            data=data,
            timeout=30
        )
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📊 Response headers: {dict(response.headers)}")
        
        try:
            result = response.json()
            print(f"📊 Response JSON: {result}")
        except:
            print(f"📊 Response text: {response.text[:500]}...")
        
        files['audio'].close()
        
    except Exception as e:
        print(f"💥 Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up
        try:
            os.unlink(temp_file_path)
        except:
            pass

if __name__ == "__main__":
    test_upload_endpoint() 