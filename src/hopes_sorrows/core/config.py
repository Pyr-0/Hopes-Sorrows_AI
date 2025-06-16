"""
Configuration management for Hopes & Sorrows application.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, Any, Optional

class Config:
    """Centralized configuration management."""
    
    def __init__(self):
        self._config = {}
        self._load_environment()
        self._setup_defaults()
    
    def _load_environment(self):
        """Load environment variables from .env file."""
        # Find project root (where .env should be)
        current_dir = Path(__file__).parent
        project_root = current_dir.parent.parent.parent
        env_path = project_root / '.env'
        
        if env_path.exists():
            load_dotenv(env_path)
            print(f"✅ Environment loaded from: {env_path}")
        else:
            print(f"⚠️  No .env file found at: {env_path}")
    
    def _setup_defaults(self):
        """Setup default configuration values."""
        self._config = {
            # API Keys
            'ASSEMBLYAI_API_KEY': os.getenv('ASSEMBLYAI_API_KEY'),
            'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
            
            # Database
            'DATABASE_URL': os.getenv('DATABASE_URL', 'sqlite:///data/databases/sentiment_analysis.db'),
            
            # Flask/Web
            'FLASK_ENV': os.getenv('FLASK_ENV', 'development'),
            'FLASK_HOST': os.getenv('FLASK_HOST', '0.0.0.0'),
            'FLASK_PORT': int(os.getenv('FLASK_PORT', 8080)),
            'SECRET_KEY': os.getenv('SECRET_KEY', 'hopes-and-sorrows-secret-key'),
            
            # Model Configuration
            'SENTIMENT_MODEL': os.getenv('SENTIMENT_MODEL', 'j-hartmann/emotion-english-distilroberta-base'),
            'LLM_MODEL': os.getenv('LLM_MODEL', 'gpt-4o-mini'),
            'TOKENIZERS_PARALLELISM': os.getenv('TOKENIZERS_PARALLELISM', 'false'),
            
            # Analysis Thresholds
            'SENTIMENT_THRESHOLD_HOPE': float(os.getenv('SENTIMENT_THRESHOLD_HOPE', '0.2')),
            'SENTIMENT_THRESHOLD_SORROW': float(os.getenv('SENTIMENT_THRESHOLD_SORROW', '-0.1')),
            'HIGH_CONFIDENCE': float(os.getenv('HIGH_CONFIDENCE', '0.8')),
            'MEDIUM_CONFIDENCE': float(os.getenv('MEDIUM_CONFIDENCE', '0.6')),
            'LOW_CONFIDENCE': float(os.getenv('LOW_CONFIDENCE', '0.4')),
            
            # Paths
            'DATA_DIR': Path('data'),
            'RECORDINGS_DIR': Path('data/recordings'),
            'DATABASES_DIR': Path('data/databases'),
        }
        
        # Set TOKENIZERS_PARALLELISM to avoid warnings
        os.environ["TOKENIZERS_PARALLELISM"] = self._config['TOKENIZERS_PARALLELISM']
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value."""
        return self._config.get(key, default)
    
    def get_required(self, key: str) -> Any:
        """Get required configuration value, raise error if not found."""
        value = self._config.get(key)
        if value is None:
            raise ValueError(f"Required configuration '{key}' not found")
        return value
    
    def set(self, key: str, value: Any):
        """Set configuration value."""
        self._config[key] = value
    
    def get_api_keys(self) -> Dict[str, Optional[str]]:
        """Get all API keys."""
        return {
            'assemblyai': self.get('ASSEMBLYAI_API_KEY'),
            'openai': self.get('OPENAI_API_KEY')
        }
    
    def get_database_url(self) -> str:
        """Get database URL with proper path resolution."""
        url = self.get('DATABASE_URL')
        if url.startswith('sqlite:///') and not url.startswith('sqlite:///data/'):
            # Ensure database is in the data directory
            db_name = url.split(':///')[-1]
            if not db_name.startswith('data/'):
                url = f"sqlite:///data/databases/{db_name}"
        return url
    
    def get_dotenv_path(self) -> Path:
        """Get the path to the .env file."""
        current_dir = Path(__file__).parent
        project_root = current_dir.parent.parent.parent
        return project_root / '.env'
    
    def get_recordings_path(self) -> Path:
        """Get the recordings directory path."""
        return self.get('RECORDINGS_DIR')
    
    def get_databases_path(self) -> Path:
        """Get the databases directory path."""
        return self.get('DATABASES_DIR')
    
    def ensure_directories(self):
        """Ensure required directories exist."""
        directories = [
            self.get('DATA_DIR'),
            self.get('RECORDINGS_DIR'),
            self.get('DATABASES_DIR'),
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)

# Global configuration instance
_config = None

def get_config() -> Config:
    """Get the global configuration instance."""
    global _config
    if _config is None:
        _config = Config()
    return _config

def load_environment():
    """Load environment variables (convenience function)."""
    get_config()  # This will trigger environment loading 