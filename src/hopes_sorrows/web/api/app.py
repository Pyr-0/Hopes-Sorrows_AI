from flask import Flask, render_template, request, jsonify, send_file
from flask_socketio import SocketIO, emit
import os
import sys
import tempfile
import uuid
from datetime import datetime
import json
import numpy as np

# Use relative imports for the new package structure
from ...analysis.sentiment.sa_transformers import analyze_sentiment as analyze_sentiment_transformer
from ...analysis.sentiment.sa_LLM import analyze_sentiment as analyze_sentiment_llm
from ...data.db_manager import DatabaseManager
from ...data.models import AnalyzerType
from ...analysis.audio.assembyai import analyze_audio
from ...core.config import get_config

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

def create_app():
    """Application factory function."""
    # Calculate the correct paths for templates and static files
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.dirname(current_dir)  # Go up one level from api/ to web/
    template_dir = os.path.join(web_dir, 'templates')
    static_dir = os.path.join(web_dir, 'static')
    
    app = Flask(__name__, 
                template_folder=template_dir,
                static_folder=static_dir)
    config = get_config()
    
    app.config['SECRET_KEY'] = config.get('SECRET_KEY')
    socketio = SocketIO(app, cors_allowed_origins="*")
    
    # Configure database
    db_manager = DatabaseManager(config.get_database_url())
    
    # Store instances in app context
    app.db_manager = db_manager
    app.socketio = socketio
    
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

    @app.route('/test')
    def test():
        """Simple test page for debugging initialization issues"""
        return send_file('test_simple.html')

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
                
                # Debug: show all analyses for this transcription
                print(f"DEBUG: Transcription {transcription.id} has {len(transcription.sentiment_analyses)} analyses")
                
                for analysis in transcription.sentiment_analyses:
                    print(f"DEBUG: - Analysis {analysis.id}: {analysis.analyzer_type.value} -> {analysis.category}")
                    if analysis.analyzer_type in [AnalyzerType.TRANSFORMER, AnalyzerType.COMBINED]:
                        transformer_analysis = analysis
                    elif analysis.analyzer_type == AnalyzerType.LLM:
                        llm_analysis = analysis
                
                # Prefer transformer analysis, but fall back to LLM if transformer is missing
                primary_analysis = transformer_analysis or llm_analysis
                
                if primary_analysis:
                    try:
                        blob_data = {
                            'id': f"blob_{transcription.id}",
                            'speaker_id': transcription.speaker_id,
                            'speaker_name': transcription.speaker.display_name if transcription.speaker else "Unknown",
                            'global_sequence': transcription.speaker.global_sequence if transcription.speaker else 0,
                            'text': transcription.text,
                            'category': primary_analysis.category,
                            'score': convert_to_serializable(primary_analysis.score),
                            'confidence': convert_to_serializable(primary_analysis.confidence),
                            'intensity': convert_to_serializable(abs(primary_analysis.score)),
                            'label': primary_analysis.label,
                            'explanation': primary_analysis.explanation,
                            'created_at': transcription.created_at.isoformat() if transcription.created_at else None,
                            'has_llm': llm_analysis is not None,
                            'analysis_source': 'transformer' if transformer_analysis else 'llm'
                        }
                        blobs_data.append(blob_data)
                        print(f"DEBUG: Created blob {blob_data['id']} with category {blob_data['category']}")
                    except Exception as e:
                        print(f"DEBUG: Error creating blob for transcription {transcription.id}: {e}")
                else:
                    print(f"DEBUG: Transcription {transcription.id} has no sentiment analysis - skipping")
            
            print(f"DEBUG: Created {len(blobs_data)} blobs total")
            
            # Debug: count by category
            category_counts = {}
            for blob in blobs_data:
                category = blob['category']
                category_counts[category] = category_counts.get(category, 0) + 1
            print(f"DEBUG: Category distribution: {category_counts}")
            
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
        # Import datetime at the top to avoid issues
        from datetime import datetime, timedelta
        import time
        
        try:
            print("🎤 Starting audio upload processing...")
            print(f"🔍 Request files: {list(request.files.keys())}")
            print(f"🔍 Request form: {dict(request.form)}")
            
            # Check for audio file - frontend sends 'audio', not 'audio_file'
            if 'audio' not in request.files:
                print("❌ No audio file in request")
                return jsonify({'success': False, 'error': 'No audio file provided'}), 400
            
            audio_file = request.files['audio']
            session_id = request.form.get('session_id', str(uuid.uuid4()))
            print(f"📄 Processing audio file: {audio_file.filename}, session: {session_id}")
            
            # Save the audio file temporarily
            temp_dir = tempfile.mkdtemp()
            temp_filename = f"recording_{session_id}.wav"
            temp_filepath = os.path.join(temp_dir, temp_filename)
            audio_file.save(temp_filepath)
            print(f"💾 Audio saved to: {temp_filepath}")
            
            # Process the audio with sentiment analysis
            print("🔄 Starting audio analysis...")
            try:
                analysis_result = analyze_audio(temp_filepath, use_llm=True, expected_speakers=1)
                print(f"✅ Analysis complete with status: {analysis_result.get('status', 'unknown')}")
            except Exception as analysis_error:
                print(f"💥 Audio analysis failed: {analysis_error}")
                import traceback
                traceback.print_exc()
                return jsonify({
                    'success': False,
                    'error': f'Audio analysis failed: {str(analysis_error)}',
                    'status': 'analysis_error'
                }), 500
            
            # Clean up the temporary audio file
            try:
                os.remove(temp_filepath)
                os.rmdir(temp_dir)
            except:
                pass  # Don't fail if cleanup fails
            
            if analysis_result['status'] == 'success':
                print(f"🎉 Analysis successful! Processing {len(analysis_result['utterances'])} utterances")
                
                # FIXED: Create blobs directly from the analysis_result utterances to avoid duplicates
                # This ensures we only process NEW transcriptions from this specific recording
                new_blobs = []
                utterances = analysis_result.get('utterances', [])
                
                print(f"🔍 Creating blobs from {len(utterances)} utterances in analysis result")
                
                for utterance_data in utterances:
                    try:
                        # Extract data from the utterance result (created by analyze_audio)
                        combined_sentiment = utterance_data.get('combined_sentiment')
                        
                        if combined_sentiment:
                            blob_data = {
                                'id': f"blob_{uuid.uuid4()}",  # Generate unique ID for this blob
                                'speaker_id': utterance_data.get('speaker_id', 'unknown'),
                                'speaker_name': utterance_data.get('speaker', 'Unknown'),
                                'global_sequence': utterance_data.get('global_sequence', 0),
                                'text': utterance_data.get('text', ''),
                                'category': combined_sentiment.get('category', 'reflective_neutral'),
                                'score': convert_to_serializable(combined_sentiment.get('score', 0.0)),
                                'confidence': convert_to_serializable(combined_sentiment.get('confidence', 0.0)),
                                'intensity': convert_to_serializable(abs(combined_sentiment.get('score', 0.0))),
                                'label': combined_sentiment.get('label', 'neutral'),
                                'explanation': combined_sentiment.get('explanation', 'Combined analysis'),
                                'created_at': datetime.now().isoformat(),
                                'has_llm': combined_sentiment.get('has_llm', False),
                                'analysis_source': combined_sentiment.get('analysis_source', 'combined'),
                                'session_id': session_id  # Track which session this blob came from
                            }
                            new_blobs.append(blob_data)
                            print(f"✅ Created blob with category: {blob_data['category']} from utterance")
                        else:
                            print(f"⚠️ No sentiment analysis found for utterance: {utterance_data.get('text', '')[:50]}")
                    except Exception as blob_creation_error:
                        print(f"💥 Error creating blob from utterance: {blob_creation_error}")
                        continue
                
                print(f"📡 TEMPORARILY DISABLED WebSocket emission to test duplicate issue")
                
                # TEMPORARILY DISABLED: Emit the new blobs to all OTHER connected clients via WebSocket
                # The sender will receive the blobs via the HTTP response
                # TODO: Re-enable this after fixing the duplicate issue
                # for blob_data in new_blobs:
                #     socketio.emit('blob_added', blob_data, broadcast=True)
                
                print("🎉 Upload processing complete - returning success response")
                return jsonify({
                    'success': True,
                    'blobs': new_blobs,
                    'processing_summary': analysis_result.get('processing_summary', {}),
                    'session_id': session_id,
                    'message': f'Successfully analyzed {len(new_blobs)} emotion segments',
                    'debug_info': {
                        'utterances_processed': len(utterances),
                        'blobs_created': len(new_blobs),
                        'analysis_status': analysis_result.get('status', 'unknown')
                    }
                })
            else:
                print(f"❌ Analysis failed with status: {analysis_result['status']}")
                print(f"❌ Error: {analysis_result.get('error', 'Unknown error')}")
                return jsonify({
                    'success': False,
                    'error': analysis_result.get('error', 'Analysis failed'),
                    'status': analysis_result['status'],
                    'suggestions': analysis_result.get('suggestions', [])
                }), 400
                
        except Exception as e:
            print(f"💥 Exception in upload_audio: {e}")
            print(f"💥 Exception type: {type(e).__name__}")
            import traceback
            error_traceback = traceback.format_exc()
            print(f"💥 Full traceback:\n{error_traceback}")
            
            # Force flush output
            import sys
            sys.stdout.flush()
            sys.stderr.flush()
            
            # Log to file as well
            try:
                with open('upload_error.log', 'a') as f:
                    f.write(f"\n=== ERROR at {datetime.now()} ===\n")
                    f.write(f"Exception: {e}\n")
                    f.write(f"Type: {type(e).__name__}\n")
                    f.write(f"Traceback:\n{error_traceback}\n")
                    f.write("=" * 50 + "\n")
            except:
                pass
            
            return jsonify({
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
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

    @app.route('/api/llm_status')
    def llm_status():
        """Check if LLM analysis is available and working."""
        try:
            import os
            from ...analysis.sentiment.sa_LLM import analyze_sentiment as analyze_sentiment_llm
            
            # Check if API key is configured
            openai_key = os.getenv("OPENAI_API_KEY")
            if not openai_key or openai_key == "your_openai_api_key_here":
                return jsonify({
                    'available': False,
                    'status': 'not_configured',
                    'message': 'OpenAI API key not configured'
                })
            
            # Test with a simple analysis
            try:
                test_result = analyze_sentiment_llm("Hello", verbose=False)
                return jsonify({
                    'available': True,
                    'status': 'working',
                    'message': 'LLM analysis is available and working'
                })
            except Exception as e:
                error_msg = str(e)
                if "401" in error_msg or "invalid_api_key" in error_msg:
                    status = 'invalid_key'
                    message = 'Invalid OpenAI API key'
                elif "insufficient_quota" in error_msg:
                    status = 'quota_exceeded'
                    message = 'OpenAI API quota exceeded'
                else:
                    status = 'error'
                    message = f'LLM test failed: {error_msg}'
                
                return jsonify({
                    'available': False,
                    'status': status,
                    'message': message
                })
                
        except Exception as e:
            return jsonify({
                'available': False,
                'status': 'error',
                'message': f'LLM module error: {str(e)}'
            })

    @app.route('/api/reanalyze_with_llm', methods=['POST'])
    def reanalyze_with_llm():
        """Re-analyze existing transcriptions with LLM for enhanced results."""
        try:
            data = request.get_json()
            transcription_ids = data.get('transcription_ids', [])
            
            if not transcription_ids:
                return jsonify({'error': 'No transcription IDs provided'}), 400
            
            # Check if LLM is available
            import os
            openai_key = os.getenv("OPENAI_API_KEY")
            if not openai_key or openai_key == "your_openai_api_key_here":
                return jsonify({'error': 'LLM not configured'}), 400
            
            from ...analysis.sentiment.combined_analyzer import analyze_sentiment_combined
            
            results = []
            updated_count = 0
            
            for transcription_id in transcription_ids:
                try:
                    # Get the transcription
                    transcription = db_manager.get_transcription_with_analyses(transcription_id)
                    if not transcription:
                        results.append({
                            'transcription_id': transcription_id,
                            'status': 'not_found',
                            'message': 'Transcription not found'
                        })
                        continue
                    
                    # Perform combined analysis with LLM
                    combined_result = analyze_sentiment_combined(
                        transcription.text, 
                        transcription.speaker_id, 
                        None, 
                        use_llm=True, 
                        verbose=False
                    )
                    
                    # Check if LLM was actually used
                    if not combined_result.get('has_llm', False):
                        results.append({
                            'transcription_id': transcription_id,
                            'status': 'llm_failed',
                            'message': 'LLM analysis failed, using transformer only'
                        })
                        continue
                    
                    # Determine analyzer type
                    if combined_result.get('analysis_source') not in ['transformer_only', 'fallback']:
                        analyzer_type = AnalyzerType.COMBINED
                    else:
                        analyzer_type = AnalyzerType.TRANSFORMER
                    
                    # Update or create new analysis
                    # Check if we already have a COMBINED analysis
                    existing_combined = None
                    for analysis in transcription.sentiment_analyses:
                        if analysis.analyzer_type == AnalyzerType.COMBINED:
                            existing_combined = analysis
                            break
                    
                    if existing_combined:
                        # Update existing combined analysis
                        existing_combined.label = combined_result['label']
                        existing_combined.category = combined_result['category']
                        existing_combined.score = combined_result['score']
                        existing_combined.confidence = combined_result['confidence']
                        existing_combined.explanation = combined_result.get('explanation', 'Updated combined analysis')
                        db_manager.session.commit()
                    else:
                        # Create new combined analysis
                        db_manager.add_sentiment_analysis(
                            transcription_id=transcription.id,
                            analyzer_type=analyzer_type,
                            label=combined_result['label'],
                            category=combined_result['category'],
                            score=combined_result['score'],
                            confidence=combined_result['confidence'],
                            explanation=combined_result.get('explanation', 'Combined transformer + LLM analysis')
                        )
                    
                    updated_count += 1
                    results.append({
                        'transcription_id': transcription_id,
                        'status': 'success',
                        'category': combined_result['category'],
                        'confidence': combined_result['confidence'],
                        'analysis_source': combined_result.get('analysis_source', 'unknown')
                    })
                    
                except Exception as e:
                    results.append({
                        'transcription_id': transcription_id,
                        'status': 'error',
                        'message': str(e)
                    })
            
            return jsonify({
                'success': True,
                'updated_count': updated_count,
                'total_requested': len(transcription_ids),
                'results': results
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    config = get_config()
    config.ensure_directories()
    
    print("🎭 Starting Hopes & Sorrows Web Application...")
    print("📊 Database connected")
    print("🎤 Audio analysis ready")
    print("🎨 Visualization engine loaded")
    print(f"🌐 Server running on http://{config.get('FLASK_HOST')}:{config.get('FLASK_PORT')}")
    
    # Run with SocketIO support
    app.socketio.run(
        app, 
        debug=config.get('FLASK_ENV') == 'development', 
        host=config.get('FLASK_HOST'), 
        port=config.get('FLASK_PORT')
    )