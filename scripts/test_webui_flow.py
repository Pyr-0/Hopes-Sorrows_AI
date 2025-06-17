#!/usr/bin/env python3
"""
Test script to debug WebUI emotional analysis flow.
Simulates the upload_audio endpoint to identify issues.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import tempfile
import uuid
from datetime import datetime
from hopes_sorrows.analysis.audio.assembyai import analyze_audio
from hopes_sorrows.data.db_manager import DatabaseManager
from hopes_sorrows.data.models import AnalyzerType
from hopes_sorrows.core.config import get_config

def test_webui_analysis_flow():
    """Test the complete WebUI analysis flow without actual audio."""
    print("🔬 TESTING WEBUI ANALYSIS FLOW")
    print("=" * 50)
    
    # Step 1: Create test text (simulating transcription)
    test_utterances = [
        "I'm really excited about this new opportunity but also scared it might not work out",
        "This experience has taught me so much about myself and what I'm capable of",
        "I feel hopeful that tomorrow will bring better things"
    ]
    
    print(f"📝 Testing with {len(test_utterances)} simulated utterances")
    
    # Step 2: Test combined analysis for each utterance
    from hopes_sorrows.analysis.sentiment.combined_analyzer import analyze_sentiment_combined
    
    analysis_results = []
    for i, text in enumerate(test_utterances, 1):
        print(f"\n🔍 Analyzing utterance {i}: '{text[:50]}...'")
        try:
            result = analyze_sentiment_combined(text, f"test_speaker_{i}", verbose=True)
            analysis_results.append({
                'text': text,
                'result': result,
                'speaker_id': f"test_speaker_{i}"
            })
            print(f"✅ Analysis successful: {result['category']} (confidence: {result['confidence']:.1%})")
        except Exception as e:
            print(f"❌ Analysis failed: {e}")
            return False
    
    # Step 3: Test database storage
    print(f"\n💾 Testing database storage...")
    try:
        config = get_config()
        db_manager = DatabaseManager(config.get_database_url())
        
        # Create test session
        session = db_manager.create_recording_session("WebUI_Test_Session")
        print(f"✅ Created test session: {session.session_name}")
        
        # Create blobs similar to backend process
        blobs_created = []
        for analysis in analysis_results:
            # Create speaker
            speaker = db_manager.get_or_create_speaker(session.id, analysis['speaker_id'])
            
            # Create transcription
            transcription = db_manager.add_transcription(
                speaker.id,
                analysis['text'],
                duration=5.0,
                confidence_score=0.95
            )
            
            # Store analysis
            sentiment_analysis = db_manager.add_sentiment_analysis(
                transcription_id=transcription.id,
                analyzer_type=AnalyzerType.COMBINED if analysis['result'].get('has_llm') else AnalyzerType.TRANSFORMER,
                label=analysis['result']['label'],
                category=analysis['result']['category'],
                score=analysis['result']['score'],
                confidence=analysis['result']['confidence'],
                explanation=analysis['result'].get('explanation', 'Test analysis')
            )
            
            # Create blob data (similar to backend)
            blob_data = {
                'id': f"blob_{transcription.id}",
                'speaker_id': speaker.id,
                'speaker_name': speaker.display_name,
                'global_sequence': speaker.global_sequence,
                'text': analysis['text'],
                'category': analysis['result']['category'],
                'score': analysis['result']['score'],
                'confidence': analysis['result']['confidence'],
                'intensity': abs(analysis['result']['score']),
                'label': analysis['result']['label'],
                'explanation': analysis['result'].get('explanation', 'Test explanation'),
                'created_at': datetime.now().isoformat(),
                'has_llm': analysis['result'].get('has_llm', False),
                'analysis_source': analysis['result'].get('analysis_source', 'combined')
            }
            blobs_created.append(blob_data)
            
        print(f"✅ Created {len(blobs_created)} blobs in database")
        
        # Step 4: Test blob retrieval (simulating frontend request)
        print(f"\n📡 Testing blob retrieval...")
        all_blobs = []
        transcriptions = db_manager.get_all_transcriptions()
        
        for transcription in transcriptions[-len(blobs_created):]:  # Get recent ones
            for analysis in transcription.sentiment_analyses:
                if analysis.analyzer_type in [AnalyzerType.TRANSFORMER, AnalyzerType.COMBINED]:
                    blob_data = {
                        'id': f"blob_{transcription.id}",
                        'category': analysis.category,
                        'confidence': analysis.confidence,
                        'text': transcription.text,
                        'speaker_name': transcription.speaker.display_name if transcription.speaker else 'Unknown'
                    }
                    all_blobs.append(blob_data)
        
        print(f"✅ Retrieved {len(all_blobs)} blobs from database")
        
        # Step 5: Simulate frontend response
        response_data = {
            'success': True,
            'blobs': blobs_created,
            'processing_summary': {
                'total_utterances': len(test_utterances),
                'processed': len(analysis_results),
                'skipped': 0
            },
            'session_id': str(uuid.uuid4()),
            'message': f'Successfully analyzed {len(blobs_created)} emotion segments'
        }
        
        print(f"\n🎉 SIMULATION COMPLETE - WOULD RETURN TO FRONTEND:")
        print(f"✅ Success: {response_data['success']}")
        print(f"📊 Blobs: {len(response_data['blobs'])}")
        print(f"📈 Categories found: {set(blob['category'] for blob in response_data['blobs'])}")
        print(f"🎯 Average confidence: {sum(blob['confidence'] for blob in response_data['blobs']) / len(response_data['blobs']):.1%}")
        
        # Cleanup
        db_manager.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run the WebUI flow test."""
    print("🚀 Starting WebUI Analysis Flow Test...")
    
    try:
        success = test_webui_analysis_flow()
        
        if success:
            print(f"\n✅ ALL TESTS PASSED")
            print(f"🎯 The WebUI analysis flow should work correctly")
            print(f"📋 Check browser console for frontend issues")
        else:
            print(f"\n❌ TESTS FAILED")
            print(f"🔧 Fix the issues above before testing WebUI")
            
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 