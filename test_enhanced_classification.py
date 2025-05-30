#!/usr/bin/env python3
"""
Test script for enhanced emotion classification.
Tests the specific examples provided by the user to ensure correct classification.
"""

import sys
import os
sys.path.append('.')

from sentiment_analysis.sa_transformers import analyze_sentiment as analyze_transformer, reset_analyzer
from rich.console import Console

console = Console()

def test_specific_examples():
    """Test the specific examples provided by the user."""
    console.print("[bold green]🧪 Testing Enhanced Emotion Classification[/bold green]\n")
    
    # Reset analyzer to ensure fresh state
    reset_analyzer()
    
    test_cases = [
        {
            "text": "My father's death taught me to cherish every moment with the people I love.",
            "expected": "TRANSFORMATIVE",
            "reason": "Learning from loss/pain - death taught me"
        },
        {
            "text": "Moving to a new city feels like both an adventure and a terrible mistake.",
            "expected": "AMBIVALENT", 
            "reason": "Clear 'both...and' construction with opposing emotions"
        },
        {
            "text": "I find myself questioning the values I grew up with and what I really believe now.",
            "expected": "REFLECTIVE_NEUTRAL",
            "reason": "Philosophical questioning without strong emotional charge"
        },
        {
            "text": "Watching my childhood home get demolished broke something inside me.",
            "expected": "SORROW",
            "reason": "Grief and loss focused on present pain"
        },
        {
            "text": "I dream of opening my own art studio where I can teach children to express themselves.",
            "expected": "HOPE",
            "reason": "Future-oriented aspiration and dreams"
        },
        {
            "text": "Losing my job was devastating, but it forced me to discover my true passion for cooking.",
            "expected": "TRANSFORMATIVE",
            "reason": "Growth through adversity - devastating but discovery"
        },
        {
            "text": "I'm excited about the promotion, but terrified about leaving my comfort zone.",
            "expected": "AMBIVALENT",
            "reason": "Simultaneous opposing emotions - excited but terrified"
        }
    ]
    
    correct_classifications = 0
    total_tests = len(test_cases)
    
    for i, test_case in enumerate(test_cases, 1):
        text = test_case["text"]
        expected = test_case["expected"]
        reason = test_case["reason"]
        
        console.print(f"[bold cyan]Test {i}: {expected}[/bold cyan]")
        console.print(f"[yellow]Text:[/yellow] {text}")
        console.print(f"[blue]Expected:[/blue] {expected} ({reason})")
        
        try:
            result = analyze_transformer(text, verbose=True)
            actual = result['category'].upper()
            
            if actual == expected:
                console.print(f"[bold green]✅ CORRECT: {actual}[/bold green]")
                correct_classifications += 1
            else:
                console.print(f"[bold red]❌ INCORRECT: Got {actual}, expected {expected}[/bold red]")
            
        except Exception as e:
            console.print(f"[red]Error:[/red] {str(e)}")
        
        console.print("=" * 80)
        console.print()
    
    # Summary
    accuracy = (correct_classifications / total_tests) * 100
    console.print(f"[bold]📊 RESULTS SUMMARY[/bold]")
    console.print(f"Correct: {correct_classifications}/{total_tests}")
    console.print(f"Accuracy: {accuracy:.1f}%")
    
    if accuracy >= 85:
        console.print(f"[bold green]🎉 EXCELLENT! Classification accuracy is {accuracy:.1f}%[/bold green]")
    elif accuracy >= 70:
        console.print(f"[bold yellow]⚠️ GOOD but needs improvement. Accuracy is {accuracy:.1f}%[/bold yellow]")
    else:
        console.print(f"[bold red]❌ POOR. Classification needs significant improvement. Accuracy is {accuracy:.1f}%[/bold red]")

if __name__ == "__main__":
    test_specific_examples() 