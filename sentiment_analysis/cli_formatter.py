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
		'ambivalent': 'blue',
		'reflective_neutral': 'cyan',
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
		
	# Enhanced category panel with emoji
	category_emoji = {
		'hope': '🌅',
		'sorrow': '😢', 
		'transformative': '🔄',
		'ambivalent': '⚖️',
		'reflective_neutral': '🤔'
	}
	emoji = category_emoji.get(category.lower(), '❓')
	
	main_panel = Panel(
		f"[{category_color}]{emoji} {category.upper()}[/{category_color}]",
		title="📊 EMOTION CLASSIFICATION",
		border_style=category_color,
		padding=(0, 2)
	)
	console.print(main_panel)
	
	# Enhanced metrics table with more details
	metrics_table = Table(show_header=True, header_style="bold magenta", box=box.ROUNDED)
	metrics_table.add_column("📈 Metric", style="cyan", width=25)
	metrics_table.add_column("🎯 Value", style="green", width=15)
	metrics_table.add_column("📝 Description", style="yellow")
		
	# Add comprehensive metrics
	metrics = [
		("Overall Confidence", f"{result.get('confidence', 0):.1%}", "Model's confidence in this classification"),
		("Classification Confidence", f"{result.get('classification_confidence', 0):.1%}", "Advanced classifier confidence"),
		("Sentiment Score", f"{result.get('score', 0):.3f}", "Base emotion score (-1=negative, +1=positive)"),
		("Emotion Intensity", f"{result.get('intensity', 0):.3f}", "Strength of the emotional expression"),
		("Label", result.get('label', 'unknown'), "Traditional sentiment label"),
	]
	
	for metric, value, description in metrics:
		metrics_table.add_row(metric, value, description)
		
	console.print("\n📊 Detailed Analysis Metrics:")
	console.print(metrics_table)
		
	# Enhanced matched patterns table
	if 'matched_patterns' in result and result['matched_patterns']:
		patterns_table = Table(show_header=True, header_style="bold blue", box=box.ROUNDED)
		patterns_table.add_column("🔍 Pattern Type", style="cyan", width=30)
		patterns_table.add_column("⚖️ Weight", style="green", width=10)
		patterns_table.add_column("📂 Category", style="yellow", width=15)
		patterns_table.add_column("💡 Impact", style="magenta")
		
		# Sort patterns by weight (highest first)
		sorted_patterns = sorted(result['matched_patterns'], key=lambda x: x.get('weight', 0), reverse=True)
		
		for pattern in sorted_patterns[:5]:  # Show top 5 patterns
			# Handle both pattern formats (description or pattern field)
			pattern_type = pattern.get('description', pattern.get('pattern', 'Unknown'))
			weight = pattern.get('weight', 0)
			category_pat = pattern.get('category', 'unknown')
			
			# Determine impact level
			if weight > 0.8:
				impact = "🔥 Very High"
			elif weight > 0.6:
				impact = "🌟 High"
			elif weight > 0.4:
				impact = "📈 Medium"
			else:
				impact = "📉 Low"
			
			patterns_table.add_row(
				pattern_type,
				f"{weight:.3f}",
				category_pat,
				impact
			)
		
		console.print("\n🔍 Linguistic Pattern Analysis:")
		console.print(patterns_table)
		
	# Enhanced explanation panel with structured breakdown
	if 'explanation' in result:
		explanation_text = result['explanation']
		
		# Split explanation by delimiter if it uses the new format
		if " | " in explanation_text:
			parts = explanation_text.split(" | ")
			structured_explanation = "\n".join([f"• {part}" for part in parts])
		else:
			structured_explanation = explanation_text
		
		explanation_panel = Panel(
			structured_explanation,
			title="🧠 Classification Reasoning",
			border_style="yellow",
			padding=(1, 2)
		)
		console.print("\n")
		console.print(explanation_panel)
	
	# Add interpretation guide
	interpretation_text = _get_category_interpretation(category)
	if interpretation_text:
		interpretation_panel = Panel(
			interpretation_text,
			title="📖 Category Interpretation",
			border_style="blue",
			padding=(1, 2)
		)
		console.print("\n")
		console.print(interpretation_panel)

def _get_category_interpretation(category: str) -> str:
	"""Get interpretation guide for the emotion category."""
	interpretations = {
		'hope': "🌅 HOPE represents future-oriented positivity, aspirations, dreams, and possibilities. The speaker expresses optimism about what's to come.",
		'sorrow': "😢 SORROW indicates grief, loss, regret, or pain focused on past or present experiences. The speaker is processing difficult emotions.",
		'transformative': "🔄 TRANSFORMATIVE shows movement from pain to growth, learning from adversity, or personal evolution. The speaker has gained insight from difficult experiences.",
		'ambivalent': "⚖️ AMBIVALENT reveals mixed emotions, internal conflict, or uncertainty. The speaker experiences contradictory feelings simultaneously.",
		'reflective_neutral': "🤔 REFLECTIVE_NEUTRAL demonstrates thoughtful contemplation, philosophical musings, or introspection without strong emotional charge."
	}
	return interpretations.get(category.lower(), "")

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