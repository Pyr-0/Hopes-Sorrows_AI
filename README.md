# Audio Analysis Project

This project provides functionality for recording audio, transcribing it with speaker identification, and performing sentiment analysis using multiple methods.

## Features

- Audio recording with customizable duration
- Speaker identification and tracking across recordings
- Transcription using AssemblyAI
- Sentiment analysis using:
  - LLM-based analysis
  - Transformer-based analysis
- SQLite database storage for:
  - Speaker information
  - Transcriptions
  - Sentiment analysis results

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your AssemblyAI API key:
```bash
export ASSEMBLYAI_API_KEY='your-api-key-here'
```

3. Initialize the database:
```bash
python -c "from database.db_manager import DatabaseManager; DatabaseManager().init_db()"
```

## Usage

Run the main script:
```bash
python audio_analysis/assembyai.py
```

The script will:
1. Record audio (default 7 seconds)
2. Transcribe the audio with speaker identification
3. Perform sentiment analysis
4. Store results in the database

## Project Structure

```
Final_Project/
├── audio_analysis/
│   ├── assembyai.py      # Main script
│   ├── recordings/       # Audio recordings directory
│   └── sentiment_analysis/
│       ├── llm_analyzer.py
│       └── transformer_analyzer.py
├── database/
│   ├── models.py         # Database models
│   └── db_manager.py     # Database operations
└── requirements.txt      # Project dependencies
```

## Database Schema

- **Speaker**: Stores speaker information
  - id: Unique speaker identifier
  - name: Speaker name
  - created_at: First appearance timestamp
  - last_seen: Last appearance timestamp

- **Transcription**: Stores transcription data
  - id: Unique identifier
  - speaker_id: Reference to Speaker
  - text: Transcribed text
  - timestamp: Recording timestamp
  - confidence: Transcription confidence score

- **SentimentAnalysis**: Stores sentiment analysis results
  - id: Unique identifier
  - transcription_id: Reference to Transcription
  - analyzer_type: Type of analysis (LLM or TRANSFORMER)
  - label: Sentiment label
  - score: Sentiment score
  - confidence: Analysis confidence
  - explanation: Optional explanation

## Notes

- Audio recordings are stored in the `recordings/` directory
- The database file is `sentiment_analysis.db`
- Speaker identification is maintained across recordings
- Both LLM and transformer-based sentiment analysis are performed for each transcription 