import sqlite3
from datetime import datetime
from typing import Optional, List, Dict
import json

class DatabaseSchema:
    def __init__(self, db_path: str = "sentiment_analysis.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize the database with required tables."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create recordings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS recordings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    duration REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    speaker_id TEXT,
                    metadata TEXT
                )
            """)
            
            # Create transcriptions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transcriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    recording_id INTEGER,
                    text TEXT NOT NULL,
                    start_time REAL,
                    end_time REAL,
                    speaker_id TEXT,
                    confidence REAL,
                    FOREIGN KEY (recording_id) REFERENCES recordings(id)
                )
            """)
            
            # Create sentiment_analysis table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sentiment_analysis (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transcription_id INTEGER,
                    model_type TEXT NOT NULL,
                    score REAL,
                    label TEXT,
                    confidence REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transcription_id) REFERENCES transcriptions(id)
                )
            """)
            
            # Create emotion_classification table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS emotion_classification (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transcription_id INTEGER,
                    category TEXT NOT NULL,
                    confidence REAL,
                    score REAL,
                    matched_patterns TEXT,
                    explanation TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transcription_id) REFERENCES transcriptions(id)
                )
            """)
            
            # Create speaker_profiles table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS speaker_profiles (
                    speaker_id TEXT PRIMARY KEY,
                    calibration_factors TEXT,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create narrative_arcs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS narrative_arcs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    speaker_id TEXT,
                    sequence_number INTEGER,
                    category TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (speaker_id) REFERENCES speaker_profiles(speaker_id)
                )
            """)
            
            conn.commit()
    
    def save_recording(self, filename: str, duration: float, speaker_id: Optional[str] = None, metadata: Optional[Dict] = None) -> int:
        """Save a new recording entry."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO recordings (filename, duration, speaker_id, metadata) VALUES (?, ?, ?, ?)",
                (filename, duration, speaker_id, json.dumps(metadata) if metadata else None)
            )
            return cursor.lastrowid
    
    def save_transcription(self, recording_id: int, text: str, start_time: float, end_time: float, 
                         speaker_id: Optional[str] = None, confidence: Optional[float] = None) -> int:
        """Save a new transcription entry."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO transcriptions 
                   (recording_id, text, start_time, end_time, speaker_id, confidence)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (recording_id, text, start_time, end_time, speaker_id, confidence)
            )
            return cursor.lastrowid
    
    def save_sentiment_analysis(self, transcription_id: int, model_type: str, score: float,
                              label: str, confidence: float) -> int:
        """Save sentiment analysis results."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO sentiment_analysis 
                   (transcription_id, model_type, score, label, confidence)
                   VALUES (?, ?, ?, ?, ?)""",
                (transcription_id, model_type, score, label, confidence)
            )
            return cursor.lastrowid
    
    def save_emotion_classification(self, transcription_id: int, category: str, confidence: float,
                                  score: float, matched_patterns: List[Dict], explanation: str) -> int:
        """Save emotion classification results."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO emotion_classification 
                   (transcription_id, category, confidence, score, matched_patterns, explanation)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (transcription_id, category, confidence, score, 
                 json.dumps(matched_patterns), explanation)
            )
            return cursor.lastrowid
    
    def update_speaker_profile(self, speaker_id: str, calibration_factors: Dict[str, float]):
        """Update or create speaker profile."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT OR REPLACE INTO speaker_profiles 
                   (speaker_id, calibration_factors, last_updated)
                   VALUES (?, ?, ?)""",
                (speaker_id, json.dumps(calibration_factors), datetime.now())
            )
    
    def save_narrative_arc(self, speaker_id: str, category: str, sequence_number: int):
        """Save a narrative arc entry."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO narrative_arcs 
                   (speaker_id, sequence_number, category)
                   VALUES (?, ?, ?)""",
                (speaker_id, sequence_number, category)
            )
    
    def get_speaker_profile(self, speaker_id: str) -> Optional[Dict]:
        """Get speaker profile with calibration factors."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT calibration_factors FROM speaker_profiles WHERE speaker_id = ?",
                (speaker_id,)
            )
            result = cursor.fetchone()
            return json.loads(result[0]) if result else None
    
    def get_narrative_arc(self, speaker_id: str, limit: int = 5) -> List[Dict]:
        """Get recent narrative arc entries for a speaker."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """SELECT sequence_number, category, timestamp 
                   FROM narrative_arcs 
                   WHERE speaker_id = ? 
                   ORDER BY sequence_number DESC 
                   LIMIT ?""",
                (speaker_id, limit)
            )
            return [
                {
                    "sequence_number": row[0],
                    "category": row[1],
                    "timestamp": row[2]
                }
                for row in cursor.fetchall()
            ] 