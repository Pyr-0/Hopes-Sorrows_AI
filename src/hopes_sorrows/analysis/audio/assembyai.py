from dotenv import load_dotenv
import os
import assemblyai as aai
# Audio recording libraries only needed for CLI recording, not web app
try:
    import sounddevice as sd
    from scipy.io.wavfile import write
    AUDIO_RECORDING_AVAILABLE = True
except ImportError:
    AUDIO_RECORDING_AVAILABLE = False
    # This is fine - web app uses browser recording, CLI can use file upload
import sys
import os
from datetime import datetime
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

# Fix the fork warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Use relative imports for the new package structure
from ...analysis.sentiment.cli_formatter import format_sentiment_result, format_batch_results, format_error
from ...analysis.sentiment.sa_transformers import analyze_sentiment as analyze_sentiment_transformer
from ...analysis.sentiment.sa_LLM import analyze_sentiment as analyze_sentiment_llm
from ...data.db_manager import DatabaseManager
from ...data.models import AnalyzerType
from ...core.config import get_config

# Load configuration
config = get_config()
dotenv_path = config.get_dotenv_path()
load_dotenv(dotenv_path)

API = os.getenv("ASSEMBLYAI_API_KEY")

console = Console()

class SpeakerManager:
	"""Manages speaker identification with global sequential numbering"""
		
	def __init__(self, db_manager):
		self.db_manager = db_manager
		self.recording_session = None
		self.speaker_cache = {}  # Cache speakers for this session
		
	def create_recording_session(self, session_name=None):
		"""Create a new recording session"""
		self.recording_session = self.db_manager.create_recording_session(session_name)
		console.print(f"[green]✓[/green] Created recording session: {self.recording_session.session_name}")
		return self.recording_session
		
	def get_or_create_speaker(self, assemblyai_speaker_id):
		"""Get or create a speaker with global sequential numbering"""
		if not self.recording_session:
			raise ValueError("Recording session must be created first")
		
		# Check cache first
		if assemblyai_speaker_id in self.speaker_cache:
			return self.speaker_cache[assemblyai_speaker_id]
		
		# Get or create speaker
		speaker = self.db_manager.get_or_create_speaker(
			self.recording_session.id, 
			assemblyai_speaker_id
		)
		
		# Cache the speaker
		self.speaker_cache[assemblyai_speaker_id] = speaker
		
		console.print(f"[green]✓[/green] Using speaker: {speaker.display_name}")
		return speaker
		
	def finalize_session(self):
		"""Finalize the recording session and update statistics"""
		if self.recording_session:
			self.db_manager.update_recording_session_stats(self.recording_session.id)
			console.print(f"[green]✓[/green] Finalized session: {self.recording_session.session_name}")
		
	def close(self):
		"""Clean up resources"""
		self.finalize_session()
		self.speaker_cache.clear()

def record(duration=65, filename=None):
	"""Record audio with timestamp in filename"""
	if not AUDIO_RECORDING_AVAILABLE:
		raise RuntimeError("Audio recording not available. Please install PyAudio: pip install pyaudio")
	
	# Create recordings directory in the centralized data directory
	from ...core.config import get_config
	config = get_config()
	recordings_dir = config.get_recordings_path()
	os.makedirs(recordings_dir, exist_ok=True)
		
	if filename is None:
		timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
		filename = f"recording_{timestamp}.wav"
		
	# Ensure filename is in the recordings directory
	filepath = os.path.join(recordings_dir, filename)
		
	fs = 44100  # Sample rate
	print("🎤 Recording...")
	audio = sd.rec(int(duration * fs), samplerate=fs, channels=1)
	sd.wait()
	write(filepath, fs, audio)
	print(f"✅ Saved as {filepath}")
	return filepath

def analyze_audio(audio_file, use_llm=True, expected_speakers=None):
	"""
	Analyze audio file using AssemblyAI and perform sentiment analysis.
		
	Args:
		audio_file (str): Path to the audio file
		use_llm (bool): Whether to use LLM-based sentiment analysis (True) or transformer-based (False)
		expected_speakers (int, optional): Expected number of speakers. If None, will be automatically detected.
		
	Returns:
		dict: Analysis results including transcription and sentiment analysis
	"""
	aai.settings.api_key = API
		
	# Initialize database manager
	db_manager = DatabaseManager()
	speaker_manager = SpeakerManager(db_manager)
	
	# Create recording session
	recording_session = speaker_manager.create_recording_session()
		
	try:
		# Configure AssemblyAI with enhanced speaker diarization settings AND content safety
		config = aai.TranscriptionConfig(
			speech_model=aai.SpeechModel.best,
			speaker_labels=True,  # Enable speaker diarization
			punctuate=True,       # Add punctuation
			format_text=True,     # Format text for better readability
			# Enhanced speaker diarization settings
			speakers_expected=expected_speakers,  # Use the expected_speakers parameter
			# Additional quality improvements
			auto_chapters=False,  # Disable to avoid interference with speaker detection
			word_boost=["speaker", "person", "voice"],  # Boost speaker-related words
			boost_param="high",    # High boost for better speaker detection
			# ENHANCED: Content safety and filtering
			filter_profanity=True,  # Filter profanity with asterisks
			content_safety=True,    # Enable content safety detection
			content_safety_confidence=75  # Set confidence threshold to 75%
		)

		console.print("\n[bold]Transcribing audio with speaker diarization and content safety...[/bold]")
		transcript = aai.Transcriber(config=config).transcribe(audio_file)

		if transcript.status == "error":
			raise RuntimeError(f"Transcription failed: {transcript.error}")

		# ENHANCED: Check for empty or no-speech audio
		if not transcript.utterances or len(transcript.utterances) == 0:
			console.print(f"[bold red]❌ No Speech Detected[/bold red]")
			console.print("[yellow]The audio file contains no detectable speech.[/yellow]")
			console.print("[yellow]This could be due to:[/yellow]")
			console.print("[yellow]• Silent audio or background noise only[/yellow]")
			console.print("[yellow]• Very poor audio quality[/yellow]")
			console.print("[yellow]• Non-speech audio (music, sounds, etc.)[/yellow]")
			console.print("[yellow]• Audio too short or quiet[/yellow]")
			
			return {
				"utterances": [],
				"status": "no_speech",
				"message": "No speech detected in audio file",
				"suggestions": [
					"Check audio quality and volume",
					"Ensure the recording contains clear speech",
					"Try a longer recording with more content",
					"Verify the audio file is not corrupted"
				]
			}

		# Debug information about the transcript
		console.print(f"\n[bold]Transcript Status:[/bold] {transcript.status}")
		console.print(f"[bold]Number of utterances:[/bold] {len(transcript.utterances)}")
		
		# ENHANCED: Content safety analysis
		if hasattr(transcript, 'content_safety_labels') and transcript.content_safety_labels:
			content_safety = transcript.content_safety_labels
			if content_safety.status == "success" and content_safety.results:
				console.print(f"\n[bold red]🚨 Content Safety Alert[/bold red]")
				console.print(f"[red]Potentially inappropriate content detected:[/red]")
				
				for result in content_safety.results:
					for label in result.labels:
						severity_text = "Low" if label.severity < 0.3 else "Medium" if label.severity < 0.7 else "High"
						console.print(f"[red]• {label.label.title()}: {label.confidence:.1%} confidence, {severity_text} severity[/red]")
						console.print(f"[red]  Text: \"{result.text[:100]}...\"[/red]")
				
				# Ask user if they want to continue
				console.print(f"\n[yellow]⚠️ Warning: This content may not be suitable for sentiment analysis.[/yellow]")
				console.print(f"[yellow]Content safety features have been applied (profanity filtered).[/yellow]")
		
		# Get unique speakers
		unique_speakers = set(utterance.speaker for utterance in transcript.utterances)
		console.print(f"[bold]Number of detected speakers:[/bold] {len(unique_speakers)}")
		console.print(f"[bold]Speaker IDs:[/bold] {', '.join(unique_speakers)}")
		
		# Enhanced speaker analysis - detect potential issues
		if expected_speakers and len(unique_speakers) != expected_speakers:
			console.print(f"[bold yellow]⚠️ Warning:[/bold yellow] Expected {expected_speakers} speakers but detected {len(unique_speakers)}")
			console.print("[yellow]Tip: For better speaker separation:[/yellow]")
			console.print("[yellow]- Ensure each speaker talks for at least 30 seconds[/yellow]")
			console.print("[yellow]- Avoid short phrases like 'yeah', 'right', 'sounds good'[/yellow]")
			console.print("[yellow]- Minimize background noise and cross-talk[/yellow]")
			console.print("[yellow]- Consider using multichannel recording if possible[/yellow]")
		
		# ENHANCED: Analyze utterance patterns for quality assessment
		short_utterances = [u for u in transcript.utterances if len(u.text.split()) < 3]
		very_short_utterances = [u for u in transcript.utterances if len(u.text.strip()) < 5]  # Less than 5 characters
		nonsensical_utterances = []
		
		# Check for nonsensical content
		for utterance in transcript.utterances:
			text = utterance.text.strip().lower()
			# Check for patterns that suggest nonsensical input
			if (len(text.split()) < 2 and 
				not any(word in text for word in ['yes', 'no', 'ok', 'okay', 'hello', 'hi', 'bye', 'thanks', 'thank you']) and
				len(text) > 0):
				nonsensical_utterances.append(utterance)
		
		# Quality warnings
		if len(short_utterances) > len(transcript.utterances) * 0.3:  # More than 30% short utterances
			console.print(f"[bold yellow]⚠️ Quality Warning:[/bold yellow] {len(short_utterances)} out of {len(transcript.utterances)} utterances are very short")
			console.print("[yellow]This may affect speaker diarization and sentiment analysis accuracy[/yellow]")
		
		if len(very_short_utterances) > len(transcript.utterances) * 0.5:  # More than 50% very short
			console.print(f"[bold yellow]⚠️ Quality Warning:[/bold yellow] {len(very_short_utterances)} out of {len(transcript.utterances)} utterances are extremely short")
			console.print("[yellow]Consider recording longer, more substantial speech for better analysis[/yellow]")
		
		if len(nonsensical_utterances) > 0:
			console.print(f"[bold yellow]⚠️ Content Warning:[/bold yellow] {len(nonsensical_utterances)} utterances may contain nonsensical content")
			console.print("[yellow]This could be due to:[/yellow]")
			console.print("[yellow]• Background noise being interpreted as speech[/yellow]")
			console.print("[yellow]• Poor audio quality causing transcription errors[/yellow]")
			console.print("[yellow]• Non-speech sounds (music, effects, etc.)[/yellow]")
		
		# Process each utterance with sentiment analysis
		results = []
		processed_count = 0
		skipped_count = 0
		
		for utterance in transcript.utterances:
			speaker_id = utterance.speaker
			text = utterance.text.strip()
			
			# ENHANCED: Skip empty or very short utterances
			if not text or len(text.strip()) < 2:
				skipped_count += 1
				console.print(f"[dim]⏭️ Skipped empty/very short utterance[/dim]")
				continue
			
			# ENHANCED: Check for nonsensical content and handle appropriately
			if _is_nonsensical_content(text):
				console.print(f"[yellow]⚠️ Potentially nonsensical content detected: \"{text[:50]}...\"[/yellow]")
				console.print(f"[yellow]Proceeding with analysis but results may be unreliable[/yellow]")
				
			# Get or create speaker for this session
			speaker = speaker_manager.get_or_create_speaker(speaker_id)
			
			# Store transcription with enhanced metadata
			transcription = db_manager.add_transcription(
				speaker.id, 
				text,
				duration=(utterance.end - utterance.start) / 1000.0,  # Convert ms to seconds
				confidence_score=getattr(utterance, 'confidence', None)
			)
			console.print(f"[blue]💾[/blue] Stored transcription for {speaker.display_name}: {text[:50]}...")
			
			# ENHANCED: Perform sentiment analysis with error handling
			try:
				transformer_sentiment = analyze_sentiment_transformer(text, speaker_id, None, verbose=False)
				processed_count += 1
			except Exception as e:
				console.print(f"[red]❌ Transformer analysis failed for utterance: {str(e)}[/red]")
				transformer_sentiment = _create_fallback_sentiment_result(text, "transformer_error")
			
			llm_sentiment = None
			if use_llm:
				try:
					llm_sentiment = analyze_sentiment_llm(text, speaker_id, None, None, verbose=False)
				except Exception as e:
					console.print(f"[red]❌ LLM analysis failed for utterance: {str(e)}[/red]")
					llm_sentiment = _create_fallback_sentiment_result(text, "llm_error")
			
			# Store transformer analysis in database
			transformer_analysis = db_manager.add_sentiment_analysis(
				transcription_id=transcription.id,
				analyzer_type=AnalyzerType.TRANSFORMER,
				label=transformer_sentiment['label'],
				category=transformer_sentiment['category'],
				score=transformer_sentiment['score'],
				confidence=transformer_sentiment['confidence'],
				explanation=transformer_sentiment.get('explanation')
			)
			console.print(f"[green]💾[/green] Stored transformer analysis: {transformer_sentiment['category']}")
			
			# Store LLM analysis if enabled
			if use_llm and llm_sentiment:
				llm_analysis = db_manager.add_sentiment_analysis(
					transcription_id=transcription.id,
					analyzer_type=AnalyzerType.LLM,
					label=llm_sentiment['label'],
					category=llm_sentiment['category'],
					score=llm_sentiment['score'],
					confidence=llm_sentiment['confidence'],
					explanation=llm_sentiment.get('explanation')
				)
				console.print(f"[yellow]💾[/yellow] Stored LLM analysis: {llm_sentiment['category']}")
			
			results.append({
				"speaker": speaker.display_name,
				"speaker_id": speaker.id,
				"global_sequence": speaker.global_sequence,
				"text": text,
				"start_time": utterance.start,
				"end_time": utterance.end,
				"transformer_sentiment": transformer_sentiment,
				"llm_sentiment": llm_sentiment if use_llm else None
			})

		# ENHANCED: Provide processing summary
		console.print(f"\n[bold green]✅ Processing Complete[/bold green]")
		console.print(f"[green]Successfully processed: {processed_count} utterances[/green]")
		if skipped_count > 0:
			console.print(f"[yellow]Skipped: {skipped_count} empty/very short utterances[/yellow]")

		return {
			"utterances": results,
			"status": "success",
			"processing_summary": {
				"total_utterances": len(transcript.utterances),
				"processed": processed_count,
				"skipped": skipped_count,
				"quality_warnings": len(short_utterances) + len(very_short_utterances) + len(nonsensical_utterances)
			}
		}
		
	except Exception as e:
		console.print(f"[bold red]❌ Analysis Failed[/bold red]")
		console.print(f"[red]Error: {str(e)}[/red]")
		console.print(f"[yellow]This could be due to:[/yellow]")
		console.print(f"[yellow]• Network connectivity issues[/yellow]")
		console.print(f"[yellow]• Invalid audio file format[/yellow]")
		console.print(f"[yellow]• AssemblyAI API issues[/yellow]")
		console.print(f"[yellow]• Insufficient API credits[/yellow]")
		
		return {
			"utterances": [],
			"status": "error",
			"error": str(e),
			"suggestions": [
				"Check your internet connection",
				"Verify the audio file is valid and accessible",
				"Check your AssemblyAI API key and credits",
				"Try again in a few minutes"
			]
		}
		
	finally:
		# Always close the database connection
		db_manager.close()
		speaker_manager.close()

def _is_nonsensical_content(text: str) -> bool:
	"""
	Check if the text appears to be nonsensical or likely transcription errors.
	
	Args:
		text: The text to analyze
		
	Returns:
		bool: True if the content appears nonsensical
	"""
	text_lower = text.lower().strip()
	words = text_lower.split()
	
	# Very short single words that aren't common speech
	if len(words) == 1 and len(text_lower) < 4:
		common_short_words = ['yes', 'no', 'ok', 'hi', 'bye', 'wow', 'oh', 'ah', 'um', 'uh', 'you']
		if text_lower not in common_short_words:
			return True
	
	# Repetitive patterns (like "la la la", "tick tock tick tock")
	if len(words) >= 3:
		# Check for repetitive patterns - but only if words are actually repeated
		unique_words = set(words)
		
		# Case 1: Very few unique words repeated many times (like "la la la la")
		if len(unique_words) <= 2 and len(words) >= 4:
			return True
		
		# Case 2: Moderate repetition with simple words (like "tick tock tick tock la la la")
		if len(unique_words) <= 3 and len(words) >= 6:
			# Check if most words are repeated
			word_counts = {}
			for word in words:
				word_counts[word] = word_counts.get(word, 0) + 1
			
			# If any word appears 3+ times, it's likely nonsensical
			max_repetitions = max(word_counts.values())
			if max_repetitions >= 3:
				return True
	
	# Check for patterns that suggest noise/nonsense
	nonsense_patterns = [
		r'^[a-z]{1,3}\.{3,}$',  # Single letters with dots like "a..."
		r'^[a-z\s]{1,10}\.$',   # Very short with just a period
		r'^[^a-zA-Z\s]*$',      # No letters at all (symbols only)
		r'^[a-z]\s[a-z]\s[a-z](\s[a-z])*$',  # FIXED: Only single letters separated by spaces (like "a b c d")
	]
	
	import re
	for pattern in nonsense_patterns:
		if re.match(pattern, text_lower):
			return True
	
	# Check for excessive punctuation or symbols
	non_alpha_count = sum(1 for char in text if not char.isalpha() and not char.isspace())
	if len(text) > 0 and non_alpha_count / len(text) > 0.5:  # More than 50% non-alphabetic
		return True
	
	return False

def _create_fallback_sentiment_result(text: str, error_type: str) -> dict:
	"""
	Create a fallback sentiment result when analysis fails.
	
	Args:
		text: The original text
		error_type: Type of error that occurred
		
	Returns:
		dict: Fallback sentiment result
	"""
	return {
		"score": 0.0,
		"label": "neutral",
		"category": "reflective_neutral",
		"intensity": 0.0,
		"confidence": 0.0,
		"classification_confidence": 0.0,
		"matched_patterns": [],
		"explanation": f"Analysis failed ({error_type}). Fallback neutral classification applied for: \"{text[:50]}...\""
	}

def print_analysis(analysis):
	"""Print the analysis results using enhanced CLI formatting with detailed explanations."""
	console.print("\n[bold cyan]=== 🎤 Open Mic Session Analysis ===[/bold cyan]")
	
	# ENHANCED: Handle different analysis statuses
	status = analysis.get("status", "unknown")
	
	if status == "no_speech":
		# Handle no speech detected
		console.print(f"\n[bold red]❌ No Speech Detected[/bold red]")
		console.print(f"[yellow]{analysis.get('message', 'No speech found in audio')}[/yellow]")
		
		if "suggestions" in analysis:
			console.print(f"\n[bold blue]💡 Suggestions:[/bold blue]")
			for suggestion in analysis["suggestions"]:
				console.print(f"[blue]• {suggestion}[/blue]")
		return
	
	elif status == "error":
		# Handle analysis errors
		console.print(f"\n[bold red]❌ Analysis Failed[/bold red]")
		console.print(f"[red]Error: {analysis.get('error', 'Unknown error occurred')}[/red]")
		
		if "suggestions" in analysis:
			console.print(f"\n[bold blue]💡 Suggestions:[/bold blue]")
			for suggestion in analysis["suggestions"]:
				console.print(f"[blue]• {suggestion}[/blue]")
		return
	
	# Handle successful analysis
	utterances = analysis.get("utterances", [])
	
	if not utterances:
		console.print(f"\n[bold yellow]⚠️ No Valid Utterances Found[/bold yellow]")
		console.print(f"[yellow]All utterances were filtered out or failed processing[/yellow]")
		
		# Show processing summary if available
		if "processing_summary" in analysis:
			summary = analysis["processing_summary"]
			console.print(f"\n[bold]📊 Processing Summary:[/bold]")
			console.print(f"[yellow]Total utterances detected: {summary.get('total_utterances', 0)}[/yellow]")
			console.print(f"[yellow]Successfully processed: {summary.get('processed', 0)}[/yellow]")
			console.print(f"[yellow]Skipped: {summary.get('skipped', 0)}[/yellow]")
			console.print(f"[yellow]Quality warnings: {summary.get('quality_warnings', 0)}[/yellow]")
		return
	
	# Group utterances by speaker
	speaker_utterances = {}
	for utterance in utterances:
		speaker = utterance["speaker"]
		if speaker not in speaker_utterances:
			speaker_utterances[speaker] = []
		speaker_utterances[speaker].append(utterance)
	
	# ENHANCED: Show processing summary if available
	if "processing_summary" in analysis:
		summary = analysis["processing_summary"]
		console.print(f"\n[bold green]📊 Processing Summary:[/bold green]")
		
		summary_table = Table(box=box.ROUNDED, show_header=True, header_style="bold green")
		summary_table.add_column("📈 Metric", style="cyan", width=20)
		summary_table.add_column("🎯 Value", style="green", width=10)
		summary_table.add_column("📝 Description", style="yellow")
		
		summary_table.add_row("Total Detected", str(summary.get('total_utterances', 0)), "Total utterances found by AssemblyAI")
		summary_table.add_row("Successfully Processed", str(summary.get('processed', 0)), "Utterances that completed sentiment analysis")
		summary_table.add_row("Skipped", str(summary.get('skipped', 0)), "Empty or very short utterances filtered out")
		summary_table.add_row("Quality Warnings", str(summary.get('quality_warnings', 0)), "Utterances with potential quality issues")
		
		console.print(summary_table)
	
	# Print enhanced summary table
	summary_table = Table(box=box.ROUNDED, show_header=True, header_style="bold magenta")
	summary_table.add_column("🎭 Speaker", style="cyan", width=15)
	summary_table.add_column("📝 Contributions", style="green", width=15)
	summary_table.add_column("⏱️ Time Range", style="yellow", width=20)
	summary_table.add_column("🔄 Transformer", style="blue", width=15)
	summary_table.add_column("🤖 LLM", style="magenta", width=15)
	
	for speaker, utterances in speaker_utterances.items():
		start_time = min(u["start_time"] for u in utterances)
		end_time = max(u["end_time"] for u in utterances)
		
		# Get dominant categories
		transformer_categories = [u["transformer_sentiment"]["category"] for u in utterances]
		llm_categories = [u["llm_sentiment"]["category"] if u["llm_sentiment"] else "N/A" for u in utterances]
		
		# Most common category
		from collections import Counter
		transformer_dominant = Counter(transformer_categories).most_common(1)[0][0]
		llm_dominant = Counter([c for c in llm_categories if c != "N/A"]).most_common(1)[0][0] if any(c != "N/A" for c in llm_categories) else "N/A"
		
		summary_table.add_row(
			speaker,
			str(len(utterances)),
			f"{start_time:.1f}s - {end_time:.1f}s",
			transformer_dominant,
			llm_dominant
		)
	
	console.print("\n[bold]📊 Session Summary:[/bold]")
	console.print(summary_table)
	
	# Print detailed analysis for each speaker using enhanced formatter
	for speaker, utterances in speaker_utterances.items():
		console.print(f"\n[bold cyan]🎭 Speaker: {speaker}[/bold cyan]")
		
		for i, utterance in enumerate(utterances, 1):
			console.print(f"\n[bold blue]📝 Contribution {i}[/bold blue]")
			
			# ENHANCED: Check for potential issues with this utterance
			text = utterance["text"]
			issues = []
			
			if len(text.strip()) < 10:
				issues.append("Very short text")
			if _is_nonsensical_content(text):
				issues.append("Potentially nonsensical content")
			if utterance["transformer_sentiment"]["confidence"] < 0.3:
				issues.append("Low confidence analysis")
			
			# Create utterance info panel with warnings if needed
			utterance_info_text = (
				f"[bold]Text:[/bold] {text}\n"
				f"[bold]Time:[/bold] {utterance['start_time']:.1f}s - {utterance['end_time']:.1f}s\n"
				f"[bold]Duration:[/bold] {utterance['end_time'] - utterance['start_time']:.1f}s\n"
				f"[bold]Session Speaker ID:[/bold] {utterance.get('session_speaker_id', 'N/A')}"
			)
			
			if issues:
				utterance_info_text += f"\n[bold red]⚠️ Issues:[/bold red] {', '.join(issues)}"
			
			utterance_info = Panel(
				utterance_info_text,
				title="🎤 Utterance Details",
				border_style="blue" if not issues else "yellow",
				padding=(1, 2)
			)
			console.print(utterance_info)
			
			# Show detailed transformer analysis
			console.print(f"\n[bold green]🔄 TRANSFORMER ANALYSIS[/bold green]")
			format_sentiment_result(utterance['transformer_sentiment'])
			
			# Show detailed LLM analysis if available
			if utterance['llm_sentiment']:
				console.print(f"\n[bold yellow]🤖 LLM ANALYSIS[/bold yellow]")
				format_sentiment_result(utterance['llm_sentiment'])
			else:
				console.print(f"\n[bold red]🤖 LLM ANALYSIS: Not Available[/bold red]")
			
			# Comparison panel if both analyses are available
			if utterance['llm_sentiment']:
				transformer_cat = utterance['transformer_sentiment']['category']
				llm_cat = utterance['llm_sentiment']['category']
				
				if transformer_cat == llm_cat:
					agreement_status = f"[green]✅ AGREEMENT: Both models classify as {transformer_cat.upper()}[/green]"
				else:
					agreement_status = f"[yellow]⚠️ DISAGREEMENT: Transformer={transformer_cat.upper()}, LLM={llm_cat.upper()}[/yellow]"
				
				comparison_panel = Panel(
					f"{agreement_status}\n\n"
					f"[bold]Score Comparison:[/bold]\n"
					f"• Transformer: {utterance['transformer_sentiment']['score']:.3f}\n"
					f"• LLM: {utterance['llm_sentiment']['score']:.3f}\n\n"
					f"[bold]Confidence Comparison:[/bold]\n"
					f"• Transformer: {utterance['transformer_sentiment']['confidence']:.1%}\n"
					f"• LLM: {utterance['llm_sentiment']['confidence']:.1%}",
					title="🔍 Model Comparison",
					border_style="magenta",
					padding=(1, 2)
				)
				console.print(f"\n")
				console.print(comparison_panel)
			
			console.print("\n" + "="*100)

if __name__ == "__main__":
	# Record new audio
	new_recording = record()
		
	# Analyze with both transformer and LLM
	analysis = analyze_audio(new_recording, use_llm=True)
	print_analysis(analysis)
		
