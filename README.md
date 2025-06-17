# 🎭 Hopes & Sorrows - Interactive Emotional Voice Analysis

An innovative web application that captures, analyzes, and visualizes human emotions through voice recordings using advanced AI and stunning real-time visualizations.

## ✨ What is Hopes & Sorrows?

Hopes & Sorrows is an interactive emotional analysis platform that transforms your voice into beautiful, dynamic visualizations. Speak about your feelings, and watch as AI analyzes your emotions and creates personalized "emotion blobs" that float and interact in a mesmerizing digital landscape.

### 🎯 Key Features

- **🎤 Real-time Voice Recording**: Capture up to 44 seconds of emotional expression
- **🤖 Advanced AI Analysis**: Dual sentiment analysis using both transformer models and LLM
- **🎨 Dynamic Visualizations**: Real-time emotion blobs with physics-based interactions
- **📊 Emotion Categories**: Hope, Sorrow, Transformative, Ambivalent, and Reflective emotions
- **👥 Speaker Identification**: Track multiple speakers across sessions
- **📈 Analytics Dashboard**: Comprehensive statistics and emotion tracking
- **🌐 Web-based Interface**: No installation required - runs in your browser
- **💾 Persistent Storage**: All analyses saved to SQLite database

### 🎭 Emotion Categories

The system classifies emotions into five meaningful categories:

- **💚 Hope**: Joy, optimism, excitement, love, gratitude
- **💙 Sorrow**: Sadness, grief, disappointment, loneliness
- **🟡 Transformative**: Anger, determination, breakthrough moments
- **🟠 Ambivalent**: Mixed emotions, uncertainty, complexity
- **⚪ Reflective**: Contemplation, neutrality, thoughtfulness

### 🧮 Advanced Scoring System

Hopes & Sorrows uses a sophisticated multi-dimensional scoring system to capture emotional nuance:

#### Score Components

- **📊 Sentiment Score** (`-1.0` to `1.0`): Emotional polarity where negative values represent sorrow-leaning emotions and positive values represent hope-leaning emotions
- **⚡ Intensity Score** (`0.0` to `1.0`): Emotional strength - how powerful the emotion is regardless of polarity
- **🎯 Confidence Score** (`0.0` to `1.0`): AI certainty in the classification - how confident the system is about its analysis

#### Blob Size Calculation

Emotion blobs are dynamically sized based on emotional properties:

```
Final Size = Base Size (10px) + 
            Intensity × 12 + 
            Confidence × 6 + 
            |Score| × 8
```

**Size Hierarchy**: Intensity > Confidence > Absolute Score Value  
**Size Range**: 8px to 30px for optimal visual balance

### 🔬 Physics-Based Behavior System

Each emotion blob exhibits realistic physics behavior that reflects psychological principles:

#### Advanced Social Physics Engine

1. **🌊 Organic Floating**: Sine/cosine wave patterns scaled by emotional energy
2. **⚖️ Gravitational Forces**: Hope naturally rises (↑), sorrow naturally falls (↓)
3. **🤝 Social Dynamics**: Emotions attract/repel based on psychological compatibility
4. **💥 Collision Physics**: Mass-based elastic collisions with proper impulse calculation
5. **🛡️ Boundary Forces**: Intelligent edge detection with corner escape mechanisms
6. **🌊 Wave Reactions**: Collective response when new emotions appear
7. **🎯 Nudge System**: Click anywhere to gently push nearby blobs with realistic force
8. **🚨 Emergency Recovery**: Automatic teleportation for completely stuck blobs

#### Social Behavioral Matrix

Each emotion category has distinct social tendencies based on psychological research:

- **Hope** (+0.7): Seeks companionship, creates positive social energy, rises upward
- **Transformative** (+0.5): Moderate social interaction, focused energy, dynamic movement
- **Ambivalent** (+0.1): Uncertain about social contact, hesitant and unpredictable movement
- **Reflective** (-0.1): Prefers contemplative solitude, stable floating behavior
- **Sorrow** (-0.3): Seeks gentle comfort while maintaining distance, downward drift

#### Physics Constants (Optimized for Serenity)

```javascript
gravity: 0.002          // Emotional polarity effect strength
friction: 0.998         // High damping for calm movement
repulsionForce: 0.1     // Gentle collision separation
attractionForce: 0.02   // Subtle social magnetism
collisionDamping: 0.3   // Reduced bounce for soft interactions
maxSpeed: 1.0           // Ultra-calm movement limit (px/frame)
```

#### Mass & Physics Properties

- **Mass Calculation**: `(Base Size ÷ 10) + Intensity × 2 + |Score| × 1.5`
- **Hit Radius**: `max(blob.size × 3, 40px)` for enhanced click detection
- **Social Range**: 100px interaction radius for emotional compatibility
- **Velocity Limits**: 3px/frame maximum to prevent chaotic movement
- **Collision Response**: Larger emotions have more inertia, smaller emotions bounce more
- **Social Range**: 200px interaction radius for emotional influence

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ (use `python3` command)
- AssemblyAI API key (free tier available)
- Modern web browser with microphone access

### 1. Clone and Setup

```bash
git clone <repository-url>
cd AI/Final_Project
```

### 2. Install Dependencies

```bash
pip3 install -r requirements.txt
```

### 3. Complete Setup

Use the automated setup:

```bash
make setup
```

Or manual setup:

```bash
# Copy environment template
cp env.template .env
# Edit .env with your API keys

# Install dependencies  
make install

# Initialize database
make setup-db
```

**Required API Keys:**

1. **AssemblyAI API Key** (Required for audio transcription):
   - Sign up at [https://www.assemblyai.com/](https://www.assemblyai.com/)
   - Get your free API key from the dashboard
   - Add to `.env`: `ASSEMBLYAI_API_KEY=your_key_here`

2. **OpenAI API Key** (Optional for enhanced LLM analysis):
   - Sign up at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Get your API key (requires payment setup)
   - Add to `.env`: `OPENAI_API_KEY=your_key_here`

**⚠️ Note**: Without the AssemblyAI API key, audio recording features won't work, but text-based sentiment analysis will still function perfectly.

### 4. Launch the Application

```bash
# Using make (recommended)
make run-web

# Or using main entry point
python3 main.py web

# Or using direct script
python3 scripts/run_web.py
```

### 5. Open in Browser

Navigate to: `http://localhost:8080`

## 🎮 How to Use

1. **🏠 Landing Page**: Learn about the project and its emotional categories
2. **🎤 Main App** (`/app`): 
   - Click the record button to capture your voice
   - Speak naturally about your emotions (up to 44 seconds)
   - Watch as AI analyzes your speech and creates emotion blobs
   - Interact with the visualization - blobs respond to mouse movement
   - Use the side panel to filter emotions by category
3. **📊 Statistics** (`/stats`): View your emotional journey over time
4. **ℹ️ Info** (`/info`): Detailed information about the technology

## 🏗️ Project Architecture

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
│   └── 📁 cli/                     # Command-line interface
├── 📁 data/                        # Application data (gitignored)
│   ├── 📁 databases/               # SQLite databases
│   ├── 📁 recordings/              # Audio recordings
│   └── 📁 uploads/                 # File uploads
├── 📁 scripts/                     # Standalone scripts and utilities
├── 📁 tests/                       # Test suites
├── 📁 docs/                        # Documentation
├── 📄 main.py                      # Main entry point
├── 📄 setup.py                     # Package installation script
├── 📄 Makefile                     # Development automation
└── 📄 requirements.txt             # Python dependencies
```

**📖 See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed structure documentation.**

## 🔧 Technology Stack

### Backend
- **[Flask](https://flask.palletsprojects.com/)**: Web framework with WebSocket support
- **[AssemblyAI](https://www.assemblyai.com/)**: Speech-to-text transcription and speaker diarization
- **[Hugging Face Transformers](https://huggingface.co/transformers/)**: AI model library
  - **Model Used**: [`j-hartmann/emotion-english-distilroberta-base`](https://huggingface.co/j-hartmann/emotion-english-distilroberta-base) - DistilRoBERTa fine-tuned for emotion classification
- **[OpenAI GPT](https://openai.com/api/)**: Advanced emotional understanding and reasoning
- **[SQLAlchemy](https://www.sqlalchemy.org/)**: Database ORM
- **SQLite**: Local data storage

### Frontend
- **Vanilla JavaScript**: Core application logic
- **[P5.js](https://p5js.org/)**: Creative coding and emotion blob visualizations
- **Canvas 2D API**: Background particle effects and gradients
- **[Anime.js](https://animejs.com/)**: Smooth animations and transitions
- **[Socket.IO](https://socket.io/)**: Real-time WebSocket communication
- **[WebAudio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)**: Microphone access and recording

### AI & Analysis
- **Speaker Diarization**: Multi-speaker identification via AssemblyAI
- **Emotion Classification**: 7-emotion model (anger, disgust, fear, joy, neutral, sadness, surprise)
- **Sentiment Scoring**: Custom hope/sorrow mapping algorithm
- **Confidence Scoring**: Analysis reliability metrics
- **Dual Analysis**: Transformer + LLM validation and cross-referencing

## 📚 Documentation

For detailed technical documentation and comprehensive guides, see the [`docs/`](docs/) directory:

- **[Documentation Index](docs/README.md)** - Complete documentation overview and navigation guide
- **[Technical Glossary](docs/GLOSSARY.md)** - Comprehensive guide to all terminology and concepts

## 🗄️ Database Schema

### Tables

**Speakers**: User identification and tracking
- `id`: Unique speaker identifier
- `name`: Speaker name/label
- `created_at`: First appearance
- `last_seen`: Most recent activity

**Transcriptions**: Speech-to-text results
- `id`: Unique transcription ID
- `speaker_id`: Reference to speaker
- `text`: Transcribed speech content
- `confidence`: Transcription accuracy
- `timestamp`: Recording time

**SentimentAnalyses**: Emotional analysis results
- `id`: Analysis identifier
- `transcription_id`: Reference to transcription
- `analyzer_type`: TRANSFORMER or LLM
- `category`: Emotion category (hope, sorrow, etc.)
- `label`: Specific emotion label
- `score`: Sentiment intensity (-1 to 1)
- `confidence`: Analysis confidence (0 to 1)
- `explanation`: AI reasoning (LLM only)

## 🎨 Visualization Features

### Emotion Blobs
- **Physics-based movement**: Blobs float with realistic physics
- **Mouse interaction**: Blobs are attracted to cursor movement
- **Color coding**: Each emotion category has distinct colors
- **Size variation**: Intensity affects blob size
- **Transparency**: Confidence affects opacity

### Real-time Effects
- **Recording waves**: Animated circles during voice capture
- **New blob highlights**: Temporary glow for fresh emotions
- **Pulse animations**: Record button feedback
- **Smooth transitions**: Anime.js powered animations

## 🔍 API Endpoints

- `GET /`: Landing page
- `GET /app`: Main application
- `GET /stats`: Analytics dashboard
- `GET /info`: Information page
- `GET /api/get_all_blobs`: Retrieve all emotion data
- `POST /upload_audio`: Process voice recordings
- `DELETE /api/clear_visualization`: Reset visualization

## 🧪 **Testing & Component Usage**

### 🔬 **Individual Component Testing**

The project supports testing individual components independently for research and development:

#### **CLI Sentiment Analysis**
```bash
# Interactive CLI mode for testing
python main.py cli

# Single text analysis
python scripts/analyze_sentiment.py --text "I feel hopeful about tomorrow"

# File-based batch analysis
python scripts/analyze_sentiment.py --file emotional_texts.txt

# Interactive testing mode
python scripts/analyze_sentiment.py --interactive
```

#### **Transformer-Only Analysis**
```python
from src.hopes_sorrows.analysis.sentiment import analyze_sentiment
result = analyze_sentiment("I will overcome these challenges")
# Fast, consistent emotion classification using DistilRoBERTa
```

#### **LLM-Enhanced Analysis** (Requires OpenAI API Key)
```python
from src.hopes_sorrows.analysis.sentiment import analyze_sentiment_llm
result = analyze_sentiment_llm("The situation is complex and bittersweet")
# Deeper contextual understanding with detailed explanations
```

#### **Combined Analysis** (Recommended)
```python
from src.hopes_sorrows.analysis.sentiment import analyze_sentiment_combined
result = analyze_sentiment_combined("I'm hopeful but also scared", use_llm=True)
# Best of both: transformer speed + LLM depth
```

#### **Audio Processing Pipeline**
```python
from src.hopes_sorrows.analysis.audio import analyze_audio
result = analyze_audio("path/to/recording.wav")
# Full pipeline: speech-to-text + sentiment analysis + speaker ID
```

### 🌐 **Web Application Modes**

#### **Development Server**
```bash
# Full development mode with hot reload
python scripts/run_web.py

# Alternative: Flask CLI
export FLASK_APP=src.hopes_sorrows.web.api.app
export FLASK_ENV=development
flask run --debug
```

#### **Production Deployment**
```bash
# Using Gunicorn WSGI server
gunicorn -w 4 -b 0.0.0.0:8000 src.hopes_sorrows.web.api.app:app

# With WebSocket support (recommended)
gunicorn -w 1 -k eventlet -b 0.0.0.0:8000 src.hopes_sorrows.web.api.app:app
```

### 🗄️ **Database Management**
```bash
# Initialize database schema
python scripts/setup_db.py

# Clear duplicate emotional blobs
python scripts/clear_duplicate_blobs.py

# Manual database inspection
sqlite3 data/databases/hopes_sorrows.db
```

### 🧪 **Test Suite**
```bash
# Run all tests
python -m pytest tests/

# Run specific test categories
python -m pytest tests/test_classification.py
python -m pytest tests/ -v  # Verbose output
```

## 🛠️ Development

### Running in Development Mode

```bash
# Use the dedicated script (port 8080)
python3 scripts/run_web.py

# Or use the main entry point
python3 main.py web
```

### Environment Variables

```bash
FLASK_ENV=development          # Enable debug mode
ASSEMBLYAI_API_KEY=required    # Speech transcription
OPENAI_API_KEY=optional        # Enhanced LLM analysis
```

### Testing

The application includes diagnostic tools:
- `/diagnostic`: System health checks
- `/debug`: Visualization debugging
- Browser console: Detailed logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[AssemblyAI](https://www.assemblyai.com/)**: Speech-to-text transcription and speaker diarization
- **[Hugging Face](https://huggingface.co/)**: Transformer models and AI infrastructure
- **[j-hartmann](https://huggingface.co/j-hartmann)**: Creator of the emotion classification model
- **[OpenAI](https://openai.com/)**: GPT-based sentiment analysis and reasoning
- **[P5.js Community](https://p5js.org/community/)**: Creative coding framework and inspiration
- **[Anime.js](https://animejs.com/)**: Smooth animation library
- **[Flask Community](https://flask.palletsprojects.com/)**: Web framework and ecosystem

## 🆘 Troubleshooting

### Common Issues

**"python command not found"**
```bash
# Use python3 instead
python3 scripts/run_web.py
```

**Microphone not working**
- Ensure browser has microphone permissions
- Check system audio settings
- Try a different browser (Chrome recommended)

**API Key errors**
- Verify `.env` file exists in project root
- Check API key format and validity
- Restart Flask server after adding keys

**Database errors**
```bash
# Reinitialize database
python3 -c "from database.db_manager import DatabaseManager; DatabaseManager().init_db()"
```

For more help, check the diagnostic page at `/diagnostic` when the server is running.

---

**Transform your voice into art. Discover the emotions within.** 🎭✨ 