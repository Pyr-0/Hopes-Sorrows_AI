# 🎭 Hopes & Sorrows Technical Glossary

*Last Updated: December 2024*

This comprehensive glossary defines all technical terms, concepts, and components used in the Hopes & Sorrows emotion analysis project.

---

## 🤖 **AI & Machine Learning Terms**

### **Advanced Emotion Classification**
- **Definition**: Multi-layered AI system that combines transformer models with rule-based patterns to classify emotions into 5 meaningful categories
- **Components**: DistilRoBERTa model + custom pattern matching + contextual analysis
- **Output**: Category (hope/sorrow/transformative/ambivalent/reflective_neutral) with confidence scores

### **AssemblyAI**
- **Definition**: Speech recognition service that converts audio to text with speaker identification
- **Usage**: Real-time audio transcription with speaker diarization and confidence scoring
- **Features**: Multi-speaker detection, punctuation, and timestamp alignment

### **Combined Analysis**
- **Definition**: Hybrid approach that merges Transformer and LLM analysis results for improved accuracy
- **Strategies**: Weighted average, highest confidence, consensus, or primary source selection
- **Benefits**: Combines speed of transformers with depth of LLM reasoning

### **Confidence Score**
- **Definition**: AI certainty metric (0.0 to 1.0) indicating how confident the system is about its classification
- **Usage**: Higher confidence = more reliable prediction; used for weighting in combined analysis
- **Calculation**: Based on model softmax probabilities and classification pattern matching

### **DistilRoBERTa**
- **Full Name**: Distilled Robustly Optimized BERT Pretraining Approach
- **Model**: `j-hartmann/emotion-english-distilroberta-base`
- **Function**: Transformer model that classifies text into 7 emotions (anger, disgust, fear, joy, neutral, sadness, surprise)
- **Performance**: Faster inference while maintaining high accuracy through knowledge distillation

### **Emotion Mapping**
- **Definition**: Process of converting 7-emotion model output to 5 meaningful psychological categories
- **Mapping**: joy→hope, sadness→sorrow, anger/fear→transformative, mixed→ambivalent, neutral→reflective
- **Purpose**: Creates psychologically coherent categories that better represent human emotional experience

### **Intensity Score**
- **Definition**: Absolute emotional strength (0.0 to 1.0) regardless of positive/negative polarity
- **Calculation**: `abs(sentiment_score)` or maximum emotion probability from transformer
- **Usage**: Determines blob size and visual prominence in the visualization

### **LLM (Large Language Model)**
- **Model**: OpenAI GPT-4 or GPT-3.5-turbo
- **Function**: Provides deeper contextual understanding and nuanced emotion analysis
- **Output**: JSON-structured sentiment analysis with detailed explanations
- **Advantages**: Better handling of complex emotions, sarcasm, and cultural context

### **Pattern Matching**
- **Definition**: Rule-based system that identifies specific linguistic patterns associated with emotions
- **Types**: Keyword patterns, phrase structures, sentiment indicators, and contextual cues
- **Integration**: Combined with ML models to improve classification accuracy and provide explanations

### **Sentiment Polarity**
- **Definition**: Emotional direction on a scale from -1.0 (very negative) to +1.0 (very positive)
- **Categories**: Very Negative (-1.0 to -0.6), Negative (-0.6 to -0.2), Neutral (-0.2 to 0.2), Positive (0.2 to 0.6), Very Positive (0.6 to 1.0)
- **Usage**: Determines gravitational direction in blob physics (hope rises, sorrow falls)

### **Speaker Diarization**
- **Definition**: Process of segmenting audio by speaker identity ("who spoke when")
- **Technology**: AssemblyAI's neural network-based speaker identification
- **Output**: Speaker labels, confidence scores, and temporal boundaries for each utterance

---

## 🫧 **Social Physics & Blob Dynamics**

### **Blob Mass**
- **Definition**: Physics property that determines collision inertia and gravitational response
- **Calculation**: `(size ÷ 10) + intensity × 2 + |score| × 1.5`
- **Range**: 1.6 to 9.5 units
- **Effect**: Heavier blobs are harder to move but have more impact in collisions

### **Boundary Forces**
- **Definition**: Physics system that keeps blobs within screen boundaries using gentle repulsion
- **Components**: Edge forces, corner repulsion zones, emergency teleportation for stuck blobs
- **Strength**: Exponentially increases as blobs approach edges; stronger for smaller blobs
- **Purpose**: Maintains visibility while preventing hard boundary collisions

### **Collision Detection**
- **Algorithm**: Circle-to-circle intersection testing with radius-based hit detection
- **Optimization**: Forward-iteration pairs (i,j where j > i) to avoid duplicate checks
- **Response**: Elastic collision with mass-based impulse calculation and overlap separation
- **Performance**: O(n²) complexity optimized with early exits for invisible blobs

### **Emergency Teleportation**
- **Definition**: Safety mechanism that relocates completely stuck blobs to safe areas
- **Trigger**: Blob remains motionless (<0.05 velocity) in corner danger zone for >60 frames
- **Destination**: Random position within safe zone (25%-75% screen width, 30%-70% height)
- **Recovery**: Applies random velocity kick to restart movement

### **Gravitational Forces**
- **Definition**: Emotional polarity affects vertical movement direction
- **Hope**: Positive sentiment score causes upward drift (anti-gravity effect)
- **Sorrow**: Negative sentiment score causes downward drift (gravity amplification)
- **Strength**: Proportional to `score × gravity × mass` with adjustable gravity constant
- **Realism**: Simulates psychological tendency of hope to "lift spirits" and sorrow to "weigh down"

### **Hit Radius Enhancement**
- **Definition**: Enlarged interaction zones for easier blob clicking and selection
- **Calculation**: `max(blob.size × 3, 40px)` minimum 40px radius
- **Purpose**: Improves user experience on touch devices and small screens
- **Visual**: Invisible - only affects click detection, not visual appearance

### **Nudge System**
- **Definition**: Click-based force application that helps unstick clustered blobs
- **Radius**: 200px effect zone around click location
- **Force**: Exponentially stronger for closer and smaller blobs
- **Randomization**: Adds chaotic elements to break perfect symmetry
- **Recovery**: Special handling for corner-trapped blobs with center-pulling forces

### **Physics Constants**
```javascript
gravity: 0.002          // Emotional polarity effect strength
friction: 0.998         // Movement damping factor
repulsionForce: 0.1     // Collision separation strength
attractionForce: 0.02   // Social interaction strength
collisionDamping: 0.3   // Bounce reduction factor
```

### **Social Forces**
- **Definition**: Emotion-based attraction/repulsion between blobs simulating psychological compatibility
- **Range**: 100px interaction radius (reduced from 120px to prevent clustering)
- **Calculation**: `(blob.socialTendency + other.socialTendency) × 0.008 × distanceForce`
- **Falloff**: Inverse square law with safety offset: `1 / (distance² + 1)`

### **Social Tendencies**
- **Hope**: 0.7 (seeks companionship, creates positive social energy)
- **Transformative**: 0.5 (moderate social interaction, focused energy)
- **Ambivalent**: 0.1 (uncertain about social contact, hesitant movement)
- **Reflective**: -0.1 (prefers contemplative solitude)
- **Sorrow**: -0.3 (seeks gentle comfort but maintains distance)

### **Velocity Limiting**
- **Definition**: Maximum speed constraints to prevent runaway acceleration
- **Implementation**: Vector normalization when speed exceeds `maxSpeed`
- **Default Limit**: 1.0 pixels per frame for ultra-calm movement
- **Purpose**: Maintains serene, contemplative visualization atmosphere

### **Wave Propagation**
- **Definition**: Collective blob response when new emotions are added to the visualization
- **Range**: 250px radius from new blob spawn location (reduced from 300px)
- **Force**: `(250 - distance) / 250 × 0.8` radial push strength (reduced from 2.0)
- **Effect**: Creates realistic "splash" effect and provides space for new blob

---

## 🎨 **Visualization & UI Terms**

### **Blob Size Calculation**
- **Formula**: `10 + intensity×12 + confidence×6 + |score|×8`
- **Hierarchy**: Intensity > Confidence > Absolute Score Value
- **Range**: 8px to 30px for optimal visual balance
- **Purpose**: Larger blobs represent stronger, more certain emotions

### **Canvas Rendering**
- **Technology**: P5.js creative coding framework with HTML5 Canvas
- **Performance**: 60 FPS target with requestAnimationFrame optimization
- **Effects**: Radial gradients, glow effects, transparency blending, and real-time physics
- **Responsiveness**: Dynamic canvas resizing and mobile touch support

### **Color Palette**
```css
Hope: #FFD93D (warm golden yellow)
Sorrow: #6B73FF (soft calming blue)  
Transformative: #FF9500 (energetic orange)
Ambivalent: #CC8BDB (complex purple-pink)
Reflective: #95A5A6 (neutral contemplative gray)
```

### **Glow Effects**
- **Outer Glow**: 2.5× blob size with 12% opacity for ambient light
- **Middle Glow**: 1.8× blob size with 25% opacity for soft illumination
- **Inner Gradient**: Radial gradient with light source simulation for 3D volume effect
- **Core Highlight**: Offset highlight to simulate directional lighting

### **Opacity Management**
- **Visibility Control**: Smooth transitions (0.0 to 1.0) for category filtering
- **Animation**: 10% per frame opacity change for smooth fade in/out
- **Threshold**: Blobs with opacity ≤ 0.01 skip physics calculations for performance

### **Responsive Design**
- **Desktop**: Full-featured interaction with hover effects and detailed tooltips
- **Tablet**: Touch-optimized with enlarged hit areas and gesture support
- **Mobile**: Simplified interface with essential controls and optimized performance

### **Ripple Effects**
- **Blob Interaction**: White ripples (100px max radius, 2px stroke) for successful blob clicks
- **Canvas Clicks**: Aquamarine ripples (80px max radius, 1px stroke) for general interaction
- **Duration**: 1 second expansion with opacity fade from 100% to 0%
- **Purpose**: Visual feedback confirming user interactions

---

## 🔧 **Technical Architecture**

### **API Endpoints**
```
GET  /                    - Landing page
GET  /app                 - Main emotion visualization application
GET  /info                - Information and documentation page
GET  /stats               - Statistics dashboard
GET  /api/get_all_blobs   - Retrieve all emotion blobs from database
POST /upload_audio        - Process audio recording and return analysis
POST /api/clear_visualization - Reset visualization state
```

### **Backend Stack**
- **Framework**: Flask 2.x with Gunicorn WSGI server
- **Database**: SQLite with SQLAlchemy ORM for development; PostgreSQL for production
- **Real-time**: Flask-SocketIO for WebSocket communication
- **AI Services**: Hugging Face Transformers, OpenAI API, AssemblyAI API
- **Audio Processing**: Pydub, NumPy for audio manipulation and analysis

### **CLI Tools**
```bash
# Individual component testing
python main.py cli              # Interactive sentiment analysis CLI
python scripts/analyze_sentiment.py --text "sample text"  # Single text analysis
python scripts/analyze_sentiment.py --interactive         # Interactive mode
python scripts/run_web.py                                # Start web server
python scripts/setup_db.py                               # Initialize database
python scripts/clear_duplicate_blobs.py                  # Clean duplicate data
```

### **Database Schema**
- **Transcriptions**: Audio metadata, speaker info, timestamps
- **SentimentAnalysis**: Analysis results with scores, categories, confidence
- **Relationships**: Foreign key linking transcriptions to their analyses
- **Indexes**: Optimized for timestamp and category-based queries

### **Frontend Stack**
- **Core**: Vanilla JavaScript ES6+ with modern async/await patterns
- **Visualization**: P5.js for real-time physics simulation and rendering
- **Animation**: Anime.js for smooth UI transitions and effects
- **Audio**: Web Audio API for browser-based recording and processing
- **Styling**: CSS3 with custom properties, Grid, Flexbox, and backdrop filters

### **Real-time Communication**
- **Technology**: WebSocket via Flask-SocketIO
- **Events**: Recording progress, analysis completion, blob updates, error handling
- **Fallback**: HTTP polling for unsupported environments
- **Reliability**: Automatic reconnection and state synchronization

---

## 📊 **Analysis & Classification**

### **Emotion Categories**

#### **Hope**
- **Definition**: Positive, forward-looking emotions focused on future possibilities
- **Indicators**: Future-tense language, achievement goals, optimistic outlook
- **Examples**: "I will succeed", "Tomorrow will be better", "I can overcome this"
- **Color**: Golden yellow (#FFD93D)
- **Physics**: Upward gravitational tendency, high social attraction

#### **Sorrow** 
- **Definition**: Sadness, grief, loss, and melancholic emotions
- **Indicators**: Past-tense regret, loss language, emotional pain expressions
- **Examples**: "I lost everything", "It's too late", "I miss what we had"
- **Color**: Soft blue (#6B73FF)
- **Physics**: Downward gravitational pull, seeks gentle comfort

#### **Transformative**
- **Definition**: Growth, change, learning, and overcoming challenges
- **Indicators**: Change language, learning expressions, resilience themes
- **Examples**: "I learned from this", "I'm growing stronger", "This changed me"
- **Color**: Energetic orange (#FF9500)
- **Physics**: High energy movement, moderate social interaction

#### **Ambivalent**
- **Definition**: Mixed, conflicted, or uncertain emotions
- **Indicators**: Contradictory statements, uncertainty expressions, complex feelings
- **Examples**: "I'm happy but scared", "I don't know how to feel", "It's complicated"
- **Color**: Complex purple-pink (#CC8BDB)
- **Physics**: Unpredictable movement, minimal social tendency

#### **Reflective Neutral**
- **Definition**: Contemplative, thoughtful, or emotionally neutral states
- **Indicators**: Analytical language, objective observations, calm reflection
- **Examples**: "I think about this", "This makes me wonder", "It's interesting"
- **Color**: Contemplative gray (#95A5A6)
- **Physics**: Stable movement, prefers solitude

### **Scoring System**
- **Sentiment Score**: Polarity from -1.0 (very negative) to +1.0 (very positive)
- **Intensity Score**: Emotional strength from 0.0 (neutral) to 1.0 (very intense)
- **Confidence Score**: AI certainty from 0.0 (uncertain) to 1.0 (very confident)
- **Category Mapping**: Multi-factor decision combining score, patterns, and context

---

## 🧪 **Testing & Development**

### **CLI Testing Modes**
```bash
# Component testing
python main.py cli                    # Interactive sentiment analysis
python -m pytest tests/              # Run test suite
python scripts/analyze_sentiment.py -t "text"  # Single analysis
python scripts/analyze_sentiment.py -f file.txt # File analysis
python scripts/analyze_sentiment.py -i          # Interactive mode
```

### **Development Tools**
- **Hot Reload**: Flask development server with auto-restart
- **Debugging**: Rich console output with color coding and progress bars
- **Profiling**: Performance monitoring for AI model inference
- **Error Handling**: Comprehensive exception catching with user-friendly messages

### **Testing Categories**
- **Unit Tests**: Individual component testing (transformers, LLM, classification)
- **Integration Tests**: Combined analysis workflows and API endpoints
- **Performance Tests**: Model inference speed and memory usage
- **UI Tests**: Browser automation for visualization functionality

---

## 🛠 **Configuration & Setup**

### **Environment Variables**
```bash
OPENAI_API_KEY          # GPT model access (optional)
ASSEMBLYAI_API_KEY      # Speech recognition service  
FLASK_ENV               # development/production mode
DATABASE_URL            # Database connection string
SECRET_KEY              # Flask session security
```

### **Model Configuration**
```python
SENTIMENT_MODEL = "j-hartmann/emotion-english-distilroberta-base"
LLM_MODEL = "gpt-4-turbo-preview"
SENTIMENT_THRESHOLD_HOPE = 0.15      # Hope classification threshold
SENTIMENT_THRESHOLD_SORROW = -0.15   # Sorrow classification threshold
LOW_CONFIDENCE = 0.7                 # Confidence threshold for neutral fallback
```

### **Performance Tuning**
- **Model Caching**: Singleton pattern for transformer models to avoid reload
- **Batch Processing**: Group analysis requests for efficiency
- **Memory Management**: Automatic cleanup of large audio files
- **GPU Acceleration**: CUDA support for transformer models when available

---

## 🎯 **Usage Patterns**

### **Web Application Flow**
1. **Record Audio**: Browser captures up to 44 seconds of speech
2. **Transcription**: AssemblyAI converts speech to text with speaker identification
3. **Analysis**: Combined transformer + LLM sentiment analysis
4. **Classification**: Advanced emotion categorization with pattern matching
5. **Visualization**: Real-time blob physics simulation with social dynamics
6. **Interaction**: Click, drag, and filter emotions with smooth animations

### **CLI Analysis Flow**
1. **Input**: Text file, direct input, or interactive mode
2. **Processing**: Choice of transformer-only, LLM-only, or combined analysis
3. **Output**: Formatted results with detailed explanations and confidence scores
4. **Export**: JSON output option for integration with other tools

### **API Integration Flow**
1. **Authentication**: API key validation for external services
2. **Request**: JSON payload with text and optional metadata
3. **Processing**: Async analysis with progress callbacks
4. **Response**: Structured JSON with all analysis results and metadata
5. **Webhooks**: Optional callback URLs for long-running analyses

---

*This glossary is continuously updated as the project evolves. For the latest technical details, refer to the source code and documentation.* 