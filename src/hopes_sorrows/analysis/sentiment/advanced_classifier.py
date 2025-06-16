import re
from enum import Enum
from typing import List, Dict, Optional, Tuple
import numpy as np
from dataclasses import dataclass
from datetime import datetime

class EmotionCategory(Enum):
	HOPE = "hope"
	SORROW = "sorrow"
	TRANSFORMATIVE = "transformative"
	AMBIVALENT = "ambivalent"
	REFLECTIVE_NEUTRAL = "reflective_neutral"

@dataclass
class LinguisticPattern:
	pattern: str
	weight: float
	category: EmotionCategory
	description: str

@dataclass
class ClassificationResult:
	category: EmotionCategory
	confidence: float
	score: float
	matched_patterns: List[Tuple[LinguisticPattern, float]]
	explanation: str
	timestamp: datetime

class AdvancedHopeSorrowClassifier:
	def __init__(self):
		self.hope_patterns = [
			LinguisticPattern(r"\b(happy|joy|delighted|thrilled|excited|elated)\b", 0.9, EmotionCategory.HOPE, "Explicit happiness"),
			LinguisticPattern(r"\b(will|going to|plan to|hope|dream|wish)\b", 0.8, EmotionCategory.HOPE, "Future-oriented language"),
			LinguisticPattern(r"\b(maybe|could|might|possibility|chance)\b", 0.6, EmotionCategory.HOPE, "Possibility language"),
			LinguisticPattern(r"\b(learn|grow|improve|better|progress)\b", 0.7, EmotionCategory.HOPE, "Growth language"),
			LinguisticPattern(r"\b(goal|ambition|vision|future|tomorrow)\b", 0.9, EmotionCategory.HOPE, "Aspiration words"),
			LinguisticPattern(r"\b(excited|thrilled|eager|looking forward|can't wait)\b", 0.8, EmotionCategory.HOPE, "Excitement indicators")
		]
		
		self.sorrow_patterns = [
			LinguisticPattern(r"\b(sad|depressed|miserable|unhappy|gloomy|down)\b", 0.9, EmotionCategory.SORROW, "Explicit sadness"),
			LinguisticPattern(r"\b(lost|gone|never again|no more|ended)\b", 0.8, EmotionCategory.SORROW, "Loss language"),
			LinguisticPattern(r"\b(should have|if only|regret|mistake|wrong)\b", 0.7, EmotionCategory.SORROW, "Regret language"),
			LinguisticPattern(r"\b(hurt|pain|broken|damaged|wounded)\b", 0.9, EmotionCategory.SORROW, "Pain language"),
			LinguisticPattern(r"\b(over|finished|done|impossible|hopeless)\b", 0.8, EmotionCategory.SORROW, "Finality language"),
			
			# Specific patterns for your use case
			LinguisticPattern(r"\b(demolished|destroyed|torn down|knocked down)\b", 0.9, EmotionCategory.SORROW, "Destruction language"),
			LinguisticPattern(r"\b(childhood home|family home|grew up|where I lived)\b", 0.7, EmotionCategory.SORROW, "Nostalgic places"),
			LinguisticPattern(r"\b(broke.*inside|broke.*heart|something.*inside.*me)\b", 0.95, EmotionCategory.SORROW, "Internal breaking"),
			LinguisticPattern(r"\b(watching.*demolished|seeing.*destroyed|witnessed.*torn)\b", 0.9, EmotionCategory.SORROW, "Witnessing destruction"),
			LinguisticPattern(r"\b(memories|childhood|growing up).*\b(lost|gone|destroyed)\b", 0.9, EmotionCategory.SORROW, "Lost memories"),
			LinguisticPattern(r"\b(home.*demolished|house.*torn|building.*destroyed)\b", 0.85, EmotionCategory.SORROW, "Home destruction"),
			LinguisticPattern(r"\b(terrified|scared|afraid|frightened|anxious|worried)\b", 0.7, EmotionCategory.SORROW, "Fear indicators")
		]
		
		# Enhanced transformative patterns - more specific to avoid false positives
		self.transformative_patterns = [
			LinguisticPattern(r"\b(learned|realized|understand now|see that)\b", 0.8, EmotionCategory.TRANSFORMATIVE, "Learning language"),
			LinguisticPattern(r"\b(healing|moving on|getting better|finding strength)\b", 0.9, EmotionCategory.TRANSFORMATIVE, "Recovery language"),
			LinguisticPattern(r"\b(growth|journey|transformation|evolution|change for the better)\b", 0.8, EmotionCategory.TRANSFORMATIVE, "Personal development"),
			LinguisticPattern(r"\b(overcame|conquered|survived|made it through|came out stronger)\b", 0.9, EmotionCategory.TRANSFORMATIVE, "Overcoming language"),
			# More specific transition patterns to avoid ambivalent false positives
			LinguisticPattern(r"\b(but now|however now|although now|despite that.*now)\b", 0.7, EmotionCategory.TRANSFORMATIVE, "Temporal transition"),
			LinguisticPattern(r"\b(used to.*but now|once.*but now|before.*but now)\b", 0.8, EmotionCategory.TRANSFORMATIVE, "Before/after transition"),
			
			# ENHANCED: Learning from loss/pain patterns
			LinguisticPattern(r"\b(death|loss|divorce|tragedy|accident|illness).*\b(taught|showed|learned|made me|helped me|forced me)\b", 0.95, EmotionCategory.TRANSFORMATIVE, "Learning from tragedy"),
			LinguisticPattern(r"\b(taught me|showed me|made me realize|helped me understand|forced me to)\b", 0.9, EmotionCategory.TRANSFORMATIVE, "Explicit learning"),
			LinguisticPattern(r"\b(devastating|terrible|heartbreak|cancer|losing).*\b(but|however|yet).*\b(discover|learn|realize|understand|appreciate)\b", 0.95, EmotionCategory.TRANSFORMATIVE, "Growth through adversity"),
			LinguisticPattern(r"\b(although|despite|even though).*\b(ended|failed|lost).*\b(learning|discovering|finding|becoming)\b", 0.9, EmotionCategory.TRANSFORMATIVE, "Growth despite loss"),
			LinguisticPattern(r"\b(grateful|thankful).*\b(taught|showed|learned)\b", 0.8, EmotionCategory.TRANSFORMATIVE, "Gratitude for lessons")
		]
		
		# NEW: Comprehensive ambivalent patterns
		self.ambivalent_patterns = [
			# Simultaneous contrasting emotions - ENHANCED with higher weights
			LinguisticPattern(r"\b(excited.*but.*terrified|thrilled.*but.*scared|happy.*but.*sad)\b", 0.95, EmotionCategory.AMBIVALENT, "Simultaneous opposing emotions"),
			LinguisticPattern(r"\b(love.*but.*hate|want.*but.*don't|yes.*but.*no)\b", 0.9, EmotionCategory.AMBIVALENT, "Love-hate dynamics"),
			LinguisticPattern(r"\b(part of me.*but.*part of me|on one hand.*on the other)\b", 0.9, EmotionCategory.AMBIVALENT, "Internal conflict"),
			
			# ENHANCED: "Both...and" constructions - HIGHEST PRIORITY
			LinguisticPattern(r"\b(both.*and.*|feels like both.*and|like both.*and)\b", 0.98, EmotionCategory.AMBIVALENT, "Explicit dual emotions"),
			LinguisticPattern(r"\b(both an adventure and.*mistake|both.*and.*terrible|both.*and.*wonderful)\b", 0.99, EmotionCategory.AMBIVALENT, "Both positive and negative"),
			
			# Mixed feelings expressions
			LinguisticPattern(r"\b(mixed feelings|conflicted|torn between|can't decide)\b", 0.95, EmotionCategory.AMBIVALENT, "Explicit mixed feelings"),
			LinguisticPattern(r"\b(bittersweet|love-hate|push-pull|back and forth)\b", 0.9, EmotionCategory.AMBIVALENT, "Ambivalent descriptors"),
			LinguisticPattern(r"\b(simultaneously.*and|at the same time.*but)\b", 0.85, EmotionCategory.AMBIVALENT, "Simultaneous feelings"),
			
			# Contradiction indicators with emotional content
			LinguisticPattern(r"\b(excited.*afraid|happy.*worried|hopeful.*doubtful)\b", 0.85, EmotionCategory.AMBIVALENT, "Emotional contradictions"),
			LinguisticPattern(r"\b(want.*scared|eager.*nervous|looking forward.*dreading)\b", 0.85, EmotionCategory.AMBIVALENT, "Approach-avoidance conflict"),
			
			# Ambivalent transition words with emotional context - REDUCED weight to avoid over-triggering
			LinguisticPattern(r"\b(but|however|although|yet|still).*\b(excited|scared|happy|sad|worried|thrilled)\b", 0.6, EmotionCategory.AMBIVALENT, "Emotional contrasts"),
			LinguisticPattern(r"\b(excited|happy|thrilled|eager).*\b(but|however|although|yet).*\b(scared|afraid|worried|nervous|terrified)\b", 0.9, EmotionCategory.AMBIVALENT, "Positive-negative emotional contrast"),
			
			# Uncertainty with emotional stakes
			LinguisticPattern(r"\b(don't know how to feel|not sure.*feel|complicated.*emotions)\b", 0.8, EmotionCategory.AMBIVALENT, "Emotional uncertainty"),
			LinguisticPattern(r"\b(should be happy but|should be excited but|supposed to feel)\b", 0.8, EmotionCategory.AMBIVALENT, "Expected vs actual emotions"),
			
			# ENHANCED: Family/relationship ambivalence
			LinguisticPattern(r"\b(love.*but.*miss|want.*but.*afraid|proud.*but.*guilty)\b", 0.9, EmotionCategory.AMBIVALENT, "Relationship ambivalence")
		]
		
		# NEW: Comprehensive reflective neutral patterns
		self.reflective_neutral_patterns = [
			# Contemplative language - ENHANCED
			LinguisticPattern(r"\b(thinking about|pondering|contemplating|reflecting on|considering)\b", 0.8, EmotionCategory.REFLECTIVE_NEUTRAL, "Contemplative processes"),
			LinguisticPattern(r"\b(wonder|curious|interesting to note|worth noting|observe)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Intellectual curiosity"),
			LinguisticPattern(r"\b(seems|appears|looks like|strikes me|occurs to me)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Observational language"),
			
			# ENHANCED: Questioning and belief examination - HIGHEST PRIORITY for this category
			LinguisticPattern(r"\b(questioning|question|examine|reexamine).*\b(values|beliefs|assumptions|faith|principles)\b", 0.95, EmotionCategory.REFLECTIVE_NEUTRAL, "Belief examination"),
			LinguisticPattern(r"\b(what I.*believe|what I.*think|what really matters|what.*means)\b", 0.9, EmotionCategory.REFLECTIVE_NEUTRAL, "Personal philosophy"),
			LinguisticPattern(r"\b(grew up with|raised to believe|always thought).*\b(but now|question|wonder|different)\b", 0.9, EmotionCategory.REFLECTIVE_NEUTRAL, "Belief evolution"),
			LinguisticPattern(r"\b(find myself.*questioning|find myself.*wondering|find myself.*thinking)\b", 0.95, EmotionCategory.REFLECTIVE_NEUTRAL, "Self-reflection discovery"),
			
			# Analytical framing
			LinguisticPattern(r"\b(analyzing|examining|evaluating|assessing|reviewing)\b", 0.8, EmotionCategory.REFLECTIVE_NEUTRAL, "Analytical processes"),
			LinguisticPattern(r"\b(perspective|viewpoint|angle|way of looking|lens)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Perspective-taking"),
			LinguisticPattern(r"\b(objectively|from a distance|stepping back|big picture)\b", 0.8, EmotionCategory.REFLECTIVE_NEUTRAL, "Objective stance"),
			
			# Neutral observation - ENHANCED
			LinguisticPattern(r"\b(notice|observe|see that|recognize|acknowledge)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Neutral observation"),
			LinguisticPattern(r"\b(fact|reality|truth|situation|circumstances)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Factual framing"),
			LinguisticPattern(r"\b(simply|just|merely|basically|essentially)\b", 0.5, EmotionCategory.REFLECTIVE_NEUTRAL, "Simplifying language"),
			
			# Philosophical/abstract thinking - ENHANCED
			LinguisticPattern(r"\b(meaning|purpose|significance|implications|consequences)\b", 0.75, EmotionCategory.REFLECTIVE_NEUTRAL, "Abstract concepts"),
			LinguisticPattern(r"\b(life|existence|human nature|the way things are|how things work)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Philosophical topics"),
			LinguisticPattern(r"\b(pattern|cycle|process|system|mechanism)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Systems thinking"),
			LinguisticPattern(r"\b(often wonder|sometimes think|makes me wonder|interesting how)\b", 0.8, EmotionCategory.REFLECTIVE_NEUTRAL, "Contemplative wondering"),
			LinguisticPattern(r"\b(perspective changes|experience more|get older|as you)\b", 0.75, EmotionCategory.REFLECTIVE_NEUTRAL, "Experiential wisdom"),
			
			# Measured, thoughtful language
			LinguisticPattern(r"\b(carefully|thoughtfully|deliberately|methodically|systematically)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Measured approach"),
			LinguisticPattern(r"\b(balance|weigh|consider|factor in|take into account)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Balanced thinking"),
			
			# Neutral emotional distance
			LinguisticPattern(r"\b(understand|comprehend|grasp|see|get)(?!\s+(excited|happy|sad|angry|afraid))\b", 0.5, EmotionCategory.REFLECTIVE_NEUTRAL, "Neutral understanding"),
			LinguisticPattern(r"\b(makes sense|reasonable|logical|rational|practical)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Rational evaluation"),
			
			# ENHANCED: Life reflection without strong emotion
			LinguisticPattern(r"\b(choices|decisions|paths|different.*life|if I had)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Life contemplation"),
			LinguisticPattern(r"\b(stories.*connected|meaningful life|live.*meaningful)\b", 0.8, EmotionCategory.REFLECTIVE_NEUTRAL, "Meaning-making")
		]
		
		self.speaker_profiles = {}
		self.narrative_arcs = {}

	def _detect_patterns(self, text: str) -> List[Tuple[LinguisticPattern, float]]:
		"""Detect linguistic patterns in the text and return matches with scores."""
		matches = []
		
		all_patterns = (self.hope_patterns + self.sorrow_patterns + self.transformative_patterns + 
						self.ambivalent_patterns + self.reflective_neutral_patterns)
		
		for pattern in all_patterns:
			found = re.finditer(pattern.pattern, text.lower())
			for match in found:
				# Calculate context score based on surrounding words
				start = max(0, match.start() - 20)
				end = min(len(text), match.end() + 20)
				context = text[start:end]
				
				# Adjust weight based on context
				context_score = 1.0
				if "not" in context or "never" in context:
					context_score = -1.0
				elif "very" in context or "really" in context:
					context_score = 1.5
				
				score = pattern.weight * context_score
				matches.append((pattern, score))
		
		return matches
		
	def _calculate_category_scores(self, matches: List[Tuple[LinguisticPattern, float]]) -> Dict[EmotionCategory, float]:
		"""Calculate scores for each emotion category based on pattern matches."""
		scores = {category: 0.0 for category in EmotionCategory}
		
		for pattern, score in matches:
			scores[pattern.category] += score
		
		# Special logic for ambivalent detection
		scores = self._apply_ambivalent_logic(matches, scores)
		
		# Normalize scores
		total = sum(abs(score) for score in scores.values())
		if total > 0:
			scores = {k: v/total for k, v in scores.items()}
		
		return scores
	
	def _apply_ambivalent_logic(self, matches: List[Tuple[LinguisticPattern, float]], scores: Dict[EmotionCategory, float]) -> Dict[EmotionCategory, float]:
		"""Apply special logic to detect ambivalence from contrasting emotions."""
		hope_score = scores[EmotionCategory.HOPE]
		sorrow_score = scores[EmotionCategory.SORROW]
		
		# If we have significant scores in both hope and sorrow, boost ambivalent
		if hope_score > 0.3 and sorrow_score > 0.3:
			ambivalent_boost = min(hope_score, sorrow_score) * 1.5
			scores[EmotionCategory.AMBIVALENT] += ambivalent_boost
		
		# Check for explicit ambivalent patterns
		ambivalent_matches = [m for m in matches if m[0].category == EmotionCategory.AMBIVALENT]
		if ambivalent_matches:
			# Strong ambivalent patterns should dominate
			max_ambivalent_score = max(m[1] for m in ambivalent_matches)
			if max_ambivalent_score > 0.8:
				scores[EmotionCategory.AMBIVALENT] *= 2.0
		
		return scores
		
	def _detect_narrative_arc(self, speaker_id: str, current_category: EmotionCategory) -> float:
		"""Track and analyze the narrative arc for a speaker."""
		if speaker_id not in self.narrative_arcs:
			self.narrative_arcs[speaker_id] = []
		
		self.narrative_arcs[speaker_id].append(current_category)
		
		# Calculate narrative arc score based on recent history
		recent_history = self.narrative_arcs[speaker_id][-5:]  # Last 5 entries
		if len(recent_history) < 2:
			return 0.0
		
		# Check for transformative patterns
		transformative_count = sum(1 for cat in recent_history if cat == EmotionCategory.TRANSFORMATIVE)
		if transformative_count > 0:
			return 0.8
		
		# Check for emotional progression
		if recent_history[-1] == EmotionCategory.HOPE and recent_history[0] == EmotionCategory.SORROW:
			return 0.7
		
		return 0.0
		
	def _get_speaker_calibration(self, speaker_id: str) -> Dict[EmotionCategory, float]:
		"""Get speaker-specific calibration factors."""
		if speaker_id not in self.speaker_profiles:
			self.speaker_profiles[speaker_id] = {
				category: 1.0 for category in EmotionCategory
			}
		return self.speaker_profiles[speaker_id]
		
	def classify_emotion(
		self,
		text: str,
		sentiment_score: float,
		speaker_id: str,
		context_window: Optional[List[str]] = None
	) -> ClassificationResult:
		"""
		Classify the emotional content of text using advanced linguistic analysis.
		
		Args:
			text: The text to analyze
			sentiment_score: Base sentiment score from transformer/LLM (-1 to 1)
			speaker_id: Unique identifier for the speaker
			context_window: Optional list of previous utterances for context
			
		Returns:
			ClassificationResult with category, confidence, and explanation
		"""
		# ENHANCED: Handle edge cases first
		text_clean = text.strip()
		
		# Check for very short or nonsensical content
		if len(text_clean) < 3:
			return ClassificationResult(
				category=EmotionCategory.REFLECTIVE_NEUTRAL,
				confidence=0.1,
				score=0.0,
				matched_patterns=[],
				explanation="Text too short for reliable emotion classification. Defaulting to neutral.",
				timestamp=datetime.now()
			)
		
		# Check for nonsensical patterns
		if self._is_likely_nonsensical(text_clean):
			return ClassificationResult(
				category=EmotionCategory.REFLECTIVE_NEUTRAL,
				confidence=0.2,
				score=sentiment_score,
				matched_patterns=[],
				explanation=f"Content appears nonsensical or may be transcription error. Applying neutral classification with base sentiment score ({sentiment_score:.2f}).",
				timestamp=datetime.now()
			)
		
		# ENHANCED: Normalize text for more consistent pattern matching
		normalized_text = self._normalize_text_for_classification(text_clean)
		
		# Detect linguistic patterns on normalized text
		matches = self._detect_patterns(normalized_text)
		
		# Calculate category scores
		category_scores = self._calculate_category_scores(matches)
		
		# ENHANCED: Handle cases where no patterns are detected but we have strong sentiment
		total_pattern_score = sum(abs(score) for score in category_scores.values())
		if total_pattern_score == 0.0:  # No patterns detected
			# Use sentiment score to set base categories
			if sentiment_score < -0.5:  # Very negative sentiment
				category_scores[EmotionCategory.SORROW] = 0.8
				category_scores[EmotionCategory.REFLECTIVE_NEUTRAL] = 0.2
			elif sentiment_score > 0.5:  # Very positive sentiment
				category_scores[EmotionCategory.HOPE] = 0.8
				category_scores[EmotionCategory.REFLECTIVE_NEUTRAL] = 0.2
			else:  # Neutral sentiment
				category_scores[EmotionCategory.REFLECTIVE_NEUTRAL] = 1.0
		
		# ENHANCED: Apply special detection logic for high-priority patterns
		text_lower = normalized_text.lower()
		
		# Check for high-priority ambivalent patterns first
		if "both" in text_lower and ("and" in text_lower or "&" in text_lower):
			ambivalent_boost = 0.5
			if any(word in text_lower for word in ["adventure", "mistake", "terrible", "wonderful"]):
				ambivalent_boost = 0.8
			category_scores[EmotionCategory.AMBIVALENT] += ambivalent_boost
		
		# Check for transformative patterns (learning from loss/pain)
		if any(word in text_lower for word in ["death", "taught", "showed", "made me", "forced me"]):
			transformative_boost = 0.6
			category_scores[EmotionCategory.TRANSFORMATIVE] += transformative_boost
		
		# Check for reflective patterns (philosophical questioning)
		if "questioning" in text_lower or ("find myself" in text_lower and any(word in text_lower for word in ["questioning", "thinking", "wondering"])):
			reflective_boost = 0.7
			category_scores[EmotionCategory.REFLECTIVE_NEUTRAL] += reflective_boost
		
		# ENHANCED: Detect filtered profanity/NSFW content
		if "***" in text or "*" in text:  # Filtered content detected
			# This indicates inappropriate content was filtered by AssemblyAI
			# Such content is typically negative/harmful, so classify as sorrow or neutral
			if sentiment_score < -0.3:  # Negative sentiment + filtered content = sorrow
				category_scores[EmotionCategory.SORROW] += 0.9
				category_scores[EmotionCategory.HOPE] *= 0.1  # Heavily penalize hope
			else:  # Neutral or unclear sentiment + filtered content = reflective neutral
				category_scores[EmotionCategory.REFLECTIVE_NEUTRAL] += 0.8
				category_scores[EmotionCategory.HOPE] *= 0.2  # Penalize hope
		
		# Apply sentiment score influence - BUT with reduced impact to allow patterns to dominate
		# ENHANCED: Reduce sentiment score influence for more consistent classification
		if sentiment_score < -0.7:  # Only very strong negative sentiment
			category_scores[EmotionCategory.SORROW] *= 1.3  # Reduced from 1.5
			category_scores[EmotionCategory.HOPE] *= 0.7    # Reduced penalty
		elif sentiment_score > 0.7:  # Only very strong positive sentiment
			category_scores[EmotionCategory.HOPE] *= 1.3    # Reduced from 1.5
			category_scores[EmotionCategory.SORROW] *= 0.7  # Reduced penalty
		
		# Apply speaker calibration
		calibration = self._get_speaker_calibration(speaker_id)
		for category in category_scores:
			category_scores[category] *= calibration[category]
		
		# Consider narrative arc
		if context_window:
			narrative_score = self._detect_narrative_arc(speaker_id, max(category_scores.items(), key=lambda x: x[1])[0])
			category_scores[EmotionCategory.TRANSFORMATIVE] += narrative_score
		
		# ENHANCED: Determine final category with better thresholds
		max_category = max(category_scores.items(), key=lambda x: x[1])
		final_category = max_category[0]
		max_score = max_category[1]
		
		# Calculate confidence based on the winning score and margin
		second_highest = sorted(category_scores.values(), reverse=True)[1] if len(category_scores) > 1 else 0
		margin = max_score - second_highest
		confidence = min(0.95, max(0.1, max_score + margin * 0.3))  # Better confidence calculation
		
		# Override logic for very clear patterns
		if max_score > 1.0:  # Strong pattern match
			confidence = min(0.98, confidence + 0.2)
		
		# Generate explanation
		explanation = self._generate_explanation(final_category, matches, confidence, sentiment_score, category_scores, text)
		
		return ClassificationResult(
			category=final_category,
			confidence=confidence,
			score=sentiment_score,
			matched_patterns=matches,
			explanation=explanation,
			timestamp=datetime.now()
		)
		
	def _is_likely_nonsensical(self, text: str) -> bool:
		"""
		Check if text appears to be nonsensical or likely transcription error.
		
		Args:
			text: The text to analyze
			
		Returns:
			bool: True if content appears nonsensical
		"""
		text_lower = text.lower().strip()
		words = text_lower.split()
		
		# Very short single words that aren't common speech
		if len(words) == 1 and len(text_lower) < 4:
			common_short_words = ['yes', 'no', 'ok', 'hi', 'bye', 'wow', 'oh', 'ah', 'um', 'uh', 'you']
			if text_lower not in common_short_words:
				return True
		
		# Repetitive patterns (like "la la la", "tick tock tick tock")
		if len(words) >= 3:
			# Check for repetitive patterns - but only if words are actually repeated
			unique_words = set(words)
			
			# Case 1: Very few unique words repeated many times (like "la la la la")
			if len(unique_words) <= 2 and len(words) >= 4:
				return True
			
			# Case 2: Moderate repetition with simple words (like "tick tock tick tock la la la")
			if len(unique_words) <= 3 and len(words) >= 6:
				# Check if most words are repeated
				word_counts = {}
				for word in words:
					word_counts[word] = word_counts.get(word, 0) + 1
				
				# If any word appears 3+ times, it's likely nonsensical
				max_repetitions = max(word_counts.values())
				if max_repetitions >= 3:
					return True
		
		# Check for patterns that suggest noise/nonsense
		nonsense_patterns = [
			r'^[a-z]{1,3}\.{3,}$',  # Single letters with dots like "a..."
			r'^[a-z\s]{1,10}\.$',   # Very short with just a period
			r'^[^a-zA-Z\s]*$',      # No letters at all (symbols only)
			r'^[a-z]\s[a-z]\s[a-z](\s[a-z])*$',  # FIXED: Only single letters separated by spaces (like "a b c d")
		]
		
		import re
		for pattern in nonsense_patterns:
			if re.match(pattern, text_lower):
				return True
		
		# Check for excessive punctuation or symbols
		non_alpha_count = sum(1 for char in text if not char.isalpha() and not char.isspace())
		if len(text) > 0 and non_alpha_count / len(text) > 0.5:  # More than 50% non-alphabetic
			return True
		
		return False
		
	def _generate_explanation(
		self,
		category: EmotionCategory,
		matches: List[Tuple[LinguisticPattern, float]],
		confidence: float,
		sentiment_score: float,
		category_scores: Dict[EmotionCategory, float],
		original_text: str = ""
	) -> str:
		"""Generate a detailed explanation of the classification."""
		explanation_parts = []
		
		# Start with category classification
		explanation_parts.append(f"Classified as {category.value.upper()} with {confidence:.1%} confidence.")
		
		# Add category scores breakdown
		sorted_scores = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
		score_breakdown = []
		for cat, score in sorted_scores[:3]:  # Top 3 categories
			score_breakdown.append(f"{cat.value}: {score:.2f}")
		explanation_parts.append(f"Category scores: {', '.join(score_breakdown)}")
		
		# Add sentiment score context
		if sentiment_score < -0.5:
			sentiment_desc = "strongly negative"
		elif sentiment_score < -0.2:
			sentiment_desc = "negative"
		elif sentiment_score > 0.5:
			sentiment_desc = "strongly positive"
		elif sentiment_score > 0.2:
			sentiment_desc = "positive"
		else:
			sentiment_desc = "neutral"
		explanation_parts.append(f"Base sentiment: {sentiment_desc} ({sentiment_score:.2f})")
		
		# Add pattern analysis
		if matches:
			# Get matches for the chosen category
			category_matches = [m for m in matches if m[0].category == category]
			if category_matches:
				top_matches = sorted(category_matches, key=lambda x: x[1], reverse=True)[:3]
				pattern_descriptions = [f"{m[0].description} ({m[1]:.2f})" for m in top_matches]
				explanation_parts.append(f"Key patterns: {'; '.join(pattern_descriptions)}")
			
			# Show conflicting signals for ambivalent
			if category == EmotionCategory.AMBIVALENT:
				hope_matches = [m for m in matches if m[0].category == EmotionCategory.HOPE]
				sorrow_matches = [m for m in matches if m[0].category == EmotionCategory.SORROW]
				if hope_matches and sorrow_matches:
					explanation_parts.append("Detected conflicting emotional signals indicating ambivalence")
		else:
			# No patterns matched - explain why
			if confidence < 0.3:
				explanation_parts.append("Low confidence due to lack of clear emotional indicators")
		
		# Add special reasoning for each category
		if category == EmotionCategory.TRANSFORMATIVE:
			explanation_parts.append("Shows learning or growth from difficult experiences")
		elif category == EmotionCategory.AMBIVALENT:
			explanation_parts.append("Contains mixed or contradictory emotions")
		elif category == EmotionCategory.REFLECTIVE_NEUTRAL:
			explanation_parts.append("Demonstrates thoughtful contemplation without strong emotional charge")
		elif category == EmotionCategory.HOPE:
			explanation_parts.append("Expresses future-oriented positivity or aspirations")
		elif category == EmotionCategory.SORROW:
			explanation_parts.append("Focuses on grief, loss, or regret")
		
		# ENHANCED: Add note about filtered content if detected
		if "***" in original_text or "*" in original_text:
			explanation_parts.append("Note: Inappropriate content was filtered by AssemblyAI content safety")
		
		return " | ".join(explanation_parts)
		
	def update_speaker_profile(self, speaker_id: str, category: EmotionCategory, accuracy: float):
		"""Update speaker profile based on feedback."""
		if speaker_id not in self.speaker_profiles:
			self.speaker_profiles[speaker_id] = {
				cat: 1.0 for cat in EmotionCategory
			}
		
		# Adjust calibration factor based on accuracy
		self.speaker_profiles[speaker_id][category] *= (1.0 + (accuracy - 0.5))
		
	def _normalize_text_for_classification(self, text: str) -> str:
		"""
		Normalize text to reduce classification variance from minor differences.
		
		Args:
			text: The original text
			
		Returns:
			str: Normalized text for more consistent pattern matching
		"""
		import re
		
		# Convert to lowercase for processing
		normalized = text.lower()
		
		# Fix common transcription errors
		transcription_fixes = {
			r'\bof the past\b': 'over the past',  # Common transcription error
			r'\bof my\b': 'over my',
			r'\bof time\b': 'over time',
			r'\bthru\b': 'through',
			r'\bu\b': 'you',
			r'\bur\b': 'your',
			r'\bcuz\b': 'because',
		}
		
		for pattern, replacement in transcription_fixes.items():
			normalized = re.sub(pattern, replacement, normalized)
		
		# Normalize tense variations for more consistent classification
		# Convert past tense to present tense for key reflective verbs
		tense_normalizations = {
			r'\brealized\b': 'realize',
			r'\blearned\b': 'learn', 
			r'\bunderstood\b': 'understand',
			r'\brecognized\b': 'recognize',
			r'\bdiscovered\b': 'discover',
			r'\bfound\b': 'find',
			r'\bthought\b': 'think',
			r'\bfelt\b': 'feel',
			r'\bsaw\b': 'see',
			r'\bknew\b': 'know'
		}
		
		for pattern, replacement in tense_normalizations.items():
			normalized = re.sub(pattern, replacement, normalized)
		
		# Remove extra whitespace
		normalized = re.sub(r'\s+', ' ', normalized).strip()
		
		return normalized
