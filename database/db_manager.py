from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base, Speaker, Transcription, SentimentAnalysis, AnalyzerType
from datetime import datetime

class DatabaseManager:
    """Manager class for database operations"""
    
    def __init__(self, db_path="sqlite:///sentiment_analysis.db"):
        """Initialize database connection"""
        self.engine = create_engine(db_path)
        # Create all tables
        Base.metadata.drop_all(self.engine)  # Drop existing tables
        Base.metadata.create_all(self.engine)  # Create new tables
        Session = sessionmaker(bind=self.engine)
        self.session = Session()

    def get_speaker_by_id(self, speaker_id):
        """Get speaker by their AssemblyAI ID"""
        return self.session.query(Speaker).filter_by(id=speaker_id).first()

    def add_speaker(self, speaker_id, name):
        """Add a new speaker"""
        speaker = Speaker(id=speaker_id, name=name)
        self.session.add(speaker)
        self.session.commit()
        return speaker

    def add_transcription(self, speaker_id, text):
        """Add a new transcription"""
        transcription = Transcription(
            speaker_id=speaker_id,
            text=text
        )
        self.session.add(transcription)
        self.session.commit()
        return transcription

    def add_sentiment_analysis(self, transcription_id, analyzer_type, label, category, score, confidence, explanation=None):
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

    def get_transcription_with_analyses(self, transcription_id):
        """Get a transcription with all its sentiment analyses"""
        return self.session.query(Transcription).filter_by(id=transcription_id).first()

    def get_all_transcriptions(self):
        """Get all transcriptions with their analyses"""
        return self.session.query(Transcription).all()

    def get_speaker_transcriptions(self, speaker_id):
        """Get all transcriptions for a specific speaker"""
        return self.session.query(Transcription).filter_by(speaker_id=speaker_id).all()

    def get_all_speakers(self):
        """Get all speakers with their last seen time"""
        return self.session.query(Speaker).all()

    def close(self):
        """Close the database session"""
        self.session.close() 