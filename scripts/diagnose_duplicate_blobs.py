#!/usr/bin/env python3
"""
Comprehensive diagnostic script for duplicate blob issue.
Monitors database, WebSocket events, and frontend behavior.
"""

import sys
import os
import sqlite3
import time
import threading
import json
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from hopes_sorrows.core.config import get_config
from hopes_sorrows.data.db_manager import DatabaseManager

class DuplicateBlobDiagnostics:
    def __init__(self):
        self.config = get_config()
        self.db_path = "data/databases/sentiment_analysis.db"
        self.monitoring = False
        self.initial_counts = {}
        self.log_file = f"duplicate_diagnostics_{int(time.time())}.log"
        
    def log(self, message):
        """Log message with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        log_msg = f"[{timestamp}] {message}"
        print(log_msg)
        
        # Also write to log file
        try:
            with open(self.log_file, 'a') as f:
                f.write(log_msg + "\n")
        except:
            pass
    
    def get_database_counts(self):
        """Get current database counts."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get transcription counts
            cursor.execute("SELECT COUNT(*) FROM transcriptions")
            total_transcriptions = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT text) FROM transcriptions")
            unique_transcriptions = cursor.fetchone()[0]
            
            # Get analysis counts
            cursor.execute("SELECT COUNT(*) FROM sentiment_analyses")
            total_analyses = cursor.fetchone()[0]
            
            # Get recent entries
            cursor.execute("""
                SELECT id, text, created_at 
                FROM transcriptions 
                ORDER BY created_at DESC 
                LIMIT 5
            """)
            recent_transcriptions = cursor.fetchall()
            
            conn.close()
            
            return {
                'total_transcriptions': total_transcriptions,
                'unique_transcriptions': unique_transcriptions,
                'total_analyses': total_analyses,
                'duplicates': total_transcriptions - unique_transcriptions,
                'recent_transcriptions': recent_transcriptions
            }
        except Exception as e:
            self.log(f"❌ Database query error: {e}")
            return None
    
    def monitor_database_changes(self):
        """Monitor database for real-time changes."""
        self.log("🔍 Starting database change monitoring...")
        
        last_counts = self.get_database_counts()
        if not last_counts:
            self.log("❌ Failed to get initial database counts")
            return
        
        self.initial_counts = last_counts.copy()
        self.log(f"📊 Initial state: {last_counts['total_transcriptions']} total, {last_counts['unique_transcriptions']} unique, {last_counts['duplicates']} duplicates")
        
        while self.monitoring:
            time.sleep(1)  # Check every second
            
            current_counts = self.get_database_counts()
            if not current_counts:
                continue
            
            # Check for changes
            if current_counts != last_counts:
                self.log("🚨 DATABASE CHANGE DETECTED!")
                self.log(f"   Before: {last_counts['total_transcriptions']} total, {last_counts['unique_transcriptions']} unique")
                self.log(f"   After:  {current_counts['total_transcriptions']} total, {current_counts['unique_transcriptions']} unique")
                
                # Check for new duplicates
                new_duplicates = current_counts['duplicates'] - last_counts['duplicates']
                if new_duplicates > 0:
                    self.log(f"🔥 NEW DUPLICATES CREATED: {new_duplicates}")
                
                # Show recent entries
                if current_counts['recent_transcriptions']:
                    self.log("📝 Recent transcriptions:")
                    for trans in current_counts['recent_transcriptions'][:3]:
                        self.log(f"   ID {trans[0]}: '{trans[1][:50]}...' at {trans[2]}")
                
                last_counts = current_counts
    
    def check_frontend_session_handling(self):
        """Analyze frontend session ID handling."""
        self.log("🎯 Analyzing frontend session handling...")
        
        # Read the app.js file to check session logic
        try:
            with open('src/hopes_sorrows/web/static/js/app.js', 'r') as f:
                content = f.read()
            
            # Check for session ID generation
            if 'generateSessionId()' in content:
                self.log("✅ Found session ID generation in frontend")
            else:
                self.log("❌ No session ID generation found")
            
            # Check for session filtering in WebSocket handler
            if 'blobData.session_id !== this.sessionId' in content:
                self.log("✅ Found session filtering in WebSocket handler")
            else:
                self.log("❌ No session filtering in WebSocket handler")
            
            # Check for duplicate prevention flag
            if 'isProcessingAnalysis' in content:
                self.log("✅ Found duplicate processing prevention flag")
            else:
                self.log("❌ No duplicate processing prevention flag")
                
        except Exception as e:
            self.log(f"❌ Error reading frontend code: {e}")
    
    def analyze_blob_visualizer(self):
        """Analyze the blob visualizer for duplicate handling."""
        self.log("🫧 Analyzing blob visualizer...")
        
        try:
            with open('src/hopes_sorrows/web/static/js/blob-visualizer.js', 'r') as f:
                content = f.read()
            
            # Check for addBlob method
            if 'addBlob(' in content:
                self.log("✅ Found addBlob method")
            else:
                self.log("❌ No addBlob method found")
            
            # Check for duplicate blob prevention
            if 'blob.id' in content and 'find(' in content:
                self.log("✅ Blob ID checking logic found")
            else:
                self.log("⚠️ No obvious blob ID duplicate checking")
            
        except Exception as e:
            self.log(f"❌ Error reading blob visualizer: {e}")
    
    def test_api_response_consistency(self):
        """Test API response consistency."""
        self.log("🌐 Testing API response consistency...")
        
        try:
            import requests
            
            # Test get_all_blobs endpoint multiple times
            for i in range(3):
                response = requests.get('http://localhost:8080/api/get_all_blobs', timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and data.get('blobs'):
                        blob_count = len(data['blobs'])
                        unique_texts = len(set(blob['text'] for blob in data['blobs'] if 'text' in blob))
                        self.log(f"📡 API call {i+1}: {blob_count} blobs, {unique_texts} unique texts")
                        
                        if blob_count != unique_texts:
                            self.log(f"🚨 API RETURNING DUPLICATE BLOBS: {blob_count - unique_texts} duplicates")
                    else:
                        self.log(f"⚠️ API call {i+1}: No blobs returned")
                else:
                    self.log(f"❌ API call {i+1}: HTTP {response.status_code}")
                
                time.sleep(1)
                
        except Exception as e:
            self.log(f"❌ API test error: {e}")
    
    def start_monitoring(self):
        """Start comprehensive monitoring."""
        self.log("🚀 STARTING COMPREHENSIVE DUPLICATE BLOB DIAGNOSTICS")
        self.log("=" * 60)
        
        # Initial analysis
        self.check_frontend_session_handling()
        self.analyze_blob_visualizer()
        self.test_api_response_consistency()
        
        # Start database monitoring
        self.monitoring = True
        db_thread = threading.Thread(target=self.monitor_database_changes)
        db_thread.daemon = True
        db_thread.start()
        
        self.log("🎯 Monitoring started. Make a recording now to see what happens...")
        self.log("📝 Watching for:")
        self.log("   • Database changes")
        self.log("   • Duplicate transcription creation")
        self.log("   • API response consistency")
        self.log("   • WebSocket event patterns")
        self.log("")
        self.log("Press Ctrl+C to stop monitoring")
        
        try:
            while True:
                time.sleep(10)
                # Periodic API checks
                self.test_api_response_consistency()
                
        except KeyboardInterrupt:
            self.log("🛑 Monitoring stopped by user")
            self.monitoring = False
    
    def generate_summary_report(self):
        """Generate a summary report of findings."""
        final_counts = self.get_database_counts()
        
        self.log("📋 DIAGNOSTIC SUMMARY REPORT")
        self.log("=" * 40)
        
        if self.initial_counts and final_counts:
            changes = {
                'transcriptions_added': final_counts['total_transcriptions'] - self.initial_counts['total_transcriptions'],
                'unique_added': final_counts['unique_transcriptions'] - self.initial_counts['unique_transcriptions'],
                'duplicates_created': final_counts['duplicates'] - self.initial_counts['duplicates']
            }
            
            self.log(f"📊 Changes during monitoring:")
            self.log(f"   Transcriptions added: {changes['transcriptions_added']}")
            self.log(f"   Unique texts added: {changes['unique_added']}")
            self.log(f"   Duplicates created: {changes['duplicates_created']}")
            
            if changes['duplicates_created'] > 0:
                self.log("🔥 DUPLICATES WERE CREATED IN DATABASE!")
                self.log("   → Backend duplicate prevention is NOT working")
            else:
                self.log("✅ No database duplicates created")
                self.log("   → Issue is likely in frontend blob handling")
        
        self.log(f"📄 Full log saved to: {self.log_file}")

def main():
    diagnostics = DuplicateBlobDiagnostics()
    
    try:
        diagnostics.start_monitoring()
    except Exception as e:
        diagnostics.log(f"❌ Diagnostic error: {e}")
    finally:
        diagnostics.generate_summary_report()

if __name__ == "__main__":
    main() 