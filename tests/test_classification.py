import unittest
from sentiment_analysis.advanced_classifier import AdvancedHopeSorrowClassifier, EmotionCategory
from sentiment_analysis.sa_transformers import analyze_sentiment as analyze_transformer
from sentiment_analysis.sa_LLM import analyze_sentiment as analyze_llm

class TestAdvancedClassification(unittest.TestCase):
    def setUp(self):
        self.classifier = AdvancedHopeSorrowClassifier()
        
        # Test cases for different emotional categories
        self.test_cases = {
            "hope": [
                "I will achieve my dreams and make a better future for myself.",
                "I'm going to learn from this experience and grow stronger.",
                "There's a possibility that things will get better soon."
            ],
            "sorrow": [
                "I lost everything I worked for and it's all gone now.",
                "I should have made different choices, I regret my mistakes.",
                "The pain is too much to bear, I feel broken inside."
            ],
            "transformative": [
                "I was hurt, but I've learned to heal and move forward.",
                "Despite the challenges, I'm finding strength in myself.",
                "I realized that my past mistakes don't define my future."
            ],
            "ambivalent": [
                "I'm excited about the future but scared of what might happen.",
                "I want to move on but I can't let go of the past.",
                "I see the possibilities but I'm worried about the risks."
            ],
            "reflective_neutral": [
                "I'm thinking about what this experience means to me.",
                "I need to understand why things happened this way.",
                "Let me reflect on what I've learned from this situation."
            ]
        }
    
    def test_basic_classification(self):
        """Test basic classification of different emotional categories."""
        for category, texts in self.test_cases.items():
            for text in texts:
                result = self.classifier.classify_emotion(
                    text=text,
                    sentiment_score=0.0,  # Neutral base sentiment
                    speaker_id="test_speaker"
                )
                self.assertEqual(result.category.value, category)
    
    def test_pattern_detection(self):
        """Test detection of linguistic patterns."""
        text = "I will learn from my mistakes and grow stronger, despite the pain."
        result = self.classifier.classify_emotion(
            text=text,
            sentiment_score=0.0,
            speaker_id="test_speaker"
        )
        
        # Should detect both hope and transformative patterns
        categories = {pattern.category.value for pattern, _ in result.matched_patterns}
        self.assertTrue("hope" in categories)
        self.assertTrue("transformative" in categories)
    
    def test_speaker_calibration(self):
        """Test speaker-specific calibration."""
        speaker_id = "test_speaker"
        
        # Initial classification
        result1 = self.classifier.classify_emotion(
            text="I hope for a better future.",
            sentiment_score=0.5,
            speaker_id=speaker_id
        )
        
        # Update speaker profile
        self.classifier.update_speaker_profile(speaker_id, EmotionCategory.HOPE, 0.8)
        
        # Second classification should be influenced by calibration
        result2 = self.classifier.classify_emotion(
            text="I hope for a better future.",
            sentiment_score=0.5,
            speaker_id=speaker_id
        )
        
        self.assertNotEqual(result1.confidence, result2.confidence)
    
    def test_narrative_arc(self):
        """Test narrative arc detection."""
        speaker_id = "test_speaker"
        context = [
            "I lost everything I had.",
            "The pain was unbearable.",
            "But I learned to heal.",
            "Now I'm moving forward.",
            "I will create a better future."
        ]
        
        # Process each utterance in sequence
        results = []
        for text in context:
            result = self.classifier.classify_emotion(
                text=text,
                sentiment_score=0.0,
                speaker_id=speaker_id,
                context_window=context[:len(results)]
            )
            results.append(result)
        
        # Check for transformative progression
        self.assertEqual(results[0].category.value, "sorrow")
        self.assertEqual(results[-1].category.value, "hope")
        self.assertTrue(any(r.category.value == "transformative" for r in results))
    
    def test_transformer_integration(self):
        """Test integration with transformer-based sentiment analysis."""
        text = "I will overcome these challenges and create a better future."
        result = analyze_transformer(text, speaker_id="test_speaker")
        
        self.assertEqual(result["category"], "hope")
        self.assertTrue("matched_patterns" in result)
        self.assertTrue("classification_confidence" in result)
    
    def test_llm_integration(self):
        """Test integration with LLM-based sentiment analysis."""
        text = "I will overcome these challenges and create a better future."
        result = analyze_llm(text, speaker_id="test_speaker")
        
        self.assertEqual(result["category"], "hope")
        self.assertTrue("matched_patterns" in result)
        self.assertTrue("classification_confidence" in result)
    
    def test_edge_cases(self):
        """Test handling of edge cases."""
        # Empty text
        result = self.classifier.classify_emotion(
            text="",
            sentiment_score=0.0,
            speaker_id="test_speaker"
        )
        self.assertEqual(result.category.value, "reflective_neutral")
        
        # Very long text
        long_text = "hope " * 1000
        result = self.classifier.classify_emotion(
            text=long_text,
            sentiment_score=0.0,
            speaker_id="test_speaker"
        )
        self.assertEqual(result.category.value, "hope")
        
        # Mixed emotions
        mixed_text = "I'm happy about the future but sad about the past."
        result = self.classifier.classify_emotion(
            text=mixed_text,
            sentiment_score=0.0,
            speaker_id="test_speaker"
        )
        self.assertEqual(result.category.value, "ambivalent")

if __name__ == "__main__":
    unittest.main() 