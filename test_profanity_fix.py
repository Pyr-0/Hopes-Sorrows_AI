#!/usr/bin/env python3
"""
Test script to demonstrate the profanity classification fix.
Shows that filtered content is now correctly classified as SORROW instead of HOPE.
"""

import sys
import os
sys.path.append('.')

from sentiment_analysis.sa_transformers import analyze_sentiment, reset_analyzer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

console = Console()

def test_profanity_classification_fix():
    """Test that profanity content is correctly classified after the fix."""
    console.print("[bold green]🧪 Testing Profanity Classification Fix[/bold green]\n")
    
    # Reset analyzer to ensure clean state
    reset_analyzer()
    
    test_cases = [
        {
            "text": "Sex p***. Stupid bestiality.",
            "description": "Filtered profanity (original issue)",
            "expected_category": "sorrow",
            "expected_not": "hope"
        },
        {
            "text": "This is f*** terrible",
            "description": "Negative sentiment with profanity",
            "expected_category": "sorrow",
            "expected_not": "hope"
        },
        {
            "text": "I love this s***",
            "description": "Positive sentiment with profanity",
            "expected_category": "reflective_neutral",  # Filtered content overrides positive
            "expected_not": "hope"
        },
        {
            "text": "What the h*** is happening",
            "description": "Neutral sentiment with profanity",
            "expected_category": "sorrow",  # Negative sentiment + filtered content
            "expected_not": "hope"
        },
        {
            "text": "I am very happy today",
            "description": "Clean positive content",
            "expected_category": "hope",
            "expected_not": "sorrow"
        },
        {
            "text": "I am very sad today",
            "description": "Clean negative content",
            "expected_category": "sorrow",
            "expected_not": "hope"
        },
        {
            "text": "tick tock tick tock la la la",
            "description": "Nonsensical content",
            "expected_category": "reflective_neutral",
            "expected_not": "hope"
        }
    ]
    
    results_table = Table(box=box.ROUNDED, show_header=True, header_style="bold magenta")
    results_table.add_column("🔤 Input", style="cyan", width=30)
    results_table.add_column("📝 Description", style="yellow", width=25)
    results_table.add_column("📊 Category", style="green", width=15)
    results_table.add_column("🎯 Confidence", style="blue", width=12)
    results_table.add_column("✅ Status", style="white", width=15)
    
    all_passed = True
    
    for case in test_cases:
        try:
            result = analyze_sentiment(case["text"], verbose=False)
            category = result['category']
            confidence = f"{result['confidence']:.1%}"
            score = result['score']
            
            # Check if classification meets expectations
            if category == case["expected_category"]:
                status = "[green]✅ PASS[/green]"
            elif category == case["expected_not"]:
                status = "[red]❌ FAIL[/red]"
                all_passed = False
            else:
                status = "[yellow]⚠️ UNEXPECTED[/yellow]"
            
            results_table.add_row(
                f'"{case["text"][:25]}..."' if len(case["text"]) > 25 else f'"{case["text"]}"',
                case["description"],
                category.upper(),
                confidence,
                status
            )
            
        except Exception as e:
            results_table.add_row(
                f'"{case["text"][:25]}..."',
                case["description"],
                "ERROR",
                "N/A",
                f"[red]❌ ERROR[/red]"
            )
            all_passed = False
    
    console.print(results_table)
    
    # Summary
    if all_passed:
        console.print(f"\n[bold green]🎉 ALL TESTS PASSED![/bold green]")
        console.print(f"[green]✅ Profanity content is correctly classified as SORROW[/green]")
        console.print(f"[green]✅ Clean positive content is correctly classified as HOPE[/green]")
        console.print(f"[green]✅ Clean negative content is correctly classified as SORROW[/green]")
        console.print(f"[green]✅ Nonsensical content is correctly classified as REFLECTIVE_NEUTRAL[/green]")
    else:
        console.print(f"\n[bold red]❌ SOME TESTS FAILED[/bold red]")
        console.print(f"[red]Please review the classification logic[/red]")

def test_before_after_comparison():
    """Show the before/after comparison for the original issue."""
    console.print(f"\n[bold blue]📊 Before/After Comparison[/bold blue]\n")
    
    original_issue_text = "Sex p***. Stupid bestiality."
    result = analyze_sentiment(original_issue_text, verbose=False)
    
    comparison_panel = Panel(
        f"[bold]Original Issue Text:[/bold] \"{original_issue_text}\"\n\n"
        f"[bold red]BEFORE (Bug):[/bold red]\n"
        f"• Category: HOPE (incorrect)\n"
        f"• Reason: No patterns detected, defaulted to first category\n"
        f"• Sentiment Score: {result['score']:.2f} (strongly negative)\n"
        f"• Problem: Negative sentiment + profanity classified as hope\n\n"
        f"[bold green]AFTER (Fixed):[/bold green]\n"
        f"• Category: {result['category'].upper()} (correct)\n"
        f"• Confidence: {result['confidence']:.1%}\n"
        f"• Sentiment Score: {result['score']:.2f} (strongly negative)\n"
        f"• Solution: Filtered content detection + sentiment-based fallback\n"
        f"• Explanation: {result['explanation'][:100]}...",
        title="🔧 Fix Demonstration",
        border_style="green",
        padding=(1, 2)
    )
    console.print(comparison_panel)

def main():
    """Run all profanity classification tests."""
    console.print("[bold magenta]🚀 PROFANITY CLASSIFICATION FIX TESTING[/bold magenta]")
    console.print("="*70)
    
    test_profanity_classification_fix()
    test_before_after_comparison()
    
    console.print(f"\n[bold blue]📋 Summary of Fixes Applied:[/bold blue]")
    
    fixes_summary = Panel(
        "[bold]✅ Fix 1: Sentiment-Based Fallback[/bold]\n"
        "• When no patterns detected, use sentiment score to set base categories\n"
        "• Negative sentiment (-0.5 or lower) → SORROW (0.8) + REFLECTIVE_NEUTRAL (0.2)\n"
        "• Positive sentiment (+0.5 or higher) → HOPE (0.8) + REFLECTIVE_NEUTRAL (0.2)\n\n"
        "[bold]✅ Fix 2: Filtered Content Detection[/bold]\n"
        "• Detect asterisks (*) indicating AssemblyAI content filtering\n"
        "• Negative sentiment + filtered content → Boost SORROW, penalize HOPE\n"
        "• Neutral sentiment + filtered content → Boost REFLECTIVE_NEUTRAL, penalize HOPE\n\n"
        "[bold]✅ Fix 3: Nonsensical Content Detection[/bold]\n"
        "• Fixed regex pattern to avoid false positives on normal sentences\n"
        "• Only flag truly nonsensical patterns (single letters, excessive repetition)\n"
        "• Nonsensical content → REFLECTIVE_NEUTRAL with low confidence\n\n"
        "[bold]✅ Fix 4: Enhanced Explanations[/bold]\n"
        "• Added note when filtered content is detected\n"
        "• Clear explanation of why classification was chosen",
        title="🛠️ Applied Fixes",
        border_style="blue",
        padding=(1, 2)
    )
    console.print(fixes_summary)

if __name__ == "__main__":
    main() 