from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from .models import Base, RecordingSession, Speaker, Transcription, SentimentAnalysis, AnalyzerType
from datetime import datetime
from typing import Optional, Tuple

class DatabaseManager:
	"""Manager class for database operations with global speaker numbering"""
		
	def __init__(self, db_path="sqlite:///data/databases/sentiment_analysis.db"):
		"""Initialize database connection"""
		self.engine = create_engine(db_path)
		# Create tables if they don't exist
		Base.metadata.create_all(self.engine)
		Session = sessionmaker(bind=self.engine)
		self.session = Session()

	def create_recording_session(self, session_name: Optional[str] = None) -> RecordingSession:
		"""Create a new recording session with auto-generated name if not provided"""
		if not session_name:
			# Auto-generate session name: Recording-001, Recording-002, etc.
			last_session = self.session.query(RecordingSession).order_by(RecordingSession.id.desc()).first()
			if last_session:
				# Extract number from last session name and increment
				try:
					last_num = int(last_session.session_name.split('-')[1])
					session_name = f"Recording-{last_num + 1:03d}"
				except (IndexError, ValueError):
					# Fallback if parsing fails
					session_name = f"Recording-{self.session.query(RecordingSession).count() + 1:03d}"
			else:
				session_name = "Recording-001"
		
		recording_session = RecordingSession(session_name=session_name)
		self.session.add(recording_session)
		self.session.commit()
		return recording_session

	def get_next_global_speaker_number(self) -> int:
		"""Get the next global speaker sequence number"""
		max_sequence = self.session.query(func.max(Speaker.global_sequence)).scalar()
		return (max_sequence or 0) + 1

	def add_speaker(self, recording_session_id: int, assemblyai_speaker_id: str) -> Speaker:
		"""Add a new speaker with global sequential numbering"""
		# Generate global sequence number
		global_sequence = self.get_next_global_speaker_number()
		
		# Create technical ID combining session and AssemblyAI speaker ID
		technical_id = f"session_{recording_session_id}_{assemblyai_speaker_id}"
		
		# Create display name
		display_name = f"Speaker {global_sequence}"
		
		speaker = Speaker(
			id=technical_id,
			display_name=display_name,
			global_sequence=global_sequence,
			recording_session_id=recording_session_id,
			assemblyai_speaker_id=assemblyai_speaker_id
		)
		self.session.add(speaker)
		self.session.commit()
		return speaker

	def get_speaker_by_id(self, speaker_id: str) -> Optional[Speaker]:
		"""Get speaker by their technical ID"""
		return self.session.query(Speaker).filter_by(id=speaker_id).first()

	def get_or_create_speaker(self, recording_session_id: int, assemblyai_speaker_id: str) -> Speaker:
		"""Get existing speaker or create new one for this session + AssemblyAI ID combination"""
		technical_id = f"session_{recording_session_id}_{assemblyai_speaker_id}"
		speaker = self.get_speaker_by_id(technical_id)
		
		if not speaker:
			speaker = self.add_speaker(recording_session_id, assemblyai_speaker_id)
		
		return speaker

	def add_transcription(self, speaker_id: str, text: str, duration: Optional[float] = None, 
						 confidence_score: Optional[float] = None) -> Transcription:
		"""Add a new transcription with enhanced metadata"""
		# Calculate word count
		word_count = len(text.split()) if text else 0
		
		transcription = Transcription(
			speaker_id=speaker_id,
			text=text,
			duration=duration,
			word_count=word_count,
			confidence_score=confidence_score
		)
		self.session.add(transcription)
		self.session.commit()
		return transcription

	def add_sentiment_analysis(self, transcription_id: int, analyzer_type: AnalyzerType, 
							  label: str, category: str, score: float, confidence: float, 
							  explanation: Optional[str] = None) -> SentimentAnalysis:
		"""Add a new sentiment analysis result"""
		analysis = SentimentAnalysis(
			transcription_id=transcription_id,
			analyzer_type=analyzer_type,
			label=label,
			category=category,
			score=score,
			confidence=confidence,
			explanation=explanation
		)
		self.session.add(analysis)
		self.session.commit()
		return analysis

	def update_recording_session_stats(self, session_id: int):
		"""Update recording session statistics after processing"""
		try:
			recording_session = self.session.query(RecordingSession).filter_by(id=session_id).first()
			if not recording_session:
				print(f"Warning: Recording session {session_id} not found")
				return
			
			# Count speakers in this session
			speaker_count = self.session.query(Speaker).filter_by(recording_session_id=session_id).count()
			
			# Calculate average confidence from all transcriptions in this session
			speakers = self.session.query(Speaker).filter_by(recording_session_id=session_id).all()
			all_confidences = []
			
			for speaker in speakers:
				for transcription in speaker.transcriptions:
					if transcription.confidence_score:
						all_confidences.append(transcription.confidence_score)
			
			quality_score = sum(all_confidences) / len(all_confidences) if all_confidences else None
			
			# Update session
			recording_session.speaker_count = speaker_count
			recording_session.quality_score = quality_score
			self.session.commit()
			
		except Exception as e:
			print(f"Error updating recording session stats: {e}")
			# Don't re-raise the exception - this is not critical for the main functionality
			try:
				self.session.rollback()
			except:
				pass

	def get_transcription_with_analyses(self, transcription_id: int) -> Optional[Transcription]:
		"""Get a transcription with all its sentiment analyses"""
		return self.session.query(Transcription).filter_by(id=transcription_id).first()

	def get_all_transcriptions(self):
		"""Get all transcriptions with their analyses"""
		return self.session.query(Transcription).all()

	def get_speaker_transcriptions(self, speaker_id: str):
		"""Get all transcriptions for a specific speaker"""
		return self.session.query(Transcription).filter_by(speaker_id=speaker_id).all()

	def get_all_speakers(self):
		"""Get all speakers ordered by global sequence"""
		return self.session.query(Speaker).order_by(Speaker.global_sequence).all()

	def get_all_recording_sessions(self):
		"""Get all recording sessions ordered by creation date"""
		return self.session.query(RecordingSession).order_by(RecordingSession.created_at.desc()).all()

	def get_latest_recording_session(self) -> Optional[RecordingSession]:
		"""Get the most recent recording session"""
		return self.session.query(RecordingSession).order_by(RecordingSession.created_at.desc()).first()

	def get_speaker_count(self) -> int:
		"""Get total number of speakers (voices) in the system"""
		return self.session.query(Speaker).count()

	def get_recording_session_by_id(self, session_id: int) -> Optional[RecordingSession]:
		"""Get recording session by ID"""
		return self.session.query(RecordingSession).filter_by(id=session_id).first()

	def get_speakers_by_session(self, session_id: int):
		"""Get all speakers for a specific recording session"""
		return self.session.query(Speaker).filter_by(recording_session_id=session_id).all()

	def close(self):
		"""Close the database session"""
		self.session.close() 