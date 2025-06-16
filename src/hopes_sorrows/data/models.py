from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

# Create the base class for declarative models
Base = declarative_base()

class AnalyzerType(enum.Enum):
    """Enum for different types of sentiment analyzers"""
    TRANSFORMER = "transformer"
    LLM = "llm"

class RecordingSession(Base):
    """Model for storing recording session information"""
    __tablename__ = 'recording_sessions'

    id = Column(Integer, primary_key=True)
    session_name = Column(String(50), unique=True, nullable=False)  # "Recording-001"
    created_at = Column(DateTime, default=datetime.utcnow)
    duration = Column(Float, nullable=True)  # Actual recording duration
    speaker_count = Column(Integer, default=1)  # Number of speakers detected
    quality_score = Column(Float, nullable=True)  # Average confidence score
    
    # Relationships
    speakers = relationship("Speaker", back_populates="recording_session")

    def __repr__(self):
        return f"<RecordingSession(name='{self.session_name}', speakers={self.speaker_count})>"

class Speaker(Base):
    """Model for storing speaker information with global sequential numbering"""
    __tablename__ = 'speakers'

    id = Column(String(50), primary_key=True)  # Technical ID (session_id + assemblyai_id)
    display_name = Column(String(50), nullable=False)  # "Speaker 1", "Speaker 2"
    global_sequence = Column(Integer, unique=True, nullable=False)  # 1, 2, 3, 4...
    recording_session_id = Column(Integer, ForeignKey('recording_sessions.id'), nullable=False)
    assemblyai_speaker_id = Column(String(10), nullable=False)  # "A", "B", "C" from AssemblyAI
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    recording_session = relationship("RecordingSession", back_populates="speakers")
    transcriptions = relationship("Transcription", back_populates="speaker")

    def __repr__(self):
        return f"<Speaker(display_name='{self.display_name}', sequence={self.global_sequence})>"

class Transcription(Base):
    """Model for storing transcribed text"""
    __tablename__ = 'transcriptions'

    id = Column(Integer, primary_key=True)
    speaker_id = Column(String(50), ForeignKey('speakers.id'), nullable=False)
    text = Column(Text, nullable=False)
    duration = Column(Float, nullable=True)  # Length of utterance in seconds
    word_count = Column(Integer, nullable=True)  # Number of words
    confidence_score = Column(Float, nullable=True)  # AssemblyAI confidence
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    speaker = relationship("Speaker", back_populates="transcriptions")
    sentiment_analyses = relationship("SentimentAnalysis", back_populates="transcription")

    def __repr__(self):
        return f"<Transcription(speaker='{self.speaker.display_name}', text='{self.text[:50]}...')>"

class SentimentAnalysis(Base):
    """Model for storing sentiment analysis results"""
    __tablename__ = 'sentiment_analyses'

    id = Column(Integer, primary_key=True)
    transcription_id = Column(Integer, ForeignKey('transcriptions.id'), nullable=False)
    analyzer_type = Column(Enum(AnalyzerType), nullable=False)
    label = Column(String(20), nullable=False)  # very_positive, positive, neutral, negative, very_negative
    category = Column(String(25), nullable=False)  # hope, sorrow, transformative, ambivalent, reflective_neutral
    score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    explanation = Column(Text, nullable=True)  # Only for LLM analyzer
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transcription = relationship("Transcription", back_populates="sentiment_analyses")

    def __repr__(self):
        return f"<SentimentAnalysis(analyzer='{self.analyzer_type.value}', label='{self.label}', category='{self.category}')>" 