import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from enum import Enum

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
	SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english" #most acurate so far but only in English
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
		
	def get_sentiment_label(self, score, confidence):
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
		
	def analyze(self, text):
		"""
		Analyze the sentiment of the given text with enhanced scoring.
		
		Args:
			text (str): The text to analyze
			
		Returns:
			dict: A dictionary containing sentiment analysis results
		"""
		# Handle empty text
		if not text or text.strip() == "":
			return {
				"score": 0.0,
				"label": SentimentLabel.NEUTRAL.value,
				"category": SentimentCategory.NEUTRAL.value,
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
		score = float(probs[1] - probs[0])  # Mapped to [-1, 1]
		
		# Calculate confidence
		confidence = float(max(probs))
		
		# Get sentiment label and category
		label = self.get_sentiment_label(score, confidence)
		category = self.get_sentiment_category(score)
		
		# Calculate intensity (how strong the sentiment is)
		intensity = abs(score)
		
		# Generate explanation based on confidence and intensity
		if confidence < Config.LOW_CONFIDENCE:
			explanation = "Low confidence in sentiment analysis."
		elif intensity < 0.2:
			explanation = "Neutral sentiment detected."
		else:
			explanation = f"Strong {label} sentiment ({category}) detected with {confidence:.2f} confidence."
		
		# Return the analysis results
		return {
			"score": score,
			"label": label,
			"category": category,
			"intensity": intensity,
			"confidence": confidence,
			"explanation": explanation
		}

# Singleton pattern for efficient reuse
_sentiment_analyzer = None

def get_analyzer():
	"""Get or create a singleton instance of the sentiment analyzer."""
	global _sentiment_analyzer
	if _sentiment_analyzer is None:
		_sentiment_analyzer = SentimentAnalyzer()
	return _sentiment_analyzer

def analyze_sentiment(text):
	"""Analyze the sentiment of the given text using the singleton analyzer."""
	analyzer = get_analyzer()
	return analyzer.analyze(text)

# Main execution block for testing
if __name__ == "__main__":
	# Test cases
	test_texts = [
		"I am absolutely thrilled and overjoyed with the results!",
		"I'm quite happy with how things turned out.",
		"The weather is okay today.",
		"I'm a bit disappointed with the outcome.",
		"I'm absolutely devastated and heartbroken.",
		"I'm incredibly worried about the future",
		"Tengo miedo de que me va a decir mi profesor", 
		"Ich bin ganz zufrieden mit die ergebnise",
		"I find it so fucking ridiculous how this is working and it upsets me to think of the future",
		"not sure what to say, I mean, as if it were relevant to mention my hopes and sorrows anyways"
	]
		
	analyzer = get_analyzer()
	for text in test_texts:
		result = analyzer.analyze(text)
		print(f"\nText: {text}")
		print(f"Result: {result}")