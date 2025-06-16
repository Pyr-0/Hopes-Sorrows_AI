# 🏗️ Project Structure - Hopes & Sorrows

This document describes the reorganized, industry-standard structure of the Hopes & Sorrows project.

## 📁 Directory Overview

```
hopes-sorrows/
├── 📁 src/hopes_sorrows/           # Main source code (Python package)
│   ├── 📁 core/                    # Core utilities and configuration
│   ├── 📁 analysis/                # AI analysis modules
│   │   ├── 📁 sentiment/           # Sentiment analysis components
│   │   └── 📁 audio/               # Audio processing components
│   ├── 📁 data/                    # Data models and database management
│   ├── 📁 web/                     # Web application
│   │   ├── 📁 api/                 # Flask API endpoints
│   │   ├── 📁 static/              # CSS, JS, images
│   │   └── 📁 templates/           # HTML templates
│   ├── 📁 cli/                     # Command-line interface
│   └── 📁 utils/                   # Utility functions
├── 📁 data/                        # Application data (gitignored)
│   ├── 📁 databases/               # SQLite databases
│   ├── 📁 recordings/              # Audio recordings
│   ├── 📁 uploads/                 # File uploads
│   └── 📁 exports/                 # Data exports
├── 📁 scripts/                     # Standalone scripts and utilities
├── 📁 tests/                       # Test suites
├── 📁 docs/                        # Documentation
├── 📁 config/                      # Configuration files
├── 📁 logs/                        # Application logs
├── 📁 deployment/                  # Deployment configurations
│   ├── 📁 docker/                  # Docker configurations
│   └── 📁 k8s/                     # Kubernetes configurations
├── 📄 main.py                      # Main entry point
├── 📄 setup.py                     # Package installation script
├── 📄 Makefile                     # Development automation
├── 📄 requirements.txt             # Python dependencies
├── 📄 env.template                 # Environment template
└── 📄 README.md                    # Project documentation
```

## 🎯 Key Improvements

### Industry Standards Applied

1. **📦 Proper Python Package Structure**
   - Source code in `src/` directory
   - Namespace package `hopes_sorrows`
   - Proper `__init__.py` files with exports
   - Clear module separation

2. **🔧 Configuration Management**
   - Centralized configuration in `src/hopes_sorrows/core/config.py`
   - Environment variable loading from project root
   - Type-safe configuration access

3. **📁 Data Organization**
   - All data files in dedicated `data/` directory
   - Separate subdirectories by data type
   - Centralized database location

4. **🚀 Entry Points**
   - Main entry point: `main.py`
   - Specialized scripts in `scripts/` directory
   - Console scripts defined in `setup.py`

5. **🛠️ Development Tools**
   - Makefile for common tasks
   - Setup script for package installation
   - Development dependency management

## 📋 Module Descriptions

### Core (`src/hopes_sorrows/core/`)
- **`config.py`**: Centralized configuration management
- **`exceptions.py`**: Custom exception classes
- **`__init__.py`**: Core module exports

### Analysis (`src/hopes_sorrows/analysis/`)
- **`sentiment/`**: Sentiment analysis components
  - `sa_transformers.py`: Transformer-based analysis
  - `sa_LLM.py`: LLM-based analysis
  - `advanced_classifier.py`: Enhanced classification
  - `cli_formatter.py`: Output formatting
- **`audio/`**: Audio processing components
  - `assembyai.py`: Speech-to-text and analysis
  - `speaker_profiles.py`: Speaker identification

### Data (`src/hopes_sorrows/data/`)
- **`models.py`**: SQLAlchemy database models
- **`db_manager.py`**: Database operations
- **`schema.py`**: Database schema management

### Web (`src/hopes_sorrows/web/`)
- **`api/app.py`**: Flask application and routes
- **`static/`**: Frontend assets (CSS, JS, images)
- **`templates/`**: HTML templates

## 🔧 Entry Points and Scripts

### Main Entry Point
```bash
# Run the main application with subcommands
python3 main.py web          # Start web application
python3 main.py cli          # Start CLI analysis
python3 main.py audio        # Start audio analysis
python3 main.py init-db      # Initialize database
python3 main.py version      # Show version
```

### Specialized Scripts
```bash
# Direct script execution
python3 scripts/run_web.py           # Web application
python3 scripts/setup_db.py          # Database setup
python3 scripts/analyze_sentiment.py # CLI sentiment analysis
```

### Makefile Commands
```bash
make help          # Show all available commands
make setup         # Complete project setup
make run-web       # Start web application
make run-cli       # Start CLI analysis
make test          # Run test suite
make clean         # Clean build artifacts
```

## 📦 Package Installation

### Development Installation
```bash
# Install in development mode
pip3 install -e .

# Install with development dependencies
pip3 install -e ".[dev]"
```

### Production Installation
```bash
# Install from source
pip3 install .

# Or after publishing to PyPI
pip3 install hopes-sorrows
```

## 🔐 Environment Configuration

### Setup Environment
```bash
# Copy template and configure
cp env.template .env
# Edit .env with your API keys
```

### Environment Variables
- `ASSEMBLYAI_API_KEY`: Required for audio analysis
- `OPENAI_API_KEY`: Optional for LLM analysis
- `DATABASE_URL`: Database connection string
- `FLASK_ENV`: Development/production mode
- Model and threshold configurations

## 🏃‍♂️ Quick Start

### Complete Setup
```bash
# 1. Install dependencies
make install

# 2. Setup environment
make setup-env
# Edit .env with your API keys

# 3. Initialize database
make setup-db

# 4. Run web application
make run-web
```

### Alternative Quick Start
```bash
# One command setup (requires manual .env editing)
make setup

# Then run
python3 main.py web
```

## 🔍 Benefits of New Structure

1. **🏛️ Industry Standards**: Follows Python packaging best practices
2. **🔧 Maintainability**: Clear separation of concerns
3. **📈 Scalability**: Easy to add new modules and features
4. **🚀 Deployment**: Ready for containerization and cloud deployment
5. **👥 Team Development**: Clear module boundaries and responsibilities
6. **🧪 Testing**: Organized test structure aligned with source code
7. **📚 Documentation**: Centralized and well-organized docs
8. **🔒 Security**: Environment variables properly managed
9. **🐳 Containerization**: Docker-ready structure
10. **⚙️ Automation**: Makefile and scripts for common tasks

This reorganized structure provides a solid foundation for professional development, deployment, and maintenance of the Hopes & Sorrows application. 