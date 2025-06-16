#!/usr/bin/env python3
"""
CLI sentiment analysis tool for Hopes & Sorrows.
"""

import sys
import argparse
from pathlib import Path

# Add src to Python path
project_root = Path(__file__).parent.parent
src_path = project_root / 'src'
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from hopes_sorrows.analysis.sentiment import analyze_sentiment

def analyze_text(text: str, verbose: bool = True):
    """Analyze a single text string."""
    try:
        result = analyze_sentiment(text, verbose=verbose)
        
        if not verbose:
            print(f"\nResults for: '{text}'")
            print(f"  Sentiment: {result['label']}")
            print(f"  Category: {result['category']}")
            print(f"  Score: {result['score']:.3f}")
            print(f"  Confidence: {result['confidence']:.3f}")
            if result.get('explanation'):
                print(f"  Explanation: {result['explanation']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error analyzing text: {e}")
        return None

def analyze_file(file_path: Path, verbose: bool = True):
    """Analyze text from a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        
        if not content:
            print(f"⚠️  File {file_path} is empty")
            return None
        
        print(f"📄 Analyzing content from: {file_path}")
        return analyze_text(content, verbose)
        
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return None
    except Exception as e:
        print(f"❌ Error reading file {file_path}: {e}")
        return None

def interactive_mode():
    """Run in interactive mode."""
    print("🤖 Hopes & Sorrows - Interactive Sentiment Analysis")
    print("Enter text to analyze, or 'quit' to exit.\n")
    
    while True:
        try:
            text = input("Enter text: ").strip()
            
            if text.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if not text:
                print("⚠️  Please enter some text to analyze.")
                continue
            
            analyze_text(text, verbose=False)
            print()  # Add spacing
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='CLI Sentiment Analysis for Hopes & Sorrows')
    
    group = parser.add_mutually_exclusive_group()
    group.add_argument('-t', '--text', help='Text to analyze')
    group.add_argument('-f', '--file', type=Path, help='File containing text to analyze')
    group.add_argument('-i', '--interactive', action='store_true', help='Run in interactive mode')
    
    parser.add_argument('-v', '--verbose', action='store_true', 
                       help='Verbose output with detailed formatting')
    
    args = parser.parse_args()
    
    if args.text:
        analyze_text(args.text, args.verbose)
    elif args.file:
        analyze_file(args.file, args.verbose)
    elif args.interactive:
        interactive_mode()
    else:
        # Default to interactive mode
        interactive_mode()

if __name__ == '__main__':
    main() 