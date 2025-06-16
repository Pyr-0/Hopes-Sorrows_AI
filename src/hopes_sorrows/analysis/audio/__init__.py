"""
Audio analysis module for speech processing and transcription.
"""

from .assembyai import analyze_audio, record, SpeakerManager

__all__ = [
    'analyze_audio',
    'record',
    'SpeakerManager'
]

# Alias for better API consistency
AudioAnalyzer = analyze_audio
record_audio = record 