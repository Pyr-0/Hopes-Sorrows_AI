#!/usr/bin/env python3
"""
Comprehensive test for the enhanced emotion classification system.
Tests session-based speakers, database storage, and detailed CLI output.
"""

import sys
import os
sys.path.append('.')

from audio_analysis.assembyai import SpeakerManager
from database import DatabaseManager, AnalyzerType
from sentiment_analysis.sa_transformers import analyze_sentiment, reset_analyzer
from rich.console import Console

console = Console()

def test_session_speakers():
    """Test session-based speaker management."""
    console.print("[bold green]🧪 Testing Session-Based Speaker Management[/bold green]\n")
    
    db = DatabaseManager()
    
    # Test Session 1
    console.print("[bold blue]Session 1:[/bold blue]")
    sm1 = SpeakerManager(db, "TEST_SESSION_1")
    speaker1_a = sm1.get_speaker_name("A")
    speaker1_b = sm1.get_speaker_name("B")
    console.print(f"Session 1 - Speaker A: {speaker1_a}")
    console.print(f"Session 1 - Speaker B: {speaker1_b}")
    sm1.close()
    
    # Test Session 2
    console.print(f"\n[bold blue]Session 2:[/bold blue]")
    sm2 = SpeakerManager(db, "TEST_SESSION_2")
    speaker2_a = sm2.get_speaker_name("A")
    speaker2_b = sm2.get_speaker_name("B")
    console.print(f"Session 2 - Speaker A: {speaker2_a}")
    console.print(f"Session 2 - Speaker B: {speaker2_b}")
    sm2.close()
    
    # Verify uniqueness
    if speaker1_a != speaker2_a and speaker1_b != speaker2_b:
        console.print(f"[green]✅ SUCCESS: Speakers are unique across sessions[/green]")
    else:
        console.print(f"[red]❌ FAILED: Speakers are not unique across sessions[/red]")
    
    db.close()

def test_database_storage():
    """Test database storage with session-based speakers."""
    console.print(f"\n[bold green]🧪 Testing Database Storage[/bold green]\n")
    
    db = DatabaseManager()
    sm = SpeakerManager(db, "TEST_DB_SESSION")
    
    # Create test speakers
    speaker_name = sm.get_speaker_name("TEST_SPEAKER")
    session_speaker_id = f"{sm.session_id}_TEST_SPEAKER"
    
    # Add transcription
    transcription = db.add_transcription(session_speaker_id, "This is a test transcription for database storage.")
    console.print(f"[green]✓[/green] Added transcription: ID {transcription.id}")
    
    # Test sentiment analysis and storage
    reset_analyzer()
    result = analyze_sentiment("My father's death taught me to cherish every moment.", verbose=False)
    
    # Store analysis
    analysis = db.add_sentiment_analysis(
        transcription_id=transcription.id,
        analyzer_type=AnalyzerType.TRANSFORMER,
        label=result['label'],
        category=result['category'],
        score=result['score'],
        confidence=result['confidence'],
        explanation=result.get('explanation')
    )
    console.print(f"[green]✓[/green] Stored sentiment analysis: ID {analysis.id}")
    
    # Verify retrieval
    retrieved_transcription = db.get_transcription_with_analyses(transcription.id)
    if retrieved_transcription and len(retrieved_transcription.sentiment_analyses) > 0:
        console.print(f"[green]✅ SUCCESS: Data stored and retrieved correctly[/green]")
        console.print(f"Retrieved category: {retrieved_transcription.sentiment_analyses[0].category}")
    else:
        console.print(f"[red]❌ FAILED: Could not retrieve stored data[/red]")
    
    sm.close()
    db.close()

def test_enhanced_cli_output():
    """Test the enhanced CLI output with detailed explanations."""
    console.print(f"\n[bold green]🧪 Testing Enhanced CLI Output[/bold green]\n")
    
    reset_analyzer()
    
    test_cases = [
        "My father's death taught me to cherish every moment with the people I love.",
        "Moving to a new city feels like both an adventure and a terrible mistake.",
        "I find myself questioning the values I grew up with and what I really believe now."
    ]
    
    for i, text in enumerate(test_cases, 1):
        console.print(f"[bold cyan]Test Case {i}:[/bold cyan] {text}")
        result = analyze_sentiment(text, verbose=True)
        console.print("\n" + "="*80 + "\n")

def test_database_session_separation():
    """Test that different sessions create separate database entries."""
    console.print(f"\n[bold green]🧪 Testing Database Session Separation[/bold green]\n")
    
    db = DatabaseManager()
    
    # Count initial speakers
    initial_speakers = len(db.get_all_speakers())
    console.print(f"Initial speakers in database: {initial_speakers}")
    
    # Create speakers in different sessions
    sm1 = SpeakerManager(db, "SEPARATION_TEST_1")
    sm1.get_speaker_name("A")
    sm1.get_speaker_name("B")
    sm1.close()
    
    sm2 = SpeakerManager(db, "SEPARATION_TEST_2")
    sm2.get_speaker_name("A")
    sm2.get_speaker_name("B")
    sm2.close()
    
    # Count final speakers
    final_speakers = len(db.get_all_speakers())
    console.print(f"Final speakers in database: {final_speakers}")
    
    if final_speakers == initial_speakers + 4:  # Should have added 4 new speakers
        console.print(f"[green]✅ SUCCESS: Session separation working correctly[/green]")
    else:
        console.print(f"[red]❌ FAILED: Expected {initial_speakers + 4} speakers, got {final_speakers}[/red]")
    
    db.close()

if __name__ == "__main__":
    console.print("[bold magenta]🚀 COMPREHENSIVE SYSTEM TEST[/bold magenta]")
    console.print("="*60)
    
    test_session_speakers()
    test_database_storage()
    test_enhanced_cli_output()
    test_database_session_separation()
    
    console.print(f"\n[bold magenta]🎉 ALL TESTS COMPLETED[/bold magenta]") 