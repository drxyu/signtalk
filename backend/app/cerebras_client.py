import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
from dotenv import load_dotenv

# Try to import Cerebras SDK
try:
    from cerebras.cloud.sdk import Cerebras
    CEREBRAS_AVAILABLE = True
except ImportError:
    CEREBRAS_AVAILABLE = False
    print("Cerebras SDK not available, using mock responses")

load_dotenv()

class CerebrasClient:
    def __init__(self):
        self.api_key = os.getenv("CEREBRAS_API_KEY", "")
        self.client = None
        self.model = "llama3.1-8b"  # Default model
        
        if CEREBRAS_AVAILABLE and self.api_key:
            try:
                self.client = Cerebras(api_key=self.api_key)
                print("Cerebras client initialized successfully")
            except Exception as e:
                print(f"Failed to initialize Cerebras client: {e}")
                self.client = None
        else:
            print("Using mock Cerebras client")
    
    async def translate_speech_to_sign(self, text: str, context: List[Dict] = None) -> Dict[str, Any]:
        """Translate speech text to ASL gloss notation"""
        try:
            # Create prompt for speech to sign translation
            prompt = self._create_speech_to_sign_prompt(text, context)
            
            if self.client and CEREBRAS_AVAILABLE:
                # Real Cerebras API call
                response = await self._call_cerebras_api(prompt)
                return self._parse_sign_response(response)
            else:
                # Mock response for demo
                return self._mock_speech_to_sign_response(text)
                
        except Exception as e:
            print(f"Error in speech to sign translation: {e}")
            return {
                "success": False,
                "error": str(e),
                "signs": ["error"],
                "gloss": "ERROR"
            }
    
    async def translate_sign_to_speech(self, gesture: str, context: List[Dict] = None) -> Dict[str, Any]:
        """Translate sign gesture to natural language"""
        try:
            # Create prompt for sign to speech translation
            prompt = self._create_sign_to_speech_prompt(gesture, context)
            
            if self.client and CEREBRAS_AVAILABLE:
                # Real Cerebras API call
                response = await self._call_cerebras_api(prompt)
                return self._parse_speech_response(response)
            else:
                # Mock response for demo
                return self._mock_sign_to_speech_response(gesture)
                
        except Exception as e:
            print(f"Error in sign to speech translation: {e}")
            return {
                "success": False,
                "error": str(e),
                "text": "Error translating sign",
                "variations": []
            }
    
    async def _call_cerebras_api(self, prompt: str) -> str:
        """Make actual API call to Cerebras"""
        if not self.client:
            raise Exception("Cerebras client not initialized")
            
        # Async wrapper for sync API call
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert ASL translator. Provide accurate translations between English and ASL gloss notation."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                max_tokens=200,
                temperature=0.3
            )
        )
        
        return response.choices[0].message.content
    
    def _create_speech_to_sign_prompt(self, text: str, context: List[Dict] = None) -> str:
        """Create prompt for speech to sign translation"""
        context_str = ""
        if context:
            context_str = "Previous context:\n"
            for ctx in context[-3:]:  # Last 3 context items
                context_str += f"- {ctx.get('type', 'unknown')}: {ctx.get('content', '')}\n"
        
        prompt = f"""Convert this English sentence to ASL gloss notation.
{context_str}
English: "{text}"

Provide the response in this JSON format:
{{
    "gloss": "ASL GLOSS HERE",
    "signs": ["sign1", "sign2", "sign3"],
    "facial_expression": "neutral/questioning/emphasis",
    "notes": "any translation notes"
}}

Remember ASL grammar rules:
- Topic-comment structure
- Time indicators come first
- Questions use raised eyebrows
- Negation uses head shake"""
        
        return prompt
    
    def _create_sign_to_speech_prompt(self, gesture: str, context: List[Dict] = None) -> str:
        """Create prompt for sign to speech translation"""
        context_str = ""
        if context:
            context_str = "Previous context:\n"
            for ctx in context[-3:]:
                context_str += f"- {ctx.get('type', 'unknown')}: {ctx.get('content', '')}\n"
        
        prompt = f"""Convert this ASL sign/gesture to natural English.
{context_str}
ASL Sign: "{gesture}"

Provide the response in this JSON format:
{{
    "text": "Natural English translation",
    "variations": ["alternative1", "alternative2"],
    "context_dependent": true/false,
    "confidence": 0.0-1.0
}}

Consider context and provide the most natural English equivalent."""
        
        return prompt
    
    def _parse_sign_response(self, response: str) -> Dict[str, Any]:
        """Parse Cerebras response for sign translation"""
        try:
            # Try to parse JSON from response
            data = json.loads(response)
            return {
                "success": True,
                "gloss": data.get("gloss", ""),
                "signs": data.get("signs", []),
                "facial_expression": data.get("facial_expression", "neutral"),
                "notes": data.get("notes", ""),
                "timestamp": datetime.now().isoformat()
            }
        except:
            # Fallback if JSON parsing fails
            return {
                "success": True,
                "gloss": response.strip(),
                "signs": response.strip().split(),
                "facial_expression": "neutral",
                "notes": "",
                "timestamp": datetime.now().isoformat()
            }
    
    def _parse_speech_response(self, response: str) -> Dict[str, Any]:
        """Parse Cerebras response for speech translation"""
        try:
            # Try to parse JSON from response
            data = json.loads(response)
            return {
                "success": True,
                "text": data.get("text", ""),
                "variations": data.get("variations", []),
                "context_dependent": data.get("context_dependent", False),
                "confidence": data.get("confidence", 0.9),
                "timestamp": datetime.now().isoformat()
            }
        except:
            # Fallback if JSON parsing fails
            return {
                "success": True,
                "text": response.strip(),
                "variations": [],
                "context_dependent": False,
                "confidence": 0.8,
                "timestamp": datetime.now().isoformat()
            }
    
    def _mock_speech_to_sign_response(self, text: str) -> Dict[str, Any]:
        """Generate mock response for speech to sign translation"""
        text_lower = text.lower()
        
        # Simple keyword-based mock translation
        mock_translations = {
            "hello": {"gloss": "HELLO WAVE", "signs": ["hello"]},
            "thank you": {"gloss": "THANK-YOU", "signs": ["thank_you"]},
            "how are you": {"gloss": "HOW YOU ?", "signs": ["how", "you", "question"]},
            "yes": {"gloss": "YES", "signs": ["yes"]},
            "no": {"gloss": "NO", "signs": ["no"]},
            "please": {"gloss": "PLEASE", "signs": ["please"]},
            "help": {"gloss": "HELP ME", "signs": ["help"]},
            "stop": {"gloss": "STOP", "signs": ["stop"]},
            "i love you": {"gloss": "I LOVE YOU", "signs": ["i_love_you"]},
        }
        
        # Check for matches
        for phrase, translation in mock_translations.items():
            if phrase in text_lower:
                return {
                    "success": True,
                    "gloss": translation["gloss"],
                    "signs": translation["signs"],
                    "facial_expression": "neutral",
                    "notes": "Mock translation",
                    "timestamp": datetime.now().isoformat()
                }
        
        # Default response
        return {
            "success": True,
            "gloss": "UNKNOWN SIGN",
            "signs": ["what"],
            "facial_expression": "questioning",
            "notes": "No translation available",
            "timestamp": datetime.now().isoformat()
        }
    
    def _mock_sign_to_speech_response(self, gesture: str) -> Dict[str, Any]:
        """Generate mock response for sign to speech translation"""
        # Already handled in translation_engine.py mapping
        # This provides additional context-aware responses
        
        mock_responses = {
            "hello": {
                "text": "Hello! Nice to see you.",
                "variations": ["Hi there!", "Hello!", "Greetings!"]
            },
            "thank_you": {
                "text": "Thank you so much!",
                "variations": ["Thanks!", "I appreciate it", "Thank you"]
            },
            "help": {
                "text": "Can you help me please?",
                "variations": ["I need help", "Help me", "Could you assist?"]
            },
            "yes": {
                "text": "Yes, I agree.",
                "variations": ["Yes", "That's right", "Correct"]
            },
            "no": {
                "text": "No, I don't think so.",
                "variations": ["No", "I disagree", "That's not right"]
            }
        }
        
        response = mock_responses.get(gesture, {
            "text": f"The sign for {gesture}",
            "variations": []
        })
        
        return {
            "success": True,
            "text": response["text"],
            "variations": response.get("variations", []),
            "context_dependent": False,
            "confidence": 0.95,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_suggestions(self, current_input: str, mode: str) -> List[str]:
        """Get contextual suggestions for next likely input"""
        if mode == "speech_to_sign":
            # Common phrases after current input
            suggestions_map = {
                "hello": ["How are you?", "Nice to meet you", "What's your name?"],
                "thank": ["You're welcome", "I appreciate it", "No problem"],
                "how": ["How are you?", "How can I help?", "How much?"],
                "": ["Hello", "Thank you", "Please help me"]  # Default
            }
            
            for key in suggestions_map:
                if key in current_input.lower():
                    return suggestions_map[key]
            return suggestions_map[""]
        
        else:  # sign_to_speech mode
            # Common sign sequences
            return ["thank_you", "yes", "no", "help", "please"]