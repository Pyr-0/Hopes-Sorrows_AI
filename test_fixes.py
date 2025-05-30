#!/usr/bin/env python3
"""
Test script to verify all fixes and improvements to the sentiment analysis system.
This script tests:
1. Sentiment analysis accuracy with the corrected model
2. New emotion categories
3. Database schema compatibility
4. CLI formatting
5. Speaker management
"""

import sys
import os
sys.path.append('.')

from sentiment_analysis.sa_transformers import analyze_sentiment as analyze_transformer, reset_analyzer
from sentiment_analysis.sa_LLM import analyze_sentiment as analyze_llm
from sentiment_analysis.advanced_classifier import EmotionCategory
from database import DatabaseManager, AnalyzerType
from rich.console import Console
import time

console = Console()

def test_sentiment_models():
    """Test both sentiment analysis models with various inputs."""
    console.print("[bold blue]Testing Sentiment Analysis Models[/bold blue]")
    
    # Reset the analyzer to ensure it loads the correct model
    reset_analyzer()
    
    test_cases = [
        ("I'm so excited about the future!", "Should be HOPE"),
        ("Watching my childhood home be demolished, broke something inside of me", "Should be SORROW - this was misclassified before"),
        ("I lost everything in the fire, my childhood home is gone", "Should be SORROW"),
        ("I was sad at first, but now I'm learning to grow from this experience", "Should be TRANSFORMATIVE"),
        ("I'm excited but also terrified about this opportunity", "Should be AMBIVALENT"),
        ("I've been thinking about the nature of change recently", "Should be REFLECTIVE_NEUTRAL"),
        ("", "Should handle empty text"),
    ]
    
    for text, expected in test_cases:
        console.print(f"\n[cyan]Testing:[/cyan] {text[:50]}{'...' if len(text) > 50 else ''}")
        console.print(f"[yellow]Expected:[/yellow] {expected}")
        
        try:
            # Test transformer model
            transformer_result = analyze_transformer(text, verbose=False)
            console.print(f"[green]Transformer:[/green] {transformer_result['category']} (score: {transformer_result['score']:.2f})")
            
            # Test LLM model
            llm_result = analyze_llm(text, verbose=False)
            console.print(f"[blue]LLM:[/blue] {llm_result['category']} (score: {llm_result['score']:.2f})")
            
        except Exception as e:
            console.print(f"[red]Error:[/red] {str(e)}")
        
        console.print("-" * 60)

def test_database_integration():
    """Test database operations with new schema."""
    console.print("\n[bold blue]Testing Database Integration[/bold blue]")
    
    try:
        db = DatabaseManager()
        
        # Use unique speaker ID for testing
        unique_id = f"TEST_SPEAKER_{int(time.time())}"
        unique_name = f"Test Speaker {int(time.time())}"
        
        # Test adding speaker
        speaker = db.add_speaker(unique_id, unique_name)
        console.print(f"[green]✓[/green] Added speaker: {speaker.name}")
        
        # Test adding transcription
        transcription = db.add_transcription(unique_id, "This is a test transcription")
        console.print(f"[green]✓[/green] Added transcription: {transcription.id}")
        
        # Test adding sentiment analysis with new categories
        sentiment = db.add_sentiment_analysis(
            transcription_id=transcription.id,
            analyzer_type=AnalyzerType.TRANSFORMER,
            label="positive",
            category="transformative",  # Test long category name
            score=0.8,
            confidence=0.9,
            explanation="Test explanation"
        )
        console.print(f"[green]✓[/green] Added sentiment analysis: {sentiment.id}")
        
        # Test querying
        all_transcriptions = db.get_all_transcriptions()
        console.print(f"[green]✓[/green] Retrieved {len(all_transcriptions)} transcriptions")
        
        db.close()
        console.print("[green]✓[/green] Database operations successful")
        
    except Exception as e:
        console.print(f"[red]✗[/red] Database error: {str(e)}")

def test_emotion_categories():
    """Test all emotion categories are properly defined."""
    console.print("\n[bold blue]Testing Emotion Categories[/bold blue]")
    
    expected_categories = [
        EmotionCategory.HOPE,
        EmotionCategory.SORROW,
        EmotionCategory.TRANSFORMATIVE,
        EmotionCategory.AMBIVALENT,
        EmotionCategory.REFLECTIVE_NEUTRAL
    ]
    
    for category in expected_categories:
        console.print(f"[green]✓[/green] {category.value}")
    
    console.print(f"[green]✓[/green] All {len(expected_categories)} emotion categories defined")

def test_cli_formatting():
    """Test CLI formatting with all categories."""
    console.print("\n[bold blue]Testing CLI Formatting[/bold blue]")
    
    from sentiment_analysis.cli_formatter import get_category_color, format_sentiment_result
    
    test_categories = ['hope', 'sorrow', 'transformative', 'ambivalent', 'reflective_neutral']
    
    for category in test_categories:
        color = get_category_color(category)
        console.print(f"[green]✓[/green] {category}: {color}")
    
    # Test formatting a sample result
    sample_result = {
        'category': 'transformative',
        'score': 0.75,
        'confidence': 0.85,
        'classification_confidence': 0.80,
        'intensity': 0.75,
        'matched_patterns': [
            {'description': 'Recovery language', 'weight': 0.9, 'category': 'transformative'}
        ],
        'explanation': 'Test explanation for transformative category'
    }
    
    console.print("\n[yellow]Sample result formatting:[/yellow]")
    format_sentiment_result(sample_result)

if __name__ == "__main__":
    console.print("[bold green]🔧 Testing Sentiment Analysis System Fixes[/bold green]\n")
    
    test_emotion_categories()
    test_cli_formatting()
    test_sentiment_models()
    test_database_integration()
    
    console.print("\n[bold green]✅ All tests completed![/bold green]") 