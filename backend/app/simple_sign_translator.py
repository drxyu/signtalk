"""
Simple sign language translator that works without external dependencies.
This provides basic functionality when the SLP library is not available.
"""

import asyncio
from typing import Dict, List, Optional, Any
import numpy as np
import json

class SimpleSignTranslator:
    """Fallback translator using rule-based approach"""
    
    def __init__(self):
        # Basic sign mappings
        self.text_to_signs = {
            "hello": ["HELLO"],
            "hi": ["HELLO"],
            "how are you": ["HOW", "YOU"],
            "thank you": ["THANK-YOU"],
            "thanks": ["THANK-YOU"],
            "please": ["PLEASE"],
            "sorry": ["SORRY"],
            "yes": ["YES"],
            "no": ["NO"],
            "good": ["GOOD"],
            "bad": ["BAD"],
            "morning": ["MORNING"],
            "night": ["NIGHT"],
            "goodbye": ["GOODBYE"],
            "bye": ["GOODBYE"],
            "i love you": ["I-LOVE-YOU"],
            "help": ["HELP"],
            "what": ["WHAT"],
            "where": ["WHERE"],
            "when": ["WHEN"],
            "who": ["WHO"],
            "why": ["WHY"],
            "how": ["HOW"],
            "name": ["NAME"],
            "my": ["MY"],
            "your": ["YOUR"],
            "nice to meet you": ["NICE", "MEET", "YOU"],
        }
        
        # Common ASL grammar rules
        self.grammar_rules = {
            "question_words": ["what", "where", "when", "who", "why", "how"],
            "pronouns": ["i", "you", "he", "she", "it", "we", "they"],
            "possessives": ["my", "your", "his", "her", "its", "our", "their"]
        }
        
    async def translate_text_to_signs(self, text: str, context: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Translate text to sign representation using rules"""
        try:
            text_lower = text.lower().strip()
            signs = []
            
            # Check for exact phrase matches first
            if text_lower in self.text_to_signs:
                signs = self.text_to_signs[text_lower]
            else:
                # Break into words and translate
                words = text_lower.split()
                
                for word in words:
                    if word in self.text_to_signs:
                        signs.extend(self.text_to_signs[word])
                    else:
                        # Check if it's a question word
                        if word in self.grammar_rules["question_words"]:
                            signs.append(word.upper())
                        # Check if it's a pronoun
                        elif word in self.grammar_rules["pronouns"]:
                            signs.append(word.upper())
                        # For unknown words, fingerspell or use the word itself
                        else:
                            signs.append(f"[{word.upper()}]")
            
            # Apply basic ASL grammar rules
            signs = self._apply_asl_grammar(signs, text_lower)
            
            return {
                "success": True,
                "signs": signs,
                "gloss": " ".join(signs),
                "detailed_signs": [{"gloss": sign, "duration": 1.0} for sign in signs],
                "landmarks": [],  # No landmark generation in simple mode
                "confidence": 0.7,
                "language": "ASL",
                "method": "rule-based"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "signs": [],
                "gloss": ""
            }
    
    def _apply_asl_grammar(self, signs: List[str], original_text: str) -> List[str]:
        """Apply basic ASL grammar transformations"""
        # ASL typically puts question words at the end
        if any(word in original_text for word in self.grammar_rules["question_words"]):
            # Move question words to the end
            question_signs = [s for s in signs if s.lower() in self.grammar_rules["question_words"]]
            other_signs = [s for s in signs if s.lower() not in self.grammar_rules["question_words"]]
            signs = other_signs + question_signs
        
        # Remove articles (a, an, the) - ASL doesn't use them
        signs = [s for s in signs if s.lower() not in ["a", "an", "the"]]
        
        # Remove "to be" verbs in many contexts
        signs = [s for s in signs if s.lower() not in ["am", "is", "are", "was", "were"]]
        
        return signs
    
    async def translate_landmarks_to_text(self, landmarks: List[Dict], context: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Translate landmarks to text - simplified version"""
        # This is a placeholder - real landmark translation requires ML models
        return {
            "success": False,
            "text": "Landmark translation requires ML models",
            "variations": [],
            "confidence": 0.0,
            "method": "not-implemented"
        }
    
    def get_supported_signs(self) -> List[str]:
        """Get list of supported signs"""
        all_signs = set()
        for signs in self.text_to_signs.values():
            all_signs.update(signs)
        return sorted(list(all_signs))