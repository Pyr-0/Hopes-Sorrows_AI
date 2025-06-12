from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from flask_socketio import SocketIO, emit
import os
import sys
import tempfile
import uuid
from datetime import datetime
import json
import numpy as np

# Add the project root to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from sentiment_analysis.sa_transformers import analyze_sentiment as analyze_sentiment_transformer
from sentiment_analysis.sa_LLM import analyze_sentiment as analyze_sentiment_llm
from database import DatabaseManager, AnalyzerType
from audio_analysis.assembyai import analyze_audio

app = Flask(__name__)
app.config['SECRET_KEY'] = 'hopes-and-sorrows-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global database manager
db_path = os.path.join(project_root, "sentiment_analysis.db")
db_manager = DatabaseManager(f"sqlite:///{db_path}")

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

@app.route('/')
def landing():
    """Landing page introducing the project."""
    return render_template('landing.html')

@app.route('/info')
def info():
    """Info page route"""
    return render_template('info.html')

@app.route('/stats')
def stats():
    """Statistics page route"""
    return render_template('stats.html')

@app.route('/app')
def main_app():
    """Main application page route"""
    return render_template('app.html')

@app.route('/debug')
def debug():
    """Debug page for testing GLSL visualization"""
    return render_template('debug.html')

@app.route('/test_toggle')
def test_toggle():
    """Test page for dual visualizer toggle functionality"""
    return send_from_directory('.', 'test_toggle.html')

@app.route('/api/get_all_blobs')
def get_all_blobs():
    """Get all sentiment analysis data for visualization."""
    try:
        # Get all transcriptions with their sentiment analyses
        transcriptions = db_manager.get_all_transcriptions()
        blobs_data = []
        
        print(f"DEBUG: Found {len(transcriptions)} transcriptions")
        
        for transcription in transcriptions:
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
                except Exception as e:
                    print(f"DEBUG: Error creating blob for transcription {transcription.id}: {e}")
        
        print(f"DEBUG: Created {len(blobs_data)} blobs")
        
        return jsonify({
            'success': True,
            'blobs': blobs_data,
            'total_count': len(blobs_data)
        })
        
    except Exception as e:
        print(f"DEBUG: Exception in get_all_blobs: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    """Handle audio file upload and process sentiment analysis."""
    try:
        # Check for audio file - frontend sends 'audio', not 'audio_file'
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        session_id = request.form.get('session_id', str(uuid.uuid4()))
        
        # Save the audio file temporarily
        temp_dir = tempfile.mkdtemp()
        temp_filename = f"recording_{session_id}.wav"
        temp_filepath = os.path.join(temp_dir, temp_filename)
        audio_file.save(temp_filepath)
        
        # Process the audio with sentiment analysis
        analysis_result = analyze_audio(temp_filepath, use_llm=True, expected_speakers=1)
        
        # Clean up the temporary audio file
        try:
            os.remove(temp_filepath)
            os.rmdir(temp_dir)
        except:
            pass  # Don't fail if cleanup fails
        
        if analysis_result['status'] == 'success':
            # Convert analysis result to blob data format
            new_blobs = []
            for utterance in analysis_result['utterances']:
                # Get transformer sentiment data and convert numpy types
                transformer_sentiment = convert_to_serializable(utterance['transformer_sentiment'])
                
                blob_data = {
                    'id': f"blob_{utterance.get('session_speaker_id', session_id)}_{len(new_blobs)}",
                    'speaker_id': utterance.get('session_speaker_id', session_id),
                    'speaker_name': utterance.get('speaker', 'Unknown'),
                    'text': utterance['text'],
                    'category': transformer_sentiment['category'],
                    'score': transformer_sentiment['score'],
                    'confidence': transformer_sentiment['confidence'],
                    'intensity': transformer_sentiment['intensity'],
                    'label': transformer_sentiment['label'],
                    'explanation': transformer_sentiment.get('explanation', ''),
                    'created_at': datetime.now().isoformat(),
                    'has_llm': utterance['llm_sentiment'] is not None
                }
                new_blobs.append(blob_data)
            
            # Emit the new blobs to all connected clients via WebSocket
            for blob_data in new_blobs:
                socketio.emit('blob_added', blob_data)
            
            return jsonify({
                'success': True,
                'blobs': new_blobs,
                'processing_summary': analysis_result.get('processing_summary', {}),
                'session_id': session_id
            })
        else:
            return jsonify({
                'success': False,
                'error': analysis_result.get('error', 'Analysis failed'),
                'status': analysis_result['status'],
                'suggestions': analysis_result.get('suggestions', [])
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/clear_visualization')
def clear_visualization():
    """Clear the current visualization (but keep database intact)."""
    try:
        # Emit the event that the frontend expects
        socketio.emit('visualization_cleared')
        
        return jsonify({
            'success': True,
            'message': 'Visualization cleared (database preserved)'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    print('Client connected')
    emit('connected', {'message': 'Connected to Hopes & Sorrows'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    print('Client disconnected')

@socketio.on('recording_progress')
def handle_recording_progress(data):
    """Handle recording progress updates."""
    # Broadcast recording progress to all clients for live visualization
    emit('recording_progress', data, broadcast=True)

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    uploads_dir = os.path.join(current_dir, 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    
    print("🎭 Starting Hopes & Sorrows Web Application...")
    print("📊 Database connected")
    print("🎤 Audio analysis ready")
    print("🎨 Visualization engine loaded")
    
    # Run with SocketIO support
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)