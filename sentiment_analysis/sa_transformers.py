import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from enum import Enum
from typing import Dict, Optional, List
from .advanced_classifier import AdvancedHopeSorrowClassifier, EmotionCategory, ClassificationResult
from .cli_formatter import format_sentiment_result, format_error

class SentimentLabel(Enum):
	VERY_POSITIVE = "very_positive"
	POSITIVE = "positive"
	NEUTRAL = "neutral"
	NEGATIVE = "negative"
	VERY_NEGATIVE = "very_negative"

class SentimentCategory(Enum):
	HOPE = "hope"
	SORROW = "sorrow"
	NEUTRAL = "neutral"

class Config:
	# Model configuration
	SENTIMENT_MODEL = "j-hartmann/emotion-english-distilroberta-base" # Emotion model - CORRECT for this use case
	# SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english" # Binary sentiment - too simplistic for hope/sorrow only trained for movie reviews 
	#SENTIMENT_MODEL = 'bhadresh-savani/distilbert-base-uncased-emotion' # Not so acurate
	#SENTIMENT_MODEL = 'tabularisai/multilingual-sentiment-analysis' # needs a diff score system
	#SENTIMENT_MODEL = 'nlptown/bert-base-multilingual-uncased-sentiment' # not so accurate
	
	# Updated thresholds for more accurate sentiment categorization
	SENTIMENT_THRESHOLD_HOPE = 0.2      # Lowered from 0.3
	SENTIMENT_THRESHOLD_SORROW = -0.1   # Raised from -0.2
	
	# Updated scoring thresholds for more nuanced sentiment analysis
	THRESHOLDS = {
		SentimentLabel.VERY_POSITIVE: 0.6,   # Lowered from 0.8
		SentimentLabel.POSITIVE: 0.2,        # Lowered from 0.3
		SentimentLabel.NEUTRAL: -0.1,        # Raised from -0.2
		SentimentLabel.NEGATIVE: -0.3,       # Raised from -0.5
		SentimentLabel.VERY_NEGATIVE: -0.6   # Raised from -0.8
	}
	
	# Confidence thresholds
	HIGH_CONFIDENCE = 0.8
	MEDIUM_CONFIDENCE = 0.6
	LOW_CONFIDENCE = 0.4

class SentimentAnalyzer:
	"""Enhanced class for analyzing sentiment in text."""
		
	def __init__(self, model_name=None):
		"""Initialize the sentiment analyzer with a pre-trained model."""
		self.model_name = model_name or Config.SENTIMENT_MODEL
		self.device = "cuda" if torch.cuda.is_available() else "cpu"
		
		print(f"Loading sentiment model: {self.model_name}")
		self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
		self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
		self.model.to(self.device)
		print(f"Model loaded successfully on {self.device}")
		
		# Initialize advanced classifier
		self.advanced_classifier = AdvancedHopeSorrowClassifier()
		
	def get_sentiment_label(self, score: float, confidence: float) -> str:
		"""Get sentiment label based on score and confidence."""
		if confidence < Config.LOW_CONFIDENCE:
			return SentimentLabel.NEUTRAL.value
			
		# Updated logic to better handle negative sentiments
		if score <= Config.THRESHOLDS[SentimentLabel.VERY_NEGATIVE]:
			return SentimentLabel.VERY_NEGATIVE.value
		elif score <= Config.THRESHOLDS[SentimentLabel.NEGATIVE]:
			return SentimentLabel.NEGATIVE.value
		elif score <= Config.THRESHOLDS[SentimentLabel.NEUTRAL]:
			return SentimentLabel.NEUTRAL.value
		elif score <= Config.THRESHOLDS[SentimentLabel.POSITIVE]:
			return SentimentLabel.POSITIVE.value
		else:
			return SentimentLabel.VERY_POSITIVE.value
		
	def get_sentiment_category(self, score):
		"""Map detailed sentiment to hope/sorrow category."""
		if score >= Config.SENTIMENT_THRESHOLD_HOPE:
			return SentimentCategory.HOPE.value
		elif score <= Config.SENTIMENT_THRESHOLD_SORROW:
			return SentimentCategory.SORROW.value
		else:
			return SentimentCategory.NEUTRAL.value
		
	def analyze(self, text: str, speaker_id: Optional[str] = None, context_window: Optional[List[str]] = None) -> Dict:
		"""
		Analyze the sentiment of the given text with enhanced scoring and classification.
		
		Args:
			text: The text to analyze
			speaker_id: Optional speaker identifier for personalized analysis
			context_window: Optional list of previous utterances for context
			
		Returns:
			dict: A dictionary containing sentiment analysis results
		"""
		# Handle empty text
		if not text or text.strip() == "":
			return {
				"score": 0.0,
				"label": SentimentLabel.NEUTRAL.value,
				"category": EmotionCategory.REFLECTIVE_NEUTRAL.value,
				"intensity": 0.0,
				"confidence": 0.0,
				"explanation": "Empty text provided."
			}
		
		# Prepare the text for the model
		inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
		inputs = {key: val.to(self.device) for key, val in inputs.items()}
		
		# Get model prediction
		with torch.no_grad():
			outputs = self.model(**inputs)
			
		# Convert logits to probabilities
		probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
		probs = probs.cpu().numpy()[0]
		
		# For j-hartmann/emotion-english-distilroberta-base:
		# The model outputs 7 emotions: [anger, disgust, fear, joy, neutral, sadness, surprise]
		# We need to map these to a sentiment score for hope/sorrow classification

		# Get emotion probabilities (indices based on model output)
		emotions = {
			'anger': probs[0],      # Index 0
			'disgust': probs[1],    # Index 1  
			'fear': probs[2],       # Index 2
			'joy': probs[3],        # Index 3
			'neutral': probs[4],    # Index 4
			'sadness': probs[5],    # Index 5
			'surprise': probs[6]    # Index 6
		}

		# Map emotions to sentiment score (-1 to 1 scale)
		# Positive emotions (lean toward hope): joy, surprise
		# Negative emotions (lean toward sorrow): anger, disgust, fear, sadness
		# Neutral: neutral

		positive_emotions = emotions['joy'] + emotions['surprise'] * 0.5  # Surprise can be positive or negative
		negative_emotions = emotions['anger'] + emotions['disgust'] + emotions['fear'] + emotions['sadness']
		neutral_emotion = emotions['neutral']

		# Calculate sentiment score: positive emotions minus negative emotions
		# Scale to -1 to 1 range considering neutral as baseline
		total_emotional = positive_emotions + negative_emotions
		if total_emotional > 0:
			score = (positive_emotions - negative_emotions) / (total_emotional + neutral_emotion)
		else:
			score = 0.0  # Pure neutral case

		# Calculate confidence as the maximum emotion probability (excluding neutral for more decisive classification)
		non_neutral_probs = [emotions[key] for key in emotions if key != 'neutral']
		confidence = float(max(non_neutral_probs) if non_neutral_probs else emotions['neutral'])
		
		# Get sentiment label
		label = self.get_sentiment_label(score, confidence)
		
		# Get advanced emotion classification
		classification = self.advanced_classifier.classify_emotion(
			text=text,
			sentiment_score=score,
			speaker_id=speaker_id or "unknown",
			context_window=context_window
		)
		
		# Calculate intensity (how strong the sentiment is)
		intensity = abs(score)
		
		# Return the analysis results
		return {
			"score": score,
			"label": label,
			"category": classification.category.value,
			"intensity": intensity,
			"confidence": confidence,
			"classification_confidence": classification.confidence,
			"matched_patterns": [
				{
					"pattern": pattern.description,
					"weight": weight,
					"category": pattern.category.value
				}
				for pattern, weight in classification.matched_patterns
			],
			"explanation": classification.explanation
		}

# Singleton pattern for efficient reuse
_sentiment_analyzer = None

def get_analyzer():
	"""Get or create a singleton instance of the sentiment analyzer."""
	global _sentiment_analyzer
	if _sentiment_analyzer is None:
		_sentiment_analyzer = SentimentAnalyzer()
	return _sentiment_analyzer

def reset_analyzer():
	"""Reset the singleton analyzer (useful for testing or model changes)."""
	global _sentiment_analyzer
	_sentiment_analyzer = None

def analyze_sentiment(text: str, speaker_id: Optional[str] = None, context_window: Optional[List[str]] = None, verbose: bool = True) -> Dict:
    """
    Analyze the sentiment of the given text using the singleton analyzer.
    
    Args:
        text: The text to analyze
        speaker_id: Optional speaker identifier for personalized analysis
        context_window: Optional list of previous utterances for context
        verbose: Whether to print formatted output (default: True)
    
    Returns:
        dict: Analysis results
    """
    try:
        analyzer = get_analyzer()
        result = analyzer.analyze(text, speaker_id, context_window)
        
        if verbose:
            format_sentiment_result(result)
        
        return result
    except Exception as e:
        if verbose:
            format_error(f"Error during sentiment analysis: {str(e)}")
        raise