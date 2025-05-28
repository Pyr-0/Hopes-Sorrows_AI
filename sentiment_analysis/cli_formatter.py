from typing import Dict, List
from datetime import datetime
import json
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich import box

console = Console()

def get_category_color(category: str) -> str:
    """
    Get the color code for a given sentiment category.
    
    Args:
        category: The sentiment category (e.g., 'hope', 'sorrow', 'transformative')
    
    Returns:
        str: Color code for the category
    """
    category_colors = {
        'hope': 'green',
        'sorrow': 'red',
        'transformative': 'yellow',
        'ambiguous': 'blue',
        'neutral': 'white'
    }
    return category_colors.get(category.lower(), 'white')

def format_sentiment_result(result: Dict) -> None:
    """
    Format and display sentiment analysis results in a clear, organized way.
    
    Args:
        result: Dictionary containing sentiment analysis results
    """
    # Main result panel
    category = result.get('category', 'UNKNOWN')
    category_color = get_category_color(category)
    
    main_panel = Panel(
        f"[{category_color}]{category}[/{category_color}]",
        title="Sentiment Analysis Result",
        border_style=category_color
    )
    console.print(main_panel)
    
    # Confidence metrics table
    metrics = [
        ("Overall Confidence", f"{result.get('confidence', 0):.2%}"),
        ("Classification Confidence", f"{result.get('classification_confidence', 0):.2%}"),
        ("Sentiment Score", f"{result.get('score', 0):.2f}"),
        ("Intensity", f"{result.get('intensity', 0):.2f}")
    ]
    
    metrics_table = Table(show_header=True, header_style="bold magenta")
    metrics_table.add_column("Metric")
    metrics_table.add_column("Value")
    
    for metric, value in metrics:
        metrics_table.add_row(metric, value)
    
    console.print(metrics_table)
    
    # Matched patterns table
    if 'matched_patterns' in result and result['matched_patterns']:
        patterns_table = Table(show_header=True, header_style="bold blue")
        patterns_table.add_column("Pattern Type")
        patterns_table.add_column("Weight")
        patterns_table.add_column("Category")
        
        for pattern in result['matched_patterns']:
            # Handle both pattern formats (description or pattern field)
            pattern_type = pattern.get('description', pattern.get('pattern', 'Unknown'))
            patterns_table.add_row(
                pattern_type,
                f"{pattern.get('weight', 0):.2f}",
                pattern.get('category', 'unknown')
            )
        
        console.print("\nMatched Linguistic Patterns:")
        console.print(patterns_table)
    
    # Explanation panel
    if 'explanation' in result:
        explanation_panel = Panel(
            result['explanation'],
            title="Analysis Explanation",
            border_style="yellow"
        )
        console.print("\n")
        console.print(explanation_panel)

def format_batch_results(results: List[Dict], speaker_id: str = None) -> None:
    """
    Format and display multiple sentiment analysis results in a batch.
    
    Args:
        results: List of dictionaries containing sentiment analysis results
        speaker_id: Optional speaker identifier
    """
    if speaker_id:
        console.print(f"\n[bold cyan]Analysis Results for Speaker: {speaker_id}[/bold cyan]")
    
    for i, result in enumerate(results, 1):
        console.print(f"\n[bold]Result {i}[/bold]")
        format_sentiment_result(result)
        console.print("\n" + "="*80)

def format_narrative_arc(results: List[Dict]) -> None:
    """
    Format and display the narrative arc of a conversation.
    
    Args:
        results: List of dictionaries containing sentiment analysis results in chronological order
    """
    arc_table = Table(box=box.ROUNDED, show_header=True, header_style="bold magenta")
    arc_table.add_column("Sequence", style="cyan")
    arc_table.add_column("Category", style="green")
    arc_table.add_column("Confidence", style="yellow")
    arc_table.add_column("Key Indicators", style="blue")
    
    for i, result in enumerate(results, 1):
        # Extract key indicators from explanation
        indicators = result['explanation'].split("Key indicators: ")[-1] if "Key indicators: " in result['explanation'] else "N/A"
        
        arc_table.add_row(
            str(i),
            result['category'].upper(),
            f"{result['confidence']:.2%}",
            indicators
        )
    
    console.print("\n[bold cyan]Narrative Arc Analysis[/bold cyan]")
    console.print(arc_table)

def format_speaker_profile(profile: Dict) -> None:
    """
    Format and display speaker profile information.
    
    Args:
        profile: Dictionary containing speaker profile data
    """
    profile_table = Table(box=box.ROUNDED, show_header=True, header_style="bold magenta")
    profile_table.add_column("Emotion Category", style="cyan")
    profile_table.add_column("Calibration Factor", style="green")
    
    for category, factor in profile.items():
        profile_table.add_row(
            category.upper(),
            f"{factor:.2f}"
        )
    
    console.print("\n[bold cyan]Speaker Profile[/bold cyan]")
    console.print(profile_table)

def format_error(error_message: str) -> None:
    """
    Format and display error messages.
    
    Args:
        error_message: Error message to display
    """
    error_panel = Panel(
        Text(error_message, style="bold red"),
        title="Error",
        border_style="red"
    )
    console.print(error_panel)

# Example usage:
if __name__ == "__main__":
    # Example result
    example_result = {
        "category": "hope",
        "confidence": 0.85,
        "classification_confidence": 0.92,
        "score": 0.75,
        "intensity": 0.75,
        "matched_patterns": [
            {
                "pattern": "Future-oriented language",
                "weight": 0.8,
                "category": "hope"
            },
            {
                "pattern": "Growth language",
                "weight": 0.7,
                "category": "hope"
            }
        ],
        "explanation": "Classified as hope with 0.92 confidence. Key indicators: Detected Future-oriented language (0.80 weight); Detected Growth language (0.70 weight)"
    }
    
    format_sentiment_result(example_result) 