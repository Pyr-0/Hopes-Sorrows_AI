from dotenv import load_dotenv
import os
import assemblyai as aai
import sounddevice as sd
from scipy.io.wavfile import write
import sys
import os
from datetime import datetime

# Fix the fork warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Add the project root to Python path to import the sentiment analyzers
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

from sentiment_analysis.sa_transformers import analyze_sentiment as analyze_sentiment_transformer
from sentiment_analysis.sa_LLM import analyze_sentiment as analyze_sentiment_llm
from database import DatabaseManager, AnalyzerType

load_dotenv()

API = os.getenv("API_KEY_ASSEMBLY")

class SpeakerManager:
	"""Manages speaker identification and tracking"""
		
	def __init__(self, db):
		self.db = db
		self.speaker_count = 0
		self.speaker_names = {}  # Map speaker IDs to names
		
	def get_speaker_name(self, speaker_id):
		"""Get or create a speaker name for the given ID"""
		# Check if we already have a name for this speaker
		if speaker_id in self.speaker_names:
			return self.speaker_names[speaker_id]
		
		# Check if speaker exists in database
		speaker = self.db.get_speaker_by_id(speaker_id)
		if speaker:
			self.speaker_names[speaker_id] = speaker.name
			return speaker.name
		
		# Create new speaker
		self.speaker_count += 1
		name = f"Speaker_{self.speaker_count}"
		self.db.add_speaker(speaker_id, name)
		self.speaker_names[speaker_id] = name
		return name
		
	def close(self):
		"""Clean up resources"""
		self.speaker_names.clear()

def record(duration=10, filename=None):
	"""Record audio with timestamp in filename"""
	# Create recordings directory if it doesn't exist
	recordings_dir = os.path.join(os.path.dirname(__file__), "recordings")
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

def analyze_audio(audio_file, use_llm=True):
	"""
	Analyze audio file using AssemblyAI and perform sentiment analysis.
		
	Args:
		audio_file (str): Path to the audio file
		use_llm (bool): Whether to use LLM-based sentiment analysis (True) or transformer-based (False)
		
	Returns:
		dict: Analysis results including transcription and sentiment analysis
	"""
	aai.settings.api_key = API
		
	# Initialize database manager
	db_manager = DatabaseManager()
	speaker_manager = SpeakerManager(db_manager)
		
	try:
		# Configure AssemblyAI with speaker diarization
		config = aai.TranscriptionConfig(
			speech_model=aai.SpeechModel.best,
			speaker_labels=True  # Enable speaker diarization
		)

		# Transcribe the audio
		transcript = aai.Transcriber(config=config).transcribe(audio_file)

		if transcript.status == "error":
			raise RuntimeError(f"Transcription failed: {transcript.error}")

		# Process each utterance with sentiment analysis
		results = []
		for utterance in transcript.utterances:
			speaker_id = utterance.speaker
			text = utterance.text
			
			# Get or create speaker
			speaker_name = speaker_manager.get_speaker_name(speaker_id)
			
			# Store transcription
			transcription = db_manager.add_transcription(speaker_id, text)
			
			# Perform sentiment analysis based on use_llm parameter
			if use_llm:
				sentiment = analyze_sentiment_llm(text)
				analyzer_type = AnalyzerType.LLM
			else:
				sentiment = analyze_sentiment_transformer(text)
				analyzer_type = AnalyzerType.TRANSFORMER
			
			# Store analysis in database
			db_manager.add_sentiment_analysis(
				transcription_id=transcription.id,
				analyzer_type=analyzer_type,
				label=sentiment['label'],
				category=sentiment['category'],
				score=sentiment['score'],
				confidence=sentiment['confidence'],
				explanation=sentiment.get('explanation')
			)
			
			results.append({
				"speaker": speaker_name,
				"text": text,
				"sentiment": sentiment
			})

		return {"utterances": results}
		
	finally:
		# Always close the database connection
		db_manager.close()
		speaker_manager.close()

def print_analysis(analysis):
	"""Print the analysis results in a readable format."""
	print("\n=== Transcription and Sentiment Analysis ===")
	for utterance in analysis["utterances"]:
		print(f"\n{utterance['speaker']}:")
		print(f"Text: {utterance['text']}")
		print(f"\nAnalysis:")
		print(f"  Label: {utterance['sentiment']['label']}")
		print(f"  Score: {utterance['sentiment']['score']:.2f}")
		print(f"  Confidence: {utterance['sentiment']['confidence']:.2f}")
		if utterance['sentiment'].get('explanation'):
			print(f"  Explanation: {utterance['sentiment']['explanation']}")

if __name__ == "__main__":
	# Record new audio
	new_recording = record()
		
	# print("\n=== Analysis Results ===")
	print("\n1. Using Transformer-based Analysis (DistilBERT):")
	# print("   - Faster, more efficient")
	# print("   - Works offline")
	# print("   - Best for English text")
	analysis_transformer = analyze_audio(new_recording, use_llm=False)
	print_analysis(analysis_transformer)
		
	print("\n2. Using LLM-based Analysis (GPT-4o-mini):")
	# print("   - More nuanced understanding")
	# print("   - Better at complex emotions")
	# print("   - Works with multiple languages")
	analysis_llm = analyze_audio(new_recording, use_llm=True)
	print_analysis(analysis_llm)
		
