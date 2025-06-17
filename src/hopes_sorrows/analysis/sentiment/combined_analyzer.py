"""
Combined Sentiment Analysis Module
Combines LLM and Transformer analyses for more accurate emotion classification.
"""

from typing import Dict, Optional, List
from enum import Enum
from .sa_transformers import analyze_sentiment as analyze_sentiment_transformer
from .sa_LLM import analyze_sentiment as analyze_sentiment_llm

class CombinationStrategy(Enum):
    """Strategies for combining LLM and transformer analyses"""
    WEIGHTED_AVERAGE = "weighted_average"
    HIGHEST_CONFIDENCE = "highest_confidence"
    TRANSFORMER_PRIMARY = "transformer_primary"
    LLM_PRIMARY = "llm_primary"
    CONSENSUS = "consensus"

class CombinedSentimentAnalyzer:
    """Combines LLM and Transformer sentiment analyses for improved accuracy"""
    
    def __init__(self, strategy=CombinationStrategy.WEIGHTED_AVERAGE):
        self.strategy = strategy
        self.weights = {
            'transformer': 0.6,  # Transformer is faster and more consistent
            'llm': 0.4           # LLM provides deeper understanding but more variable
        }
    
    def analyze(self, text: str, speaker_id: Optional[str] = None, 
                context_window: Optional[List[str]] = None, 
                use_llm: bool = True, verbose: bool = False) -> Dict:
        """
        Perform combined sentiment analysis using both transformer and LLM.
        
        Args:
            text: The text to analyze
            speaker_id: Optional speaker identifier
            context_window: Optional context for analysis
            use_llm: Whether to use LLM analysis (if False, returns transformer only)
            verbose: Whether to show detailed output
            
        Returns:
            Combined analysis result with single emotion decision
        """
        
        # Always get transformer analysis (fast and reliable)
        try:
            transformer_result = analyze_sentiment_transformer(
                text, speaker_id, context_window, verbose=False
            )
            if verbose:
                print(f"🤖 Transformer result: {transformer_result['category']} (confidence: {transformer_result['confidence']:.1%})")
        except Exception as e:
            if verbose:
                print(f"❌ Transformer analysis failed: {e}")
            transformer_result = self._create_fallback_result(text, "transformer_error")
        
        # Get LLM analysis if enabled and available
        llm_result = None
        if use_llm:
            try:
                llm_result = analyze_sentiment_llm(
                    text, speaker_id, context_window, api_key=None, verbose=False
                )
                if verbose:
                    print(f"🧠 LLM result: {llm_result['category']} (confidence: {llm_result['confidence']:.1%})")
            except Exception as e:
                if verbose:
                    print(f"⚠️ LLM analysis failed, using transformer only: {e}")
                llm_result = None
        
        # Combine results based on strategy
        if llm_result is None:
            # Only transformer available - enhance its result
            final_result = transformer_result.copy()
            final_result['analysis_source'] = 'transformer_only'
            final_result['combination_strategy'] = 'fallback'
            
            # ENHANCED: Boost transformer confidence when it's the only source
            if transformer_result['confidence'] > 0.6:
                final_result['confidence'] = min(0.95, transformer_result['confidence'] * 1.1)
            
        else:
            # Both analyses available - combine them intelligently
            final_result = self._combine_analyses(transformer_result, llm_result)
        
        # Add metadata about the combination
        final_result['has_llm'] = llm_result is not None
        final_result['transformer_category'] = transformer_result['category']
        final_result['llm_category'] = llm_result['category'] if llm_result else None
        final_result['confidence_sources'] = {
            'transformer': transformer_result['confidence'],
            'llm': llm_result['confidence'] if llm_result else None
        }
        
        if verbose:
            self._print_combination_details(transformer_result, llm_result, final_result)
        
        return final_result
    
    def _combine_analyses(self, transformer_result: Dict, llm_result: Dict) -> Dict:
        """Combine transformer and LLM analysis results based on strategy"""
        
        if self.strategy == CombinationStrategy.TRANSFORMER_PRIMARY:
            return self._transformer_primary_combination(transformer_result, llm_result)
        
        elif self.strategy == CombinationStrategy.LLM_PRIMARY:
            return self._llm_primary_combination(transformer_result, llm_result)
        
        elif self.strategy == CombinationStrategy.HIGHEST_CONFIDENCE:
            return self._highest_confidence_combination(transformer_result, llm_result)
        
        elif self.strategy == CombinationStrategy.CONSENSUS:
            return self._consensus_combination(transformer_result, llm_result)
        
        else:  # WEIGHTED_AVERAGE (default)
            return self._weighted_average_combination(transformer_result, llm_result)
    
    def _weighted_average_combination(self, transformer_result: Dict, llm_result: Dict) -> Dict:
        """Combine using weighted average of scores and confidence-based category selection"""
        
        # Calculate weighted score
        t_weight = self.weights['transformer']
        l_weight = self.weights['llm']
        
        combined_score = (transformer_result['score'] * t_weight + 
                         llm_result['score'] * l_weight)
        
        # Calculate combined confidence (weighted average)
        combined_confidence = (transformer_result['confidence'] * t_weight + 
                              llm_result['confidence'] * l_weight)
        
        # Determine final category - prefer the analysis with higher confidence
        if transformer_result['confidence'] >= llm_result['confidence']:
            final_category = transformer_result['category']
            primary_source = 'transformer'
        else:
            final_category = llm_result['category']
            primary_source = 'llm'
        
        # Create combined explanation
        explanation = f"Combined analysis (primary: {primary_source}). "
        explanation += f"Transformer: {transformer_result['category']} ({transformer_result['confidence']:.1%}), "
        explanation += f"LLM: {llm_result['category']} ({llm_result['confidence']:.1%})"
        
        return {
            'score': combined_score,
            'confidence': combined_confidence,
            'category': final_category,
            'intensity': abs(combined_score),
            'label': self._score_to_label(combined_score),
            'explanation': explanation,
            'analysis_source': 'combined',
            'combination_strategy': 'weighted_average',
            'primary_source': primary_source
        }
    
    def _highest_confidence_combination(self, transformer_result: Dict, llm_result: Dict) -> Dict:
        """Use the analysis with higher confidence"""
        
        if transformer_result['confidence'] >= llm_result['confidence']:
            result = transformer_result.copy()
            result['analysis_source'] = 'transformer_confident'
        else:
            result = llm_result.copy()
            result['analysis_source'] = 'llm_confident'
        
        result['combination_strategy'] = 'highest_confidence'
        return result
    
    def _consensus_combination(self, transformer_result: Dict, llm_result: Dict) -> Dict:
        """Combine based on agreement between analyses"""
        
        # Check if both analyses agree on category
        if transformer_result['category'] == llm_result['category']:
            # Perfect agreement - use averaged scores with boosted confidence
            combined_score = (transformer_result['score'] + llm_result['score']) / 2
            combined_confidence = min(0.95, (transformer_result['confidence'] + 
                                           llm_result['confidence']) / 2 + 0.1)  # Boost for agreement
            
            return {
                'score': combined_score,
                'confidence': combined_confidence,
                'category': transformer_result['category'],  # Same for both
                'intensity': abs(combined_score),
                'label': self._score_to_label(combined_score),
                'explanation': f"Strong consensus between analyses on {transformer_result['category']}",
                'analysis_source': 'consensus',
                'combination_strategy': 'consensus',
                'agreement': True
            }
        else:
            # Disagreement - fall back to weighted average with reduced confidence
            result = self._weighted_average_combination(transformer_result, llm_result)
            result['confidence'] *= 0.8  # Reduce confidence due to disagreement
            result['combination_strategy'] = 'consensus_fallback'
            result['agreement'] = False
            result['explanation'] += " (analyses disagreed, confidence reduced)"
            return result
    
    def _transformer_primary_combination(self, transformer_result: Dict, llm_result: Dict) -> Dict:
        """Use transformer as primary, LLM for confidence adjustment"""
        result = transformer_result.copy()
        
        # Adjust confidence based on LLM agreement
        if transformer_result['category'] == llm_result['category']:
            result['confidence'] = min(0.95, result['confidence'] + 0.1)  # Boost for agreement
        else:
            result['confidence'] *= 0.9  # Slight reduction for disagreement
        
        result['analysis_source'] = 'transformer_primary'
        result['combination_strategy'] = 'transformer_primary'
        return result
    
    def _llm_primary_combination(self, transformer_result: Dict, llm_result: Dict) -> Dict:
        """Use LLM as primary, transformer for confidence adjustment"""
        result = llm_result.copy()
        
        # Adjust confidence based on transformer agreement
        if transformer_result['category'] == llm_result['category']:
            result['confidence'] = min(0.95, result['confidence'] + 0.1)  # Boost for agreement
        else:
            result['confidence'] *= 0.9  # Slight reduction for disagreement
        
        result['analysis_source'] = 'llm_primary'
        result['combination_strategy'] = 'llm_primary'
        return result
    
    def _score_to_label(self, score: float) -> str:
        """Convert score to sentiment label"""
        if score >= 0.6:
            return "very_positive"
        elif score >= 0.2:
            return "positive"
        elif score >= -0.1:
            return "neutral"
        elif score >= -0.3:
            return "negative"
        else:
            return "very_negative"
    
    def _create_fallback_result(self, text: str, error_type: str) -> Dict:
        """Create fallback result when analysis fails"""
        return {
            "score": 0.0,
            "label": "neutral",
            "category": "reflective_neutral",
            "intensity": 0.0,
            "confidence": 0.0,
            "explanation": f"Analysis failed ({error_type}). Fallback neutral classification."
        }
    
    def _print_combination_details(self, transformer_result: Dict, llm_result: Dict, final_result: Dict):
        """Print detailed information about the combination process"""
        print("\n" + "="*60)
        print("🔄 COMBINED SENTIMENT ANALYSIS")
        print("="*60)
        
        print(f"\n📊 TRANSFORMER ANALYSIS:")
        print(f"   Category: {transformer_result['category']}")
        print(f"   Score: {transformer_result['score']:.3f}")
        print(f"   Confidence: {transformer_result['confidence']:.1%}")
        
        if llm_result:
            print(f"\n🤖 LLM ANALYSIS:")
            print(f"   Category: {llm_result['category']}")
            print(f"   Score: {llm_result['score']:.3f}")
            print(f"   Confidence: {llm_result['confidence']:.1%}")
        
        print(f"\n🎯 FINAL COMBINED RESULT:")
        print(f"   Category: {final_result['category']}")
        print(f"   Score: {final_result['score']:.3f}")
        print(f"   Confidence: {final_result['confidence']:.1%}")
        print(f"   Strategy: {final_result.get('combination_strategy', 'unknown')}")
        print(f"   Source: {final_result.get('analysis_source', 'unknown')}")
        
        if 'agreement' in final_result:
            agreement_status = "✅ AGREE" if final_result['agreement'] else "⚠️ DISAGREE"
            print(f"   Agreement: {agreement_status}")


# Create singleton instance with default strategy
_combined_analyzer = None

def get_combined_analyzer(strategy=CombinationStrategy.WEIGHTED_AVERAGE):
    """Get or create singleton combined analyzer"""
    global _combined_analyzer
    if _combined_analyzer is None:
        _combined_analyzer = CombinedSentimentAnalyzer(strategy)
    return _combined_analyzer

def analyze_sentiment_combined(text: str, speaker_id: Optional[str] = None, 
                             context_window: Optional[List[str]] = None,
                             use_llm: bool = True, verbose: bool = True) -> Dict:
    """
    Analyze sentiment using combined LLM and transformer approach.
    
    Args:
        text: Text to analyze
        speaker_id: Optional speaker identifier
        context_window: Optional context window
        use_llm: Whether to use LLM analysis
        verbose: Whether to show detailed output
        
    Returns:
        Combined sentiment analysis result
    """
    analyzer = get_combined_analyzer()
    return analyzer.analyze(text, speaker_id, context_window, use_llm, verbose)

# Export main function
__all__ = ['CombinedSentimentAnalyzer', 'CombinationStrategy', 'analyze_sentiment_combined'] 