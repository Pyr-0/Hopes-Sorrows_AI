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
	#SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english" #Acurate in english trained with movie reviews
	SENTIMENT_MODEL = "j-hartmann/emotion-english-distilroberta-base" # Acurate english trained in emotions
	#SENTIMENT_MODEL = 'bhadresh-savani/distilbert-base-uncased-emotion' # Not so acurate
	#SENTIMENT_MODEL = 'tabularisai/multilingual-sentiment-analysis' # needs a diff score system
	#SENTIMENT_MODEL = 'nlptown/bert-base-multilingual-uncased-sentiment' # not so accurate
	
	# Original thresholds for hope/sorrow categorization
	SENTIMENT_THRESHOLD_HOPE = 0.3
	SENTIMENT_THRESHOLD_SORROW = -0.2
	
	# Scoring thresholds for more nuanced sentiment analysis
	THRESHOLDS = {
		SentimentLabel.VERY_POSITIVE: 0.8,  # Very positive emotions
		SentimentLabel.POSITIVE: 0.3,       # Positive emotions
		SentimentLabel.NEUTRAL: -0.2,       # Neutral emotions
		SentimentLabel.NEGATIVE: -0.5,      # Negative emotions
		SentimentLabel.VERY_NEGATIVE: -0.8  # Very negative emotions
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
			
		if score >= Config.THRESHOLDS[SentimentLabel.VERY_POSITIVE]:
			return SentimentLabel.VERY_POSITIVE.value
		elif score >= Config.THRESHOLDS[SentimentLabel.POSITIVE]:
			return SentimentLabel.POSITIVE.value
		elif score >= Config.THRESHOLDS[SentimentLabel.NEUTRAL]:
			return SentimentLabel.NEUTRAL.value
		elif score >= Config.THRESHOLDS[SentimentLabel.NEGATIVE]:
			return SentimentLabel.NEGATIVE.value
		else:
			return SentimentLabel.VERY_NEGATIVE.value
		
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
		
		# Calculate sentiment score (-1 to 1 scale)
		# DistilBERT outputs [negative, positive] probabilities
		negative_prob = probs[0]
		positive_prob = probs[1]
		
		# Map probabilities to sentiment score
		# If negative_prob > positive_prob, score should be negative
		# If positive_prob > negative_prob, score should be positive
		if negative_prob > positive_prob:
			score = -1.0 * (negative_prob - positive_prob)
		else:
			score = positive_prob - negative_prob
		
		# Calculate confidence
		confidence = float(max(probs))
		
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

# Main execution block for testing
if __name__ == "__main__":
    test_texts = [
        "I will achieve my dreams and make a better future for myself.",
        "I lost everything I worked for and it's all gone now.",
        "I was hurt, but I've learned to heal and move forward.",
        "I'm excited about the future but scared of what might happen.",
        "I'm thinking about what this experience means to me."
    ]
    
    analyzer = get_analyzer()
    for text in test_texts:
        print(f"\nAnalyzing: \"{text}\"")
        analyze_sentiment(text, verbose=True)