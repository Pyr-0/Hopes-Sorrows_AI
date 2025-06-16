#!/usr/bin/env python3
"""
Script to identify and optionally remove duplicate or very similar transcriptions.
This helps clean up the database when the same recording gets processed multiple times.
"""

import sys
import os
from difflib import SequenceMatcher

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from hopes_sorrows.data.db_manager import DatabaseManager
from hopes_sorrows.core.config import get_config

def similarity(a, b):
    """Calculate similarity between two strings (0-1 scale)"""
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

def find_duplicates(transcriptions, similarity_threshold=0.95):
    """Find transcriptions that are very similar to each other"""
    duplicates = []
    
    for i, trans1 in enumerate(transcriptions):
        for j, trans2 in enumerate(transcriptions[i+1:], i+1):
            sim = similarity(trans1.text, trans2.text)
            if sim >= similarity_threshold:
                duplicates.append({
                    'transcription1': trans1,
                    'transcription2': trans2,
                    'similarity': sim
                })
    
    return duplicates

def main():
    print("🔍 Duplicate Transcription Finder")
    print("=" * 50)
    
    # Initialize database
    config = get_config()
    db_manager = DatabaseManager(config.get_database_url())
    
    try:
        # Get all transcriptions
        transcriptions = db_manager.get_all_transcriptions()
        print(f"📊 Found {len(transcriptions)} total transcriptions")
        
        if len(transcriptions) < 2:
            print("ℹ️ Need at least 2 transcriptions to check for duplicates")
            return
        
        # Find duplicates
        duplicates = find_duplicates(transcriptions)
        
        if not duplicates:
            print("✅ No duplicates found!")
            return
        
        print(f"\n🔍 Found {len(duplicates)} potential duplicate pairs:")
        print("-" * 50)
        
        for i, dup in enumerate(duplicates, 1):
            trans1 = dup['transcription1']
            trans2 = dup['transcription2']
            sim = dup['similarity']
            
            print(f"\n{i}. Similarity: {sim:.1%}")
            print(f"   Speaker {trans1.speaker.global_sequence}: \"{trans1.text}\"")
            print(f"   Speaker {trans2.speaker.global_sequence}: \"{trans2.text}\"")
            print(f"   Analyses: {len(trans1.sentiment_analyses)} vs {len(trans2.sentiment_analyses)}")
            
            # Show different sentiment results if any
            if trans1.sentiment_analyses and trans2.sentiment_analyses:
                trans1_categories = [a.category for a in trans1.sentiment_analyses]
                trans2_categories = [a.category for a in trans2.sentiment_analyses]
                if trans1_categories != trans2_categories:
                    print(f"   ⚠️ Different emotions: {trans1_categories} vs {trans2_categories}")
        
        # Ask user what to do
        print(f"\n🤔 What would you like to do?")
        print("1. Keep all (do nothing)")
        print("2. Remove newer duplicates (keep older ones)")
        print("3. Show detailed comparison")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "2":
            print("\n🗑️ Removing newer duplicates...")
            removed_count = 0
            
            for dup in duplicates:
                trans1 = dup['transcription1']
                trans2 = dup['transcription2']
                
                # Keep the older one (lower ID typically means created earlier)
                if trans1.id < trans2.id:
                    to_remove = trans2
                    to_keep = trans1
                else:
                    to_remove = trans1
                    to_keep = trans2
                
                print(f"   Removing: Speaker {to_remove.speaker.global_sequence} - \"{to_remove.text[:50]}...\"")
                print(f"   Keeping:  Speaker {to_keep.speaker.global_sequence} - \"{to_keep.text[:50]}...\"")
                
                # Remove sentiment analyses first
                for analysis in to_remove.sentiment_analyses:
                    db_manager.session.delete(analysis)
                
                # Remove transcription
                db_manager.session.delete(to_remove)
                removed_count += 1
            
            # Commit changes
            db_manager.session.commit()
            print(f"✅ Removed {removed_count} duplicate transcriptions")
            
        elif choice == "3":
            print("\n📋 Detailed Comparison:")
            for i, dup in enumerate(duplicates, 1):
                trans1 = dup['transcription1']
                trans2 = dup['transcription2']
                
                print(f"\n--- Duplicate Pair {i} ---")
                print(f"Transcription 1 (ID: {trans1.id}):")
                print(f"  Speaker: {trans1.speaker.display_name} (Global #{trans1.speaker.global_sequence})")
                print(f"  Text: \"{trans1.text}\"")
                print(f"  Created: {trans1.created_at}")
                print(f"  Analyses: {[(a.analyzer_type.value, a.category) for a in trans1.sentiment_analyses]}")
                
                print(f"\nTranscription 2 (ID: {trans2.id}):")
                print(f"  Speaker: {trans2.speaker.display_name} (Global #{trans2.speaker.global_sequence})")
                print(f"  Text: \"{trans2.text}\"")
                print(f"  Created: {trans2.created_at}")
                print(f"  Analyses: {[(a.analyzer_type.value, a.category) for a in trans2.sentiment_analyses]}")
        
        else:
            print("👍 No changes made")
    
    finally:
        db_manager.close()

if __name__ == "__main__":
    main() 