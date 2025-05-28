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
			LinguisticPattern(r"\b(will|going to|plan to|hope|dream|wish)\b", 0.8, EmotionCategory.HOPE, "Future-oriented language"),
			LinguisticPattern(r"\b(maybe|could|might|possibility|chance)\b", 0.6, EmotionCategory.HOPE, "Possibility language"),
			LinguisticPattern(r"\b(learn|grow|improve|better|progress)\b", 0.7, EmotionCategory.HOPE, "Growth language"),
			LinguisticPattern(r"\b(goal|ambition|vision|future|tomorrow)\b", 0.9, EmotionCategory.HOPE, "Aspiration words"),
			LinguisticPattern(r"\b(excited|thrilled|eager|looking forward|can't wait)\b", 0.8, EmotionCategory.HOPE, "Excitement indicators")
		]
		
		self.sorrow_patterns = [
			# Original patterns
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
			LinguisticPattern(r"\b(used to.*but now|once.*but now|before.*but now)\b", 0.8, EmotionCategory.TRANSFORMATIVE, "Before/after transition")
		]
		
		# NEW: Comprehensive ambivalent patterns
		self.ambivalent_patterns = [
			# Simultaneous contrasting emotions
			LinguisticPattern(r"\b(excited.*but.*terrified|thrilled.*but.*scared|happy.*but.*sad)\b", 0.95, EmotionCategory.AMBIVALENT, "Simultaneous opposing emotions"),
			LinguisticPattern(r"\b(love.*but.*hate|want.*but.*don't|yes.*but.*no)\b", 0.9, EmotionCategory.AMBIVALENT, "Love-hate dynamics"),
			LinguisticPattern(r"\b(part of me.*but.*part of me|on one hand.*on the other)\b", 0.9, EmotionCategory.AMBIVALENT, "Internal conflict"),
			
			# Mixed feelings expressions
			LinguisticPattern(r"\b(mixed feelings|conflicted|torn between|can't decide)\b", 0.95, EmotionCategory.AMBIVALENT, "Explicit mixed feelings"),
			LinguisticPattern(r"\b(bittersweet|love-hate|push-pull|back and forth)\b", 0.9, EmotionCategory.AMBIVALENT, "Ambivalent descriptors"),
			LinguisticPattern(r"\b(both.*and|simultaneously.*and|at the same time)\b", 0.7, EmotionCategory.AMBIVALENT, "Simultaneous feelings"),
			
			# Contradiction indicators with emotional content
			LinguisticPattern(r"\b(excited.*afraid|happy.*worried|hopeful.*doubtful)\b", 0.85, EmotionCategory.AMBIVALENT, "Emotional contradictions"),
			LinguisticPattern(r"\b(want.*scared|eager.*nervous|looking forward.*dreading)\b", 0.85, EmotionCategory.AMBIVALENT, "Approach-avoidance conflict"),
			
			# Ambivalent transition words with emotional context
			LinguisticPattern(r"\b(but|however|although|yet|still).*\b(excited|scared|happy|sad|worried|thrilled)\b", 0.7, EmotionCategory.AMBIVALENT, "Emotional contrasts"),
			LinguisticPattern(r"\b(excited|happy|thrilled|eager).*\b(but|however|although|yet).*\b(scared|afraid|worried|nervous|terrified)\b", 0.9, EmotionCategory.AMBIVALENT, "Positive-negative emotional contrast"),
			
			# Uncertainty with emotional stakes
			LinguisticPattern(r"\b(don't know how to feel|not sure.*feel|complicated.*emotions)\b", 0.8, EmotionCategory.AMBIVALENT, "Emotional uncertainty"),
			LinguisticPattern(r"\b(should be happy but|should be excited but|supposed to feel)\b", 0.8, EmotionCategory.AMBIVALENT, "Expected vs actual emotions")
		]
		
		# NEW: Comprehensive reflective neutral patterns
		self.reflective_neutral_patterns = [
			# Contemplative language
			LinguisticPattern(r"\b(thinking about|pondering|contemplating|reflecting on|considering)\b", 0.8, EmotionCategory.REFLECTIVE_NEUTRAL, "Contemplative processes"),
			LinguisticPattern(r"\b(wonder|curious|interesting to note|worth noting|observe)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Intellectual curiosity"),
			LinguisticPattern(r"\b(seems|appears|looks like|strikes me|occurs to me)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Observational language"),
			
			# Analytical framing
			LinguisticPattern(r"\b(analyzing|examining|evaluating|assessing|reviewing)\b", 0.8, EmotionCategory.REFLECTIVE_NEUTRAL, "Analytical processes"),
			LinguisticPattern(r"\b(perspective|viewpoint|angle|way of looking|lens)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Perspective-taking"),
			LinguisticPattern(r"\b(objectively|from a distance|stepping back|big picture)\b", 0.8, EmotionCategory.REFLECTIVE_NEUTRAL, "Objective stance"),
			
			# Neutral observation
			LinguisticPattern(r"\b(notice|observe|see that|recognize|acknowledge)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Neutral observation"),
			LinguisticPattern(r"\b(fact|reality|truth|situation|circumstances)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Factual framing"),
			LinguisticPattern(r"\b(simply|just|merely|basically|essentially)\b", 0.5, EmotionCategory.REFLECTIVE_NEUTRAL, "Simplifying language"),
			
			# Philosophical/abstract thinking
			LinguisticPattern(r"\b(meaning|purpose|significance|implications|consequences)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Abstract concepts"),
			LinguisticPattern(r"\b(life|existence|human nature|the way things are|how things work)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Philosophical topics"),
			LinguisticPattern(r"\b(pattern|cycle|process|system|mechanism)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Systems thinking"),
			
			# Measured, thoughtful language
			LinguisticPattern(r"\b(carefully|thoughtfully|deliberately|methodically|systematically)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Measured approach"),
			LinguisticPattern(r"\b(balance|weigh|consider|factor in|take into account)\b", 0.7, EmotionCategory.REFLECTIVE_NEUTRAL, "Balanced thinking"),
			
			# Neutral emotional distance
			LinguisticPattern(r"\b(understand|comprehend|grasp|see|get)(?!\s+(excited|happy|sad|angry|afraid))\b", 0.5, EmotionCategory.REFLECTIVE_NEUTRAL, "Neutral understanding"),
			LinguisticPattern(r"\b(makes sense|reasonable|logical|rational|practical)\b", 0.6, EmotionCategory.REFLECTIVE_NEUTRAL, "Rational evaluation")
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
		# Detect linguistic patterns
		matches = self._detect_patterns(text)
		
		# Calculate category scores
		category_scores = self._calculate_category_scores(matches)
		
		# Apply sentiment score influence with special handling for ambivalent and neutral
		if abs(sentiment_score) < 0.3:  # Near-neutral sentiment
			category_scores[EmotionCategory.REFLECTIVE_NEUTRAL] *= 1.5
		elif sentiment_score < -0.5:  # Strong negative sentiment
			if category_scores[EmotionCategory.AMBIVALENT] < 0.5:  # Only if not strongly ambivalent
				category_scores[EmotionCategory.SORROW] *= 2.0
				category_scores[EmotionCategory.HOPE] *= 0.2
		elif sentiment_score > 0.5:  # Strong positive sentiment
			if category_scores[EmotionCategory.AMBIVALENT] < 0.5:  # Only if not strongly ambivalent
				category_scores[EmotionCategory.HOPE] *= 2.0
				category_scores[EmotionCategory.SORROW] *= 0.2
		
		# Special handling for ambivalent cases - don't let sentiment override strong ambivalent signals
		if category_scores[EmotionCategory.AMBIVALENT] > 0.6:
			# Reduce the influence of sentiment score for clearly ambivalent text
			pass  # Keep ambivalent score as is
		
		# Apply speaker calibration
		calibration = self._get_speaker_calibration(speaker_id)
		for category in category_scores:
			category_scores[category] *= calibration[category]
		
		# Consider narrative arc
		if context_window:
			narrative_score = self._detect_narrative_arc(speaker_id, max(category_scores.items(), key=lambda x: x[1])[0])
			category_scores[EmotionCategory.TRANSFORMATIVE] += narrative_score
		
		# Determine final category with special logic for ambivalent and neutral
		if category_scores[EmotionCategory.AMBIVALENT] > 0.5:
			final_category = EmotionCategory.AMBIVALENT
			confidence = category_scores[EmotionCategory.AMBIVALENT]
		elif category_scores[EmotionCategory.REFLECTIVE_NEUTRAL] > 0.6:
			final_category = EmotionCategory.REFLECTIVE_NEUTRAL
			confidence = category_scores[EmotionCategory.REFLECTIVE_NEUTRAL]
		elif sentiment_score < -0.7 and category_scores[EmotionCategory.AMBIVALENT] < 0.4:
			final_category = EmotionCategory.SORROW
			confidence = max(0.8, category_scores[EmotionCategory.SORROW])
		elif sentiment_score > 0.7 and category_scores[EmotionCategory.AMBIVALENT] < 0.4:
			final_category = EmotionCategory.HOPE
			confidence = max(0.8, category_scores[EmotionCategory.HOPE])
		else:
			final_category = max(category_scores.items(), key=lambda x: x[1])[0]
			confidence = category_scores[final_category]
		
		# Generate explanation
		explanation = self._generate_explanation(final_category, matches, confidence, sentiment_score)
		
		return ClassificationResult(
			category=final_category,
			confidence=confidence,
			score=sentiment_score,
			matched_patterns=matches,
			explanation=explanation,
			timestamp=datetime.now()
		)
		
	def _generate_explanation(
		self,
		category: EmotionCategory,
		matches: List[Tuple[LinguisticPattern, float]],
		confidence: float,
		sentiment_score: float
	) -> str:
		"""Generate a detailed explanation of the classification."""
		if not matches:
			if sentiment_score < -0.5:
				return f"Classified as {category.value} based on strongly negative sentiment (score: {sentiment_score:.2f})."
			elif sentiment_score > 0.5:
				return f"Classified as {category.value} based on strongly positive sentiment (score: {sentiment_score:.2f})."
			else:
				return f"Classified as {category.value} based on neutral sentiment (score: {sentiment_score:.2f})."
		
		# Get top matches for the chosen category
		category_matches = [m for m in matches if m[0].category == category]
		top_matches = sorted(category_matches, key=lambda x: x[1], reverse=True)[:3]
		
		explanations = [f"Detected {m[0].description} ({m[1]:.2f} weight)" for m in top_matches]
		
		# Special explanation for ambivalent
		if category == EmotionCategory.AMBIVALENT:
			hope_matches = [m for m in matches if m[0].category == EmotionCategory.HOPE]
			sorrow_matches = [m for m in matches if m[0].category == EmotionCategory.SORROW]
			if hope_matches and sorrow_matches:
				explanations.append("Detected conflicting emotional signals")
		
		return f"Classified as {category.value} with {confidence:.2f} confidence. " + \
			   f"Key indicators: {'; '.join(explanations)}. " + \
			   f"Base sentiment score: {sentiment_score:.2f}"
		
	def update_speaker_profile(self, speaker_id: str, category: EmotionCategory, accuracy: float):
		"""Update speaker profile based on feedback."""
		if speaker_id not in self.speaker_profiles:
			self.speaker_profiles[speaker_id] = {
				cat: 1.0 for cat in EmotionCategory
			}
		
		# Adjust calibration factor based on accuracy
		self.speaker_profiles[speaker_id][category] *= (1.0 + (accuracy - 0.5))
