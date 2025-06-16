# 📚 Documentation Index

Welcome to the Hopes & Sorrows project documentation! This directory contains comprehensive documentation for understanding and working with our interactive emotional voice analysis system.

## 📖 Available Documentation

### **Core Documentation**
- **[GLOSSARY.md](GLOSSARY.md)** - Comprehensive technical glossary explaining all terminology, concepts, and jargon used in the project

### **Project Documentation**
- **[Main README.md](../README.md)** - Complete project overview, installation guide, usage instructions, and technology stack
- **[LICENSE](../LICENSE)** - MIT License terms and conditions
- **[requirements.txt](../requirements.txt)** - Python dependencies and versions

## 🎯 Documentation by Audience

### **For New Users**
1. **Start here**: [Main README.md](../README.md) - Get the big picture and quick start guide
2. **Understand the tech**: [GLOSSARY.md](GLOSSARY.md) - Learn the terminology and concepts
3. **Try the app**: Follow the installation guide in the main README

### **For Developers**
1. **Project setup**: [Main README.md](../README.md#-quick-start) - Installation and development setup
2. **Architecture**: [Main README.md](../README.md#-project-architecture) - System architecture and file structure
3. **Technical terms**: [GLOSSARY.md](GLOSSARY.md) - Deep dive into technical concepts
4. **Dependencies**: [requirements.txt](../requirements.txt) - Required packages and versions

### **For Contributors**
1. **Project overview**: [Main README.md](../README.md) - Understanding the project goals and features
2. **Technical foundation**: [GLOSSARY.md](GLOSSARY.md) - Master the terminology and concepts
3. **Development guide**: [Main README.md](../README.md#-development) - Development workflow
4. **Legal info**: [LICENSE](../LICENSE) - Contribution terms under MIT License

## 🔧 Key Features Documented

### **Emotion Analysis System**
- **Real-time Voice Recording**: Up to 44 seconds of emotional expression capture
- **Advanced AI Analysis**: Dual sentiment analysis using DistilRoBERTa transformer and LLM
- **Emotion Classification**: 7-emotion model mapped to 5 meaningful categories
- **Speaker Identification**: Multi-speaker tracking across sessions
- **Confidence Scoring**: Analysis reliability metrics and validation

### **Interactive Visualizations**
- **Emotion Blobs**: Physics-based floating particles representing emotional utterances
- **Real-time Rendering**: P5.js-powered dynamic visualizations with 60fps animation
- **Mouse Interaction**: Blobs respond to cursor movement with attraction physics
- **Category Filtering**: Show/hide specific emotion groups via slide-in control panel
- **Visual Feedback**: Recording waves, pulse animations, and smooth transitions

### **Technical Architecture**
- **Backend**: Python Flask with WebSocket support for real-time communication
- **AI/ML**: Hugging Face Transformers, AssemblyAI speech recognition, OpenAI GPT
- **Frontend**: Vanilla JavaScript, P5.js, Canvas 2D, Anime.js animations
- **Database**: SQLite with SQLAlchemy ORM for persistent data storage
- **APIs**: RESTful endpoints and WebSocket for real-time updates

## 📁 Project Structure

```
Hopes & Sorrows/
├── docs/                           # This documentation directory
│   ├── README.md                   # This documentation index
│   └── GLOSSARY.md                 # Technical glossary
├── webui/                          # Web application interface
│   ├── app.py                      # Flask server & API endpoints
│   ├── templates/                  # HTML templates
│   │   ├── landing.html           # Project landing page
│   │   ├── app.html               # Main emotion analysis app
│   │   ├── stats.html             # Analytics dashboard
│   │   ├── info.html              # Technology information
│   │   └── diagnostic.html        # System diagnostics
│   └── static/                     # Frontend assets
│       ├── css/main.css           # Application styling
│       └── js/                    # JavaScript modules
│           ├── app.js             # Main application logic
│           ├── emotion-visualizer.js  # Background visualization
│           ├── blob-visualizer.js     # Emotion blob system
│           ├── audio-recorder.js      # Recording functionality
│           └── stats.js               # Analytics dashboard
├── sentiment_analysis/             # AI analysis engines
│   ├── sa_transformers.py         # Transformer-based emotion analysis
│   ├── sa_LLM.py                  # LLM-based sentiment analysis
│   └── advanced_classifier.py     # Enhanced emotion classification
├── audio_analysis/                 # Audio processing components
│   └── assembyai.py               # Speech-to-text & speaker diarization
├── database/                       # Data persistence layer
│   ├── models.py                  # SQLAlchemy database schema
│   └── db_manager.py              # Database operations & management
├── tests/                         # Test suites and validation
├── README.md                      # Main project documentation
├── requirements.txt               # Python dependencies
├── sentiment_analysis.db          # SQLite database file
├── .gitignore                     # Git ignore patterns
└── LICENSE                        # MIT License
```

## 🚀 Quick Navigation

- **Want to try the app?** → [Main README.md](../README.md#-quick-start)
- **Need to install?** → [Main README.md](../README.md#1-clone-and-setup)
- **Curious about the tech?** → [GLOSSARY.md](GLOSSARY.md)
- **Looking for API docs?** → [Main README.md](../README.md#-api-endpoints)
- **Want to contribute?** → [Main README.md](../README.md#-contributing)
- **Having issues?** → [Main README.md](../README.md#-troubleshooting)

## 🎭 Emotion Categories Explained

The system classifies emotions into five meaningful categories:

| Category | Color | Emotions | Description |
|----------|-------|----------|-------------|
| **💚 Hope** | Green | Joy, optimism, excitement, love, gratitude | Positive, uplifting emotions |
| **💙 Sorrow** | Blue | Sadness, grief, disappointment, loneliness | Melancholic, reflective emotions |
| **🟡 Transformative** | Yellow | Anger, determination, breakthrough moments | Change-driving emotions |
| **🟠 Ambivalent** | Orange | Mixed emotions, uncertainty, complexity | Complex emotional states |
| **⚪ Reflective** | White | Contemplation, neutrality, thoughtfulness | Neutral, contemplative states |

## 🔄 Documentation Status

| Document | Status | Description | Last Updated |
|----------|--------|-------------|--------------|
| Main README.md | ✅ Complete | Project overview, installation, usage | December 2024 |
| GLOSSARY.md | ✅ Complete | Technical terminology and concepts | December 2024 |
| API Documentation | 📋 Embedded | Available in main README | December 2024 |
| User Tutorials | 📋 Embedded | Usage guide in main README | December 2024 |
| Development Guide | 📋 Embedded | Development info in main README | December 2024 |

## 💡 Contributing to Documentation

Found something unclear or missing? We welcome documentation improvements!

1. **For typos/small fixes**: Edit directly and submit a pull request
2. **For new sections**: Open an issue to discuss the addition first
3. **For technical accuracy**: Please test any code examples before submitting
4. **For glossary terms**: Add new terms with clear, beginner-friendly explanations

### Documentation Standards
- Use clear, accessible language
- Include code examples where helpful
- Provide links to external resources
- Maintain consistent formatting and structure
- Test all instructions and code snippets

## 🔗 External Resources

### Learning Resources
- **[Flask Documentation](https://flask.palletsprojects.com/)** - Web framework
- **[P5.js Reference](https://p5js.org/reference/)** - Creative coding library
- **[AssemblyAI Docs](https://www.assemblyai.com/docs/)** - Speech recognition API
- **[Hugging Face Transformers](https://huggingface.co/docs/transformers/)** - AI model library
- **[Anime.js Documentation](https://animejs.com/documentation/)** - Animation library

### AI & Machine Learning
- **[DistilRoBERTa Model](https://huggingface.co/j-hartmann/emotion-english-distilroberta-base)** - Emotion classification model
- **[OpenAI API](https://openai.com/api/)** - GPT-based analysis
- **[Emotion AI Overview](https://www.assemblyai.com/blog/what-is-emotion-ai/)** - Understanding emotion detection

---

*This documentation index is maintained to help everyone understand and contribute to the Hopes & Sorrows emotional voice analysis project. Transform your voice into art. Discover the emotions within.* 🎭✨

**Last Updated**: December 2024  
**Maintainer**: Hopes & Sorrows Development Team 