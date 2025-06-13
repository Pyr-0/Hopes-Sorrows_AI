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

### 3. Environment Setup

Create a `.env` file in the project root:

```bash
# Required: AssemblyAI API key for speech transcription
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Optional: OpenAI API key for enhanced LLM analysis
OPENAI_API_KEY=your_openai_api_key_here
```

**Get your free AssemblyAI API key**: [https://www.assemblyai.com/](https://www.assemblyai.com/)

### 4. Initialize Database

```bash
python3 -c "from database.db_manager import DatabaseManager; DatabaseManager().init_db()"
```

### 5. Launch the Application

```bash
python3 -m flask --app webui.app run --debug --host=0.0.0.0 --port=5000
```

### 6. Open in Browser

Navigate to: `http://localhost:5000`

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
AI/Final_Project/
├── webui/                          # Web application
│   ├── app.py                      # Flask server & API endpoints
│   ├── templates/                  # HTML templates
│   │   ├── landing.html           # Landing page
│   │   ├── app.html               # Main application
│   │   ├── stats.html             # Analytics dashboard
│   │   ├── info.html              # Information page
│   │   └── diagnostic.html        # System diagnostics
│   └── static/                     # Frontend assets
│       ├── css/main.css           # Styling
│       └── js/                    # JavaScript modules
│           ├── app.js             # Main application logic
│           ├── emotion-visualizer.js  # Background visualization
│           ├── blob-visualizer.js     # Emotion blob system
│           ├── audio-recorder.js      # Recording functionality
│           └── stats.js               # Analytics
├── sentiment_analysis/             # AI Analysis engines
│   ├── sa_transformers.py         # Transformer-based analysis
│   ├── sa_LLM.py                  # LLM-based analysis
│   └── advanced_classifier.py     # Enhanced classification
├── audio_analysis/                # Audio processing
│   └── assembyai.py               # Speech-to-text & analysis
├── database/                      # Data persistence
│   ├── models.py                  # Database schema
│   └── db_manager.py              # Database operations
└── requirements.txt               # Python dependencies
```

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

## 🛠️ Development

### Running in Development Mode

```bash
python3 -m flask --app webui.app run --debug --host=0.0.0.0 --port=5000
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
python3 -m flask --app webui.app run --debug --host=0.0.0.0 --port=5000
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