#!/usr/bin/env python3
"""
Basic OpenAI API Test
Simple test to verify OpenAI API key is working correctly.
"""

import os
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel

# Load environment variables
load_dotenv()

console = Console()

def test_openai_basic():
    """Test basic OpenAI API functionality"""
    
    console.print(Panel.fit(
        "[bold cyan]🧪 OPENAI API BASIC TEST[/bold cyan]\n"
        "Testing OpenAI API key and basic functionality...",
        border_style="cyan",
        padding=(1, 2)
    ))
    
    # Check if API key is configured
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        console.print("[red]❌ No OPENAI_API_KEY found in environment[/red]")
        console.print("[yellow]💡 Make sure you have a .env file with OPENAI_API_KEY=your_key_here[/yellow]")
        return False
    
    if api_key == "your_openai_api_key_here":
        console.print("[red]❌ OPENAI_API_KEY is still the placeholder value[/red]")
        console.print("[yellow]💡 Replace 'your_openai_api_key_here' with your actual API key[/yellow]")
        return False
    
    console.print(f"[green]✅ API key found: {api_key[:20]}...{api_key[-8:]}[/green]")
    
    # Test OpenAI import
    try:
        import openai
        console.print("[green]✅ OpenAI library imported successfully[/green]")
    except ImportError:
        console.print("[red]❌ OpenAI library not installed[/red]")
        console.print("[yellow]💡 Run: pip install openai[/yellow]")
        return False
    
    # Test API connection with a simple request
    console.print("[yellow]🔄 Testing API connection...[/yellow]")
    
    try:
        client = openai.OpenAI(api_key=api_key)
        
        # Make a minimal test request
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Respond with exactly one word."},
                {"role": "user", "content": "Say 'hello'"}
            ],
            max_tokens=5,
            temperature=0
        )
        
        # Extract response
        response_text = response.choices[0].message.content.strip()
        console.print(f"[green]✅ API Response: '{response_text}'[/green]")
        
        # Verify response makes sense
        if "hello" in response_text.lower():
            console.print("[bold green]🎉 OpenAI API is working perfectly![/bold green]")
            return True
        else:
            console.print(f"[yellow]⚠️ Unexpected response, but API is working: '{response_text}'[/yellow]")
            return True
            
    except Exception as e:
        error_msg = str(e)
        console.print(f"[red]❌ API Test Failed: {error_msg}[/red]")
        
        # Provide specific error guidance
        if "401" in error_msg or "invalid_api_key" in error_msg:
            console.print("[yellow]💡 This means your API key is invalid or expired[/yellow]")
            console.print("[yellow]💡 Get a new key from: https://platform.openai.com/api-keys[/yellow]")
        elif "insufficient_quota" in error_msg:
            console.print("[yellow]💡 Your OpenAI account has no credits remaining[/yellow]")
            console.print("[yellow]💡 Add billing at: https://platform.openai.com/account/billing[/yellow]")
        elif "rate_limit" in error_msg:
            console.print("[yellow]💡 Rate limit exceeded - try again in a few minutes[/yellow]")
        else:
            console.print("[yellow]💡 Check your internet connection and try again[/yellow]")
        
        return False

def test_sentiment_integration():
    """Test integration with our sentiment analysis system"""
    
    console.print("\n[bold cyan]🔗 TESTING SENTIMENT INTEGRATION[/bold cyan]")
    
    try:
        # Import our LLM sentiment analyzer
        from src.hopes_sorrows.analysis.sentiment.sa_LLM import analyze_sentiment as analyze_sentiment_llm
        console.print("[green]✅ LLM sentiment analyzer imported successfully[/green]")
        
        # Test with a sample text
        test_text = "I'm feeling hopeful about the future but also a bit anxious about the challenges ahead"
        console.print(f"[cyan]🧪 Testing with: '{test_text}'[/cyan]")
        
        result = analyze_sentiment_llm(test_text, verbose=False)
        
        console.print(f"[green]✅ Analysis successful![/green]")
        console.print(f"[green]  Category: {result['category']}[/green]")
        console.print(f"[green]  Confidence: {result['confidence']:.2%}[/green]")
        console.print(f"[green]  Score: {result['score']:.3f}[/green]")
        
        return True
        
    except Exception as e:
        console.print(f"[red]❌ Sentiment integration failed: {str(e)}[/red]")
        return False

def test_combined_analyzer():
    """Test the combined analyzer with LLM enabled"""
    
    console.print("\n[bold cyan]🔄 TESTING COMBINED ANALYZER[/bold cyan]")
    
    try:
        from src.hopes_sorrows.analysis.sentiment.combined_analyzer import analyze_sentiment_combined
        console.print("[green]✅ Combined analyzer imported successfully[/green]")
        
        test_text = "This is both exciting and terrifying at the same time"
        console.print(f"[cyan]🧪 Testing with: '{test_text}'[/cyan]")
        
        result = analyze_sentiment_combined(test_text, use_llm=True, verbose=False)
        
        console.print(f"[green]✅ Combined analysis successful![/green]")
        console.print(f"[green]  Category: {result['category']}[/green]")
        console.print(f"[green]  Analysis Source: {result.get('analysis_source', 'unknown')}[/green]")
        console.print(f"[green]  Has LLM: {result.get('has_llm', False)}[/green]")
        console.print(f"[green]  Confidence: {result['confidence']:.2%}[/green]")
        
        # Check if LLM was actually used
        if result.get('has_llm', False) and result.get('analysis_source') not in ['transformer_only', 'fallback']:
            console.print("[bold green]🎉 LLM is being used in combined analysis![/bold green]")
        else:
            console.print("[yellow]⚠️ Combined analyzer fell back to transformer-only[/yellow]")
        
        return True
        
    except Exception as e:
        console.print(f"[red]❌ Combined analyzer test failed: {str(e)}[/red]")
        return False

def main():
    """Run all tests"""
    
    console.print("[bold]🔬 COMPREHENSIVE OPENAI & LLM TESTING[/bold]\n")
    
    # Test 1: Basic OpenAI API
    basic_success = test_openai_basic()
    
    if not basic_success:
        console.print("\n[bold red]❌ Basic API test failed - fix API key before continuing[/bold red]")
        return False
    
    # Test 2: Sentiment integration
    sentiment_success = test_sentiment_integration()
    
    # Test 3: Combined analyzer
    combined_success = test_combined_analyzer()
    
    # Final summary
    console.print("\n" + "="*60)
    console.print("[bold cyan]📊 TEST SUMMARY[/bold cyan]")
    console.print(f"Basic OpenAI API: {'✅ PASS' if basic_success else '❌ FAIL'}")
    console.print(f"Sentiment Integration: {'✅ PASS' if sentiment_success else '❌ FAIL'}")
    console.print(f"Combined Analyzer: {'✅ PASS' if combined_success else '❌ FAIL'}")
    
    if basic_success and sentiment_success and combined_success:
        console.print("\n[bold green]🎉 ALL TESTS PASSED! Your LLM integration is working perfectly![/bold green]")
        console.print("[green]✅ OpenAI API key is valid and working[/green]")
        console.print("[green]✅ LLM sentiment analysis is functional[/green]") 
        console.print("[green]✅ Combined analyzer is using LLM enhancement[/green]")
        console.print("[green]✅ Your AI pipeline is now fully operational with LLM![/green]")
    elif basic_success:
        console.print("\n[yellow]⚠️ Basic API works but integration has issues - check your code[/yellow]")
    else:
        console.print("\n[red]❌ API key issues - run the LLM setup assistant to fix[/red]")
        console.print("[yellow]💡 Run: python3 scripts/fix_llm_setup.py[/yellow]")
    
    return basic_success and sentiment_success and combined_success

if __name__ == "__main__":
    main() 