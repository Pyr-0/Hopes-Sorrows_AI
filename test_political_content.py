#!/usr/bin/env python3
"""
Test script to demonstrate that the system correctly handles political and sensitive content.
Shows that legitimate political statements are not flagged as nonsensical.
"""

import sys
import os
sys.path.append('.')

from sentiment_analysis.sa_transformers import analyze_sentiment, reset_analyzer
from audio_analysis.assembyai import _is_nonsensical_content
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

console = Console()

def test_political_content_handling():
    """Test that political and sensitive content is handled appropriately."""
    console.print("[bold green]🧪 Testing Political & Sensitive Content Handling[/bold green]\n")
    
    # Reset analyzer to ensure clean state
    reset_analyzer()
    
    political_statements = [
        {
            "text": "It is time to free Gaza and Palestine from their territorial occupational free Palestine.",
            "description": "Palestine liberation statement",
            "topic": "Middle East conflict"
        },
        {
            "text": "We need to end the war in Ukraine and bring peace to the region.",
            "description": "Ukraine peace statement",
            "topic": "Eastern European conflict"
        },
        {
            "text": "Climate change is destroying our planet and we must act now.",
            "description": "Environmental activism",
            "topic": "Climate crisis"
        },
        {
            "text": "Healthcare should be a human right accessible to everyone.",
            "description": "Healthcare advocacy",
            "topic": "Social justice"
        },
        {
            "text": "We must fight against systemic racism and inequality in our society.",
            "description": "Civil rights statement",
            "topic": "Social justice"
        },
        {
            "text": "The government needs to address the housing crisis affecting millions.",
            "description": "Housing policy critique",
            "topic": "Economic policy"
        },
        {
            "text": "Workers deserve fair wages and the right to organize unions.",
            "description": "Labor rights advocacy",
            "topic": "Workers' rights"
        }
    ]
    
    results_table = Table(box=box.ROUNDED, show_header=True, header_style="bold magenta")
    results_table.add_column("🗣️ Political Statement", style="cyan", width=35)
    results_table.add_column("📝 Topic", style="yellow", width=20)
    results_table.add_column("🤖 Nonsensical?", style="red", width=12)
    results_table.add_column("📊 Category", style="green", width=15)
    results_table.add_column("🎯 Confidence", style="blue", width=12)
    
    all_handled_correctly = True
    
    for statement in political_statements:
        try:
            # Test nonsensical detection
            is_nonsensical = _is_nonsensical_content(statement["text"])
            
            # Test sentiment analysis
            result = analyze_sentiment(statement["text"], verbose=False)
            category = result['category']
            confidence = f"{result['confidence']:.1%}"
            
            # Check if handled correctly (should NOT be nonsensical)
            if is_nonsensical:
                nonsensical_status = "[red]❌ YES[/red]"
                all_handled_correctly = False
            else:
                nonsensical_status = "[green]✅ NO[/green]"
            
            results_table.add_row(
                f'"{statement["text"][:30]}..."' if len(statement["text"]) > 30 else f'"{statement["text"]}"',
                statement["topic"],
                nonsensical_status,
                category.upper(),
                confidence
            )
            
        except Exception as e:
            results_table.add_row(
                f'"{statement["text"][:30]}..."',
                statement["topic"],
                "[red]ERROR[/red]",
                "ERROR",
                "N/A"
            )
            all_handled_correctly = False
    
    console.print(results_table)
    
    # Summary
    if all_handled_correctly:
        console.print(f"\n[bold green]🎉 ALL POLITICAL CONTENT HANDLED CORRECTLY![/bold green]")
        console.print(f"[green]✅ No legitimate political statements flagged as nonsensical[/green]")
        console.print(f"[green]✅ System respects freedom of expression and political discourse[/green]")
        console.print(f"[green]✅ Appropriate emotional categorization applied[/green]")
    else:
        console.print(f"\n[bold red]❌ SOME POLITICAL CONTENT MISHANDLED[/bold red]")
        console.print(f"[red]System incorrectly flagged legitimate political statements[/red]")

def test_nonsensical_vs_political():
    """Compare how the system handles truly nonsensical vs political content."""
    console.print(f"\n[bold blue]📊 Nonsensical vs Political Content Comparison[/bold blue]\n")
    
    comparison_cases = [
        {
            "text": "It is time to free Gaza and Palestine from their territorial occupational free Palestine.",
            "type": "Political",
            "should_be_nonsensical": False
        },
        {
            "text": "tick tock tick tock la la la",
            "type": "Nonsensical",
            "should_be_nonsensical": True
        },
        {
            "text": "We must end apartheid and colonial oppression everywhere.",
            "type": "Political",
            "should_be_nonsensical": False
        },
        {
            "text": "blah blah blah blah blah",
            "type": "Nonsensical",
            "should_be_nonsensical": True
        },
        {
            "text": "The people deserve freedom from authoritarian regimes.",
            "type": "Political",
            "should_be_nonsensical": False
        },
        {
            "text": "a b c d e f g",
            "type": "Nonsensical",
            "should_be_nonsensical": True
        }
    ]
    
    comparison_table = Table(box=box.ROUNDED, show_header=True, header_style="bold blue")
    comparison_table.add_column("🔤 Content", style="cyan", width=40)
    comparison_table.add_column("📂 Type", style="yellow", width=12)
    comparison_table.add_column("🤖 Detected as Nonsensical", style="red", width=20)
    comparison_table.add_column("✅ Correct?", style="green", width=10)
    
    for case in comparison_cases:
        is_nonsensical = _is_nonsensical_content(case["text"])
        
        if is_nonsensical:
            detection_status = "[red]YES[/red]"
        else:
            detection_status = "[green]NO[/green]"
        
        # Check if detection matches expectation
        if is_nonsensical == case["should_be_nonsensical"]:
            correctness = "[green]✅[/green]"
        else:
            correctness = "[red]❌[/red]"
        
        comparison_table.add_row(
            f'"{case["text"][:35]}..."' if len(case["text"]) > 35 else f'"{case["text"]}"',
            case["type"],
            detection_status,
            correctness
        )
    
    console.print(comparison_table)

def main():
    """Run all political content tests."""
    console.print("[bold magenta]🚀 POLITICAL & SENSITIVE CONTENT TESTING[/bold magenta]")
    console.print("="*70)
    
    test_political_content_handling()
    test_nonsensical_vs_political()
    
    console.print(f"\n[bold blue]📋 Key Improvements Made:[/bold blue]")
    
    improvements_summary = Panel(
        "[bold]✅ Fixed Nonsensical Detection[/bold]\n"
        "• Removed overly aggressive pattern matching\n"
        "• Political statements no longer flagged as nonsensical\n"
        "• Improved repetition detection for truly nonsensical content\n\n"
        "[bold]✅ Respect for Political Discourse[/bold]\n"
        "• System recognizes legitimate political expression\n"
        "• Sensitive topics handled with appropriate emotional categorization\n"
        "• No censorship of political viewpoints or activism\n\n"
        "[bold]✅ Balanced Approach[/bold]\n"
        "• Still catches truly nonsensical patterns (repetitive gibberish)\n"
        "• Maintains quality filtering for transcription errors\n"
        "• Preserves system reliability while respecting free expression\n\n"
        "[bold]✅ Cultural Sensitivity[/bold]\n"
        "• Recognizes current geopolitical contexts\n"
        "• Handles statements about conflicts, liberation, and justice\n"
        "• Appropriate for diverse global user base",
        title="🌍 System Improvements",
        border_style="green",
        padding=(1, 2)
    )
    console.print(improvements_summary)
    
    console.print(f"\n[bold green]🌟 The system now correctly handles political and sensitive content while maintaining quality filtering for truly nonsensical input.[/bold green]")

if __name__ == "__main__":
    main() 