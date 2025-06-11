#!/usr/bin/env python3
"""
Debug script to test the exact API logic for blob retrieval.
"""

from database import DatabaseManager, AnalyzerType
import numpy as np

def convert_to_serializable(obj):
    """Convert numpy/pandas types to JSON-serializable types."""
    if isinstance(obj, (np.integer, np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_to_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(item) for item in obj]
    else:
        return obj

def debug_api_logic():
    """Debug the exact API logic used in Flask app."""
    db_manager = DatabaseManager()
    
    # Get all transcriptions with their sentiment analyses
    transcriptions = db_manager.get_all_transcriptions()
    blobs_data = []
    
    print(f"Total transcriptions found: {len(transcriptions)}")
    
    for i, transcription in enumerate(transcriptions):
        # Get the most recent transformer analysis for this transcription
        transformer_analysis = None
        llm_analysis = None
        
        for analysis in transcription.sentiment_analyses:
            if analysis.analyzer_type == AnalyzerType.TRANSFORMER:
                transformer_analysis = analysis
            elif analysis.analyzer_type == AnalyzerType.LLM:
                llm_analysis = analysis
        
        if transformer_analysis:
            try:
                blob_data = {
                    'id': f"blob_{transcription.id}",
                    'speaker_id': transcription.speaker_id,
                    'speaker_name': transcription.speaker.name if transcription.speaker else "Unknown",
                    'text': transcription.text,
                    'category': transformer_analysis.category,
                    'score': convert_to_serializable(transformer_analysis.score),
                    'confidence': convert_to_serializable(transformer_analysis.confidence),
                    'intensity': convert_to_serializable(abs(transformer_analysis.score)),
                    'label': transformer_analysis.label,
                    'explanation': transformer_analysis.explanation,
                    'created_at': transcription.created_at.isoformat() if transcription.created_at else None,
                    'has_llm': llm_analysis is not None
                }
                blobs_data.append(blob_data)
                
                if i < 5:  # Show first 5 for debugging
                    print(f"\nBlob {len(blobs_data)}: {blob_data['id']}")
                    print(f"  Category: {blob_data['category']}")
                    print(f"  Speaker: {blob_data['speaker_name']}")
                    print(f"  Text: {blob_data['text'][:50]}...")
                    
            except Exception as e:
                print(f"Error creating blob for transcription {transcription.id}: {e}")
                print(f"  Speaker ID: {transcription.speaker_id}")
                print(f"  Speaker object: {transcription.speaker}")
                if transcription.speaker:
                    print(f"  Speaker name: {transcription.speaker.name}")
    
    print(f"\nTotal blobs created: {len(blobs_data)}")
    
    # Test the response structure
    response_data = {
        'success': True,
        'blobs': blobs_data,
        'total_count': len(blobs_data)
    }
    
    print(f"Response would contain {response_data['total_count']} blobs")
    
    db_manager.close()
    return response_data

if __name__ == "__main__":
    debug_api_logic() 