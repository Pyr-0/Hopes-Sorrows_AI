import os
import json
import openai
from dotenv import load_dotenv
from enum import Enum
from typing import Dict, Optional, List
from .advanced_classifier import AdvancedHopeSorrowClassifier, EmotionCategory, ClassificationResult
from .cli_formatter import format_sentiment_result, format_error

# Load environment variables using centralized config
from ...core.config import get_config

config = get_config()
dotenv_path = config.get_dotenv_path()
load_dotenv(dotenv_path)

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
	# Default thresholds
	THRESHOLDS = {
		SentimentLabel.VERY_POSITIVE: 0.8,
		SentimentLabel.POSITIVE: 0.3,
		SentimentLabel.NEUTRAL: -0.2,
		SentimentLabel.NEGATIVE: -0.5,
		SentimentLabel.VERY_NEGATIVE: -0.8
	}
	
	# Original thresholds for hope/sorrow categorization
	SENTIMENT_THRESHOLD_HOPE = 0.3
	SENTIMENT_THRESHOLD_SORROW = -0.2
	
	# Confidence thresholds
	HIGH_CONFIDENCE = 0.8
	MEDIUM_CONFIDENCE = 0.6
	LOW_CONFIDENCE = 0.4
	
	# Default model to use
	LLM_MODEL = "gpt-4o-mini"  # More accurate model

class LLMSentimentAnalyzer:
	"""Enhanced class for analyzing sentiment in text using an LLM."""
		
	def __init__(self, api_key=None, model_name=None):
		"""Initialize the sentiment analyzer with OpenAI API."""
		self.api_key = api_key or os.getenv("OPENAI_API_KEY")
		if not self.api_key:
			self.api_key = input("Please enter your OpenAI API key: ")
		
		self.client = openai.OpenAI(api_key=self.api_key)
		self.model_name = model_name or Config.LLM_MODEL
		print(f"LLM Sentiment Analyzer initialized with model: {self.model_name}")
		
		# Initialize advanced classifier
		self.advanced_classifier = AdvancedHopeSorrowClassifier()
		
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
		Analyze the sentiment of the given text using an LLM with enhanced scoring and classification.

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
				"confidence": 0.9,
				"explanation": "Empty text provided."
			}
		
		# Create a detailed system prompt for consistent sentiment analysis
		system_prompt = """You are an expert sentiment analysis system. Analyze the provided text and return a JSON object with the following fields:
		- score: a float between -1.0 (extremely negative) and 1.0 (extremely positive)
		- label: one of "very_positive", "positive", "neutral", "negative", or "very_negative"
		- intensity: absolute value of the score (how strong the sentiment is)
		- confidence: your confidence in the analysis from 0.0 to 1.0
		- explanation: a detailed explanation of your reasoning (2-3 sentences)
		
		Consider the following factors in your analysis:
		1. Emotional intensity and strength
		2. Context and tone
		3. Word choice and language patterns
		4. Cultural and contextual nuances
		5. Mixed emotions and their balance
		
		Important: Return ONLY the JSON object with no other text."""
		
		# Make the API call
		try:
			response = self.client.chat.completions.create(
				model=self.model_name,
				messages=[
					{"role": "system", "content": system_prompt},
					{"role": "user", "content": f"Analyze the sentiment of this text: \"{text}\""}
				],
				temperature=0.3,  # Lower temperature for more consistent results
				response_format={"type": "json_object"}  # Ensure JSON response
			)
			
			# Extract and parse the JSON response
			result_json = response.choices[0].message.content
			result = json.loads(result_json)
			
			# Validate and normalize the result
			result = self._validate_and_normalize_result(result)
			
			# Get advanced emotion classification
			classification = self.advanced_classifier.classify_emotion(
				text=text,
				sentiment_score=result["score"],
				speaker_id=speaker_id or "unknown",
				context_window=context_window
			)
			
			# Add classification results
			result["category"] = classification.category.value
			result["classification_confidence"] = classification.confidence
			result["matched_patterns"] = [
				{
					"pattern": pattern.description,
					"weight": weight,
					"category": pattern.category.value
				}
				for pattern, weight in classification.matched_patterns
			]
			result["explanation"] = classification.explanation
			
			return result
			
		except Exception as e:
			print(f"Error during sentiment analysis: {e}")
			return {
				"score": 0.0,
				"label": SentimentLabel.NEUTRAL.value,
				"category": EmotionCategory.REFLECTIVE_NEUTRAL.value,
				"intensity": 0.0,
				"confidence": 0.0,
				"explanation": f"Analysis failed due to error: {str(e)}"
			}
	
	def _validate_and_normalize_result(self, result: Dict) -> Dict:
		"""Validate and normalize the sentiment analysis result."""
		# Ensure all required fields are present
		required_fields = ["score", "label", "intensity", "confidence", "explanation"]
		for field in required_fields:
			if field not in result:
				if field == "intensity" and "score" in result:
					result["intensity"] = abs(float(result["score"]))
				else:
					result[field] = 0.0 if field in ["score", "intensity", "confidence"] else "neutral" if field == "label" else "No explanation provided."
		
		# Normalize score to [-1, 1] range
		result["score"] = max(min(float(result["score"]), 1.0), -1.0)
		
		# Normalize confidence to [0, 1] range
		result["confidence"] = max(min(float(result["confidence"]), 1.0), 0.0)
		
		# Normalize intensity
		result["intensity"] = abs(result["score"])
		
		# Validate label
		valid_labels = [label.value for label in SentimentLabel]
		if result["label"] not in valid_labels:
			# Map score to appropriate label
			score = result["score"]
			if score >= Config.THRESHOLDS[SentimentLabel.VERY_POSITIVE]:
				result["label"] = SentimentLabel.VERY_POSITIVE.value
			elif score >= Config.THRESHOLDS[SentimentLabel.POSITIVE]:
				result["label"] = SentimentLabel.POSITIVE.value
			elif score >= Config.THRESHOLDS[SentimentLabel.NEUTRAL]:
				result["label"] = SentimentLabel.NEUTRAL.value
			elif score >= Config.THRESHOLDS[SentimentLabel.NEGATIVE]:
				result["label"] = SentimentLabel.NEGATIVE.value
			else:
				result["label"] = SentimentLabel.VERY_NEGATIVE.value
		
		return result

# Singleton pattern for efficient reuse
_llm_sentiment_analyzer = None

def get_analyzer(api_key=None):
	"""Get or create a singleton instance of the LLM sentiment analyzer."""
	global _llm_sentiment_analyzer
	if _llm_sentiment_analyzer is None:
		_llm_sentiment_analyzer = LLMSentimentAnalyzer(api_key=api_key)
	return _llm_sentiment_analyzer

def analyze_sentiment(text: str, speaker_id: Optional[str] = None, context_window: Optional[List[str]] = None, api_key: Optional[str] = None, verbose: bool = True) -> Dict:
	"""
	Analyze the sentiment of the given text using the singleton LLM analyzer.
	
	Args:
		text: The text to analyze
		speaker_id: Optional speaker identifier for personalized analysis
		context_window: Optional list of previous utterances for context
		api_key: Optional OpenAI API key
		verbose: Whether to print formatted output (default: True)
	
	Returns:
		dict: Analysis results
	"""
	try:
		analyzer = get_analyzer(api_key=api_key)
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
	
	# OpenAI API Key use
	api_key = os.getenv("OPENAI_API_KEY")
	analyzer = get_analyzer(api_key=api_key)
	
	for text in test_texts:
		print(f"\nAnalyzing: \"{text}\"")
		analyze_sentiment(text, verbose=True)