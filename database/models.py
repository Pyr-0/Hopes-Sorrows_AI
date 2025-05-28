from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Enum
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

class Speaker(Base):
    """Model for storing speaker information"""
    __tablename__ = 'speakers'

    id = Column(String(50), primary_key=True)  # AssemblyAI speaker ID
    name = Column(String(50), unique=True, nullable=False)  # Human-readable name
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transcriptions = relationship("Transcription", back_populates="speaker")

    def __repr__(self):
        return f"<Speaker(name='{self.name}', id='{self.id}')>"

class Transcription(Base):
    """Model for storing transcribed text"""
    __tablename__ = 'transcriptions'

    id = Column(Integer, primary_key=True)
    speaker_id = Column(String(50), ForeignKey('speakers.id'), nullable=False)
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    speaker = relationship("Speaker", back_populates="transcriptions")
    sentiment_analyses = relationship("SentimentAnalysis", back_populates="transcription")

    def __repr__(self):
        return f"<Transcription(text='{self.text[:50]}...')>"

class SentimentAnalysis(Base):
    """Model for storing sentiment analysis results"""
    __tablename__ = 'sentiment_analyses'

    id = Column(Integer, primary_key=True)
    transcription_id = Column(Integer, ForeignKey('transcriptions.id'), nullable=False)
    analyzer_type = Column(Enum(AnalyzerType), nullable=False)
    label = Column(String(20), nullable=False)  # very_positive, positive, neutral, negative, very_negative
    category = Column(String(10), nullable=False)  # hope, sorrow, neutral
    score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    explanation = Column(String, nullable=True)  # Only for LLM analyzer
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transcription = relationship("Transcription", back_populates="sentiment_analyses")

    def __repr__(self):
        return f"<SentimentAnalysis(analyzer='{self.analyzer_type.value}', label='{self.label}', category='{self.category}')>" 