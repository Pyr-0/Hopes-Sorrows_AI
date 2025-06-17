#!/usr/bin/env python3
"""
Simple real-time blob monitoring script.
"""

import sqlite3
import time
import sys
from datetime import datetime

def get_counts():
    """Get current database counts."""
    try:
        conn = sqlite3.connect("data/databases/sentiment_analysis.db")
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM transcriptions")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT text) FROM transcriptions")
        unique = cursor.fetchone()[0]
        
        conn.close()
        return total, unique
    except Exception as e:
        print(f"Error: {e}")
        return None, None

def main():
    print("🔍 MONITORING BLOB DATABASE FOR DUPLICATES")
    print("=" * 50)
    print("Make a recording now and watch for changes...")
    print("Press Ctrl+C to stop")
    print()
    
    last_total, last_unique = get_counts()
    if last_total is None:
        print("❌ Failed to connect to database")
        return
    
    print(f"Initial: {last_total} total, {last_unique} unique, {last_total - last_unique} duplicates")
    print()
    
    try:
        while True:
            time.sleep(1)
            
            total, unique = get_counts()
            if total is None:
                continue
            
            if total != last_total or unique != last_unique:
                timestamp = datetime.now().strftime("%H:%M:%S")
                duplicates = total - unique
                
                print(f"[{timestamp}] CHANGE: {total} total, {unique} unique, {duplicates} duplicates")
                
                if duplicates > (last_total - last_unique):
                    print(f"🚨 NEW DUPLICATES CREATED! (+{duplicates - (last_total - last_unique)})")
                
                last_total, last_unique = total, unique
                
    except KeyboardInterrupt:
        print("\n🛑 Monitoring stopped")
        
        final_total, final_unique = get_counts()
        if final_total is not None:
            print(f"Final: {final_total} total, {final_unique} unique, {final_total - final_unique} duplicates")

if __name__ == "__main__":
    main() 