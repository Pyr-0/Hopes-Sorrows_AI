#!/usr/bin/env python3
"""
AI Pipeline Diagnostic Script
Tests all AI components and provides detailed analysis of system status.
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box
import json

console = Console()

def test_environment():
    """Test environment configuration"""
    console.print("\n[bold cyan]🔍 ENVIRONMENT DIAGNOSTICS[/bold cyan]")
    
    # Check API keys
    assemblyai_key = os.getenv("ASSEMBLYAI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    env_table = Table(show_header=True, header_style="bold magenta", box=box.ROUNDED)
    env_table.add_column("API Key", style="cyan")
    env_table.add_column("Status", style="green")
    env_table.add_column("Details", style="yellow")
    
    # AssemblyAI
    if assemblyai_key and len(assemblyai_key) > 10:
        env_table.add_row("AssemblyAI", "✅ Configured", f"Key length: {len(assemblyai_key)} chars")
    else:
        env_table.add_row("AssemblyAI", "❌ Missing", "Required for audio processing")
    
    # OpenAI
    if openai_key and len(openai_key) > 10:
        env_table.add_row("OpenAI", "✅ Configured", f"Key length: {len(openai_key)} chars")
    else:
        env_table.add_row("OpenAI", "❌ Missing", "Optional for LLM analysis")
    
    console.print(env_table)
    return assemblyai_key, openai_key

def test_transformer():
    """Test transformer-based sentiment analysis"""
    console.print("\n[bold cyan]🤖 TRANSFORMER ANALYSIS TEST[/bold cyan]")
    
    try:
        from src.hopes_sorrows.analysis.sentiment.sa_transformers import analyze_sentiment
        
        test_texts = [
            "I feel hopeful about tomorrow",
            "I'm devastated by this loss",
            "This experience taught me so much",
            "I'm excited but also terrified",
            "I wonder what this all means"
        ]
        
        results = []
        for text in test_texts:
            try:
                result = analyze_sentiment(text, verbose=False)
                results.append({
                    "text": text,
                    "category": result["category"],
                    "confidence": result["confidence"],
                    "status": "✅ Success"
                })
            except Exception as e:
                results.append({
                    "text": text,
                    "category": "Error",
                    "confidence": 0.0,
                    "status": f"❌ {str(e)[:50]}..."
                })
        
        # Display results
        transformer_table = Table(show_header=True, header_style="bold magenta", box=box.ROUNDED)
        transformer_table.add_column("Test Text", style="cyan", width=30)
        transformer_table.add_column("Category", style="green")
        transformer_table.add_column("Confidence", style="yellow")
        transformer_table.add_column("Status", style="blue")
        
        for result in results:
            transformer_table.add_row(
                result["text"][:30] + "..." if len(result["text"]) > 30 else result["text"],
                result["category"],
                f"{result['confidence']:.2f}",
                result["status"]
            )
        
        console.print(transformer_table)
        return len([r for r in results if "Success" in r["status"]]) == len(results)
        
    except Exception as e:
        console.print(f"[red]❌ Transformer test failed: {e}[/red]")
        return False

def test_llm(openai_key):
    """Test LLM-based sentiment analysis"""
    console.print("\n[bold cyan]🧠 LLM ANALYSIS TEST[/bold cyan]")
    
    if not openai_key:
        console.print("[yellow]⚠️ OpenAI API key not configured - skipping LLM test[/yellow]")
        return False
    
    try:
        from src.hopes_sorrows.analysis.sentiment.sa_LLM import analyze_sentiment as analyze_sentiment_llm
        
        test_text = "I feel hopeful about tomorrow but also scared of what might happen"
        
        try:
            result = analyze_sentiment_llm(test_text, verbose=False)
            
            llm_table = Table(show_header=True, header_style="bold magenta", box=box.ROUNDED)
            llm_table.add_column("Metric", style="cyan")
            llm_table.add_column("Value", style="green")
            
            llm_table.add_row("Test Text", test_text)
            llm_table.add_row("Category", result["category"])
            llm_table.add_row("Confidence", f"{result['confidence']:.2f}")
            llm_table.add_row("Score", f"{result['score']:.3f}")
            llm_table.add_row("Status", "✅ Success")
            
            console.print(llm_table)
            return True
            
        except Exception as e:
            error_msg = str(e)
            if "401" in error_msg or "invalid_api_key" in error_msg:
                console.print("[red]❌ Invalid OpenAI API key[/red]")
                console.print("[yellow]💡 Please update your OPENAI_API_KEY in .env file[/yellow]")
            elif "insufficient_quota" in error_msg:
                console.print("[red]❌ OpenAI API quota exceeded[/red]")
                console.print("[yellow]💡 Check your OpenAI billing and usage limits[/yellow]")
            else:
                console.print(f"[red]❌ LLM test failed: {error_msg}[/red]")
            return False
            
    except Exception as e:
        console.print(f"[red]❌ LLM module import failed: {e}[/red]")
        return False

def test_combined_analyzer():
    """Test combined analyzer"""
    console.print("\n[bold cyan]🔄 COMBINED ANALYZER TEST[/bold cyan]")
    
    try:
        from src.hopes_sorrows.analysis.sentiment.combined_analyzer import analyze_sentiment_combined
        
        test_text = "I'm excited about this opportunity but also nervous about the challenges ahead"
        
        # Test with LLM enabled
        result_with_llm = analyze_sentiment_combined(test_text, use_llm=True, verbose=False)
        
        # Test with LLM disabled
        result_without_llm = analyze_sentiment_combined(test_text, use_llm=False, verbose=False)
        
        combined_table = Table(show_header=True, header_style="bold magenta", box=box.ROUNDED)
        combined_table.add_column("Configuration", style="cyan")
        combined_table.add_column("Category", style="green")
        combined_table.add_column("Confidence", style="yellow")
        combined_table.add_column("Source", style="blue")
        combined_table.add_column("Has LLM", style="magenta")
        
        combined_table.add_row(
            "With LLM",
            result_with_llm["category"],
            f"{result_with_llm['confidence']:.2f}",
            result_with_llm.get("analysis_source", "unknown"),
            str(result_with_llm.get("has_llm", False))
        )
        
        combined_table.add_row(
            "Without LLM",
            result_without_llm["category"],
            f"{result_without_llm['confidence']:.2f}",
            result_without_llm.get("analysis_source", "unknown"),
            str(result_without_llm.get("has_llm", False))
        )
        
        console.print(combined_table)
        return True
        
    except Exception as e:
        console.print(f"[red]❌ Combined analyzer test failed: {e}[/red]")
        return False

def test_database_connection():
    """Test database connectivity"""
    console.print("\n[bold cyan]💾 DATABASE CONNECTION TEST[/bold cyan]")
    
    try:
        from src.hopes_sorrows.data.db_manager import DatabaseManager
        
        db_manager = DatabaseManager()
        
        # Test basic operations
        speakers = db_manager.get_all_speakers()
        transcriptions = db_manager.get_all_transcriptions()
        sessions = db_manager.get_all_recording_sessions()
        
        db_table = Table(show_header=True, header_style="bold magenta", box=box.ROUNDED)
        db_table.add_column("Component", style="cyan")
        db_table.add_column("Count", style="green")
        db_table.add_column("Status", style="yellow")
        
        db_table.add_row("Recording Sessions", str(len(sessions)), "✅ Connected")
        db_table.add_row("Speakers", str(len(speakers)), "✅ Connected")
        db_table.add_row("Transcriptions", str(len(transcriptions)), "✅ Connected")
        
        console.print(db_table)
        
        db_manager.close()
        return True
        
    except Exception as e:
        console.print(f"[red]❌ Database test failed: {e}[/red]")
        return False

def generate_recommendations(test_results):
    """Generate recommendations based on test results"""
    console.print("\n[bold cyan]💡 RECOMMENDATIONS[/bold cyan]")
    
    recommendations = []
    
    if not test_results["environment"]["openai_configured"]:
        recommendations.append("🔑 Configure OpenAI API key in .env file to enable LLM analysis")
    
    if not test_results["llm_working"]:
        recommendations.append("🔧 Fix LLM configuration to enable enhanced sentiment analysis")
    
    if test_results["transformer_working"] and not test_results["llm_working"]:
        recommendations.append("✅ System will work with transformer-only analysis")
    
    if test_results["combined_working"]:
        recommendations.append("🎯 Combined analyzer is working - system will gracefully fallback")
    
    if test_results["database_working"]:
        recommendations.append("💾 Database is properly connected and storing results")
    
    for rec in recommendations:
        console.print(f"[yellow]{rec}[/yellow]")

def main():
    """Main diagnostic function"""
    console.print(Panel.fit(
        "[bold cyan]🔬 AI PIPELINE DIAGNOSTICS[/bold cyan]\n"
        "Testing all AI components and system integration...",
        border_style="cyan",
        padding=(1, 2)
    ))
    
    # Run all tests
    assemblyai_key, openai_key = test_environment()
    transformer_working = test_transformer()
    llm_working = test_llm(openai_key)
    combined_working = test_combined_analyzer()
    database_working = test_database_connection()
    
    # Summary
    console.print("\n[bold cyan]📊 DIAGNOSTIC SUMMARY[/bold cyan]")
    
    summary_table = Table(show_header=True, header_style="bold magenta", box=box.ROUNDED)
    summary_table.add_column("Component", style="cyan")
    summary_table.add_column("Status", style="green")
    summary_table.add_column("Impact", style="yellow")
    
    summary_table.add_row(
        "AssemblyAI", 
        "✅ Configured" if assemblyai_key else "❌ Missing",
        "Critical for audio processing"
    )
    summary_table.add_row(
        "Transformer Model", 
        "✅ Working" if transformer_working else "❌ Failed",
        "Core emotion classification"
    )
    summary_table.add_row(
        "LLM Analysis", 
        "✅ Working" if llm_working else "❌ Failed",
        "Enhanced understanding (optional)"
    )
    summary_table.add_row(
        "Combined Analyzer", 
        "✅ Working" if combined_working else "❌ Failed",
        "Intelligent fallback system"
    )
    summary_table.add_row(
        "Database", 
        "✅ Working" if database_working else "❌ Failed",
        "Data persistence"
    )
    
    console.print(summary_table)
    
    # Generate recommendations
    test_results = {
        "environment": {
            "assemblyai_configured": bool(assemblyai_key),
            "openai_configured": bool(openai_key)
        },
        "transformer_working": transformer_working,
        "llm_working": llm_working,
        "combined_working": combined_working,
        "database_working": database_working
    }
    
    generate_recommendations(test_results)
    
    # Overall status
    if transformer_working and combined_working and database_working:
        console.print("\n[bold green]🎉 SYSTEM STATUS: OPERATIONAL[/bold green]")
        console.print("[green]Your AI pipeline is working! Blobs will be generated correctly.[/green]")
        if not llm_working:
            console.print("[yellow]Note: Running in transformer-only mode (still highly effective)[/yellow]")
    else:
        console.print("\n[bold red]⚠️ SYSTEM STATUS: NEEDS ATTENTION[/bold red]")
        console.print("[red]Some components need fixing before full functionality[/red]")

if __name__ == "__main__":
    main() 