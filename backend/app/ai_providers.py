import os
import json
import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime
from abc import ABC, abstractmethod
import asyncio
from dotenv import load_dotenv

load_dotenv()

class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    async def translate_speech_to_sign(self, text: str, context: List[Dict] = None) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def translate_sign_to_speech(self, gesture: str, context: List[Dict] = None) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def get_suggestions(self, current_input: str, mode: str) -> List[str]:
        pass

class OpenAIProvider(AIProvider):
    """OpenAI GPT provider"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.base_url = "https://api.openai.com/v1/chat/completions"
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        
    async def translate_speech_to_sign(self, text: str, context: List[Dict] = None) -> Dict[str, Any]:
        if not self.api_key:
            return self._mock_response("speech_to_sign", text)
            
        try:
            prompt = self._create_speech_to_sign_prompt(text, context)
            response = await self._call_api(prompt)
            return self._parse_sign_response(response)
        except Exception as e:
            print(f"OpenAI error: {e}")
            return self._mock_response("speech_to_sign", text)
    
    async def translate_sign_to_speech(self, gesture: str, context: List[Dict] = None) -> Dict[str, Any]:
        if not self.api_key:
            return self._mock_response("sign_to_speech", gesture)
            
        try:
            prompt = self._create_sign_to_speech_prompt(gesture, context)
            response = await self._call_api(prompt)
            return self._parse_speech_response(response)
        except Exception as e:
            print(f"OpenAI error: {e}")
            return self._mock_response("sign_to_speech", gesture)
    
    async def _call_api(self, prompt: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": "You are an expert ASL translator."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 200
                }
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
    
    def _create_speech_to_sign_prompt(self, text: str, context: List[Dict] = None) -> str:
        return f"""Convert this English to ASL gloss notation:
"{text}"

Return JSON: {{"gloss": "ASL GLOSS", "signs": ["sign1", "sign2"], "facial_expression": "neutral"}}"""
    
    def _create_sign_to_speech_prompt(self, gesture: str, context: List[Dict] = None) -> str:
        return f"""Convert this ASL sign to natural English:
"{gesture}"

Return JSON: {{"text": "Natural English", "variations": ["alt1", "alt2"], "confidence": 0.9}}"""
    
    def _parse_sign_response(self, response: str) -> Dict[str, Any]:
        try:
            data = json.loads(response)
            return {
                "success": True,
                "gloss": data.get("gloss", ""),
                "signs": data.get("signs", []),
                "facial_expression": data.get("facial_expression", "neutral"),
                "timestamp": datetime.now().isoformat()
            }
        except:
            return self._mock_response("speech_to_sign", response)
    
    def _parse_speech_response(self, response: str) -> Dict[str, Any]:
        try:
            data = json.loads(response)
            return {
                "success": True,
                "text": data.get("text", ""),
                "variations": data.get("variations", []),
                "confidence": data.get("confidence", 0.9),
                "timestamp": datetime.now().isoformat()
            }
        except:
            return self._mock_response("sign_to_speech", response)
    
    def _mock_response(self, mode: str, input_text: str) -> Dict[str, Any]:
        # Same mock logic as CerebrasClient
        if mode == "speech_to_sign":
            return {
                "success": True,
                "gloss": "MOCK TRANSLATION",
                "signs": ["hello", "what"],
                "facial_expression": "neutral",
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "success": True,
                "text": f"Mock translation for {input_text}",
                "variations": [],
                "confidence": 0.8,
                "timestamp": datetime.now().isoformat()
            }
    
    def get_suggestions(self, current_input: str, mode: str) -> List[str]:
        if mode == "speech_to_sign":
            return ["How are you?", "Thank you", "Nice to meet you"]
        else:
            return ["thank_you", "yes", "no", "help"]

class AnthropicProvider(AIProvider):
    """Anthropic Claude provider"""
    
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.base_url = "https://api.anthropic.com/v1/messages"
        self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
        
    async def translate_speech_to_sign(self, text: str, context: List[Dict] = None) -> Dict[str, Any]:
        if not self.api_key:
            return self._mock_response("speech_to_sign", text)
            
        try:
            prompt = self._create_speech_to_sign_prompt(text, context)
            response = await self._call_api(prompt)
            return self._parse_sign_response(response)
        except Exception as e:
            print(f"Anthropic error: {e}")
            return self._mock_response("speech_to_sign", text)
    
    async def translate_sign_to_speech(self, gesture: str, context: List[Dict] = None) -> Dict[str, Any]:
        if not self.api_key:
            return self._mock_response("sign_to_speech", gesture)
            
        try:
            prompt = self._create_sign_to_speech_prompt(gesture, context)
            response = await self._call_api(prompt)
            return self._parse_speech_response(response)
        except Exception as e:
            print(f"Anthropic error: {e}")
            return self._mock_response("sign_to_speech", gesture)
    
    async def _call_api(self, prompt: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.base_url,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.3
                }
            )
            response.raise_for_status()
            return response.json()["content"][0]["text"]
    
    def _create_speech_to_sign_prompt(self, text: str, context: List[Dict] = None) -> str:
        return f"""You are an expert ASL translator. Convert this English to ASL gloss notation:
"{text}"

Return only JSON: {{"gloss": "ASL GLOSS", "signs": ["sign1", "sign2"], "facial_expression": "neutral"}}"""
    
    def _create_sign_to_speech_prompt(self, gesture: str, context: List[Dict] = None) -> str:
        return f"""You are an expert ASL translator. Convert this ASL sign to natural English:
"{gesture}"

Return only JSON: {{"text": "Natural English", "variations": ["alt1", "alt2"], "confidence": 0.9}}"""
    
    def _parse_sign_response(self, response: str) -> Dict[str, Any]:
        try:
            data = json.loads(response)
            return {
                "success": True,
                "gloss": data.get("gloss", ""),
                "signs": data.get("signs", []),
                "facial_expression": data.get("facial_expression", "neutral"),
                "timestamp": datetime.now().isoformat()
            }
        except:
            return self._mock_response("speech_to_sign", response)
    
    def _parse_speech_response(self, response: str) -> Dict[str, Any]:
        try:
            data = json.loads(response)
            return {
                "success": True,
                "text": data.get("text", ""),
                "variations": data.get("variations", []),
                "confidence": data.get("confidence", 0.9),
                "timestamp": datetime.now().isoformat()
            }
        except:
            return self._mock_response("sign_to_speech", response)
    
    def _mock_response(self, mode: str, input_text: str) -> Dict[str, Any]:
        if mode == "speech_to_sign":
            return {
                "success": True,
                "gloss": "MOCK TRANSLATION",
                "signs": ["hello", "what"],
                "facial_expression": "neutral",
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "success": True,
                "text": f"Mock translation for {input_text}",
                "variations": [],
                "confidence": 0.8,
                "timestamp": datetime.now().isoformat()
            }
    
    def get_suggestions(self, current_input: str, mode: str) -> List[str]:
        if mode == "speech_to_sign":
            return ["How are you?", "Thank you", "Nice to meet you"]
        else:
            return ["thank_you", "yes", "no", "help"]

class MockProvider(AIProvider):
    """Mock provider for testing without API keys"""
    
    async def translate_speech_to_sign(self, text: str, context: List[Dict] = None) -> Dict[str, Any]:
        text_lower = text.lower()
        
        # Enhanced mock translations
        mock_translations = {
            "hello": {"gloss": "HELLO WAVE", "signs": ["hello"], "expression": "smile"},
            "thank you": {"gloss": "THANK-YOU", "signs": ["thank_you"], "expression": "neutral"},
            "how are you": {"gloss": "HOW YOU ?", "signs": ["how", "you"], "expression": "questioning"},
            "yes": {"gloss": "YES NOD", "signs": ["yes"], "expression": "affirm"},
            "no": {"gloss": "NO SHAKE", "signs": ["no"], "expression": "negate"},
            "please": {"gloss": "PLEASE", "signs": ["please"], "expression": "polite"},
            "help": {"gloss": "HELP ME", "signs": ["help"], "expression": "urgent"},
            "i love you": {"gloss": "I-LOVE-YOU", "signs": ["i_love_you"], "expression": "affection"},
            "stop": {"gloss": "STOP", "signs": ["stop"], "expression": "firm"},
            "good": {"gloss": "GOOD", "signs": ["good"], "expression": "positive"},
            "bad": {"gloss": "BAD", "signs": ["bad"], "expression": "negative"},
            "where": {"gloss": "WHERE ?", "signs": ["where"], "expression": "questioning"},
            "what": {"gloss": "WHAT ?", "signs": ["what"], "expression": "questioning"},
            "who": {"gloss": "WHO ?", "signs": ["who"], "expression": "questioning"},
            "finish": {"gloss": "FINISH", "signs": ["finish"], "expression": "neutral"}
        }
        
        for phrase, translation in mock_translations.items():
            if phrase in text_lower:
                return {
                    "success": True,
                    "gloss": translation["gloss"],
                    "signs": translation["signs"],
                    "facial_expression": translation["expression"],
                    "notes": "Mock translation",
                    "timestamp": datetime.now().isoformat()
                }
        
        # Default: split into words and look for individual signs
        words = text_lower.split()
        signs = []
        for word in words:
            for phrase, translation in mock_translations.items():
                if word in phrase:
                    signs.extend(translation["signs"])
                    break
        
        if not signs:
            signs = ["what"]
        
        return {
            "success": True,
            "gloss": " ".join(signs).upper(),
            "signs": signs,
            "facial_expression": "neutral",
            "notes": "Mock translation",
            "timestamp": datetime.now().isoformat()
        }
    
    async def translate_sign_to_speech(self, gesture: str, context: List[Dict] = None) -> Dict[str, Any]:
        mock_responses = {
            "hello": {"text": "Hello! Nice to see you.", "variations": ["Hi there!", "Hello!", "Greetings!"]},
            "thank_you": {"text": "Thank you so much!", "variations": ["Thanks!", "I appreciate it"]},
            "help": {"text": "Can you help me please?", "variations": ["I need help", "Help me"]},
            "yes": {"text": "Yes, I agree.", "variations": ["Yes", "That's right", "Correct"]},
            "no": {"text": "No, I don't think so.", "variations": ["No", "I disagree"]},
            "stop": {"text": "Stop right there!", "variations": ["Stop", "Hold on", "Wait"]},
            "good": {"text": "That's really good!", "variations": ["Good", "Great", "Excellent"]},
            "bad": {"text": "That's not good.", "variations": ["Bad", "Not good", "Poor"]},
            "what": {"text": "What do you mean?", "variations": ["What?", "What is it?"]},
            "where": {"text": "Where is it?", "variations": ["Where?", "Which place?"]},
            "who": {"text": "Who is that?", "variations": ["Who?", "Which person?"]},
            "please": {"text": "Please, if you could.", "variations": ["Please", "If you would"]},
            "more": {"text": "I need more information.", "variations": ["More", "Additional"]},
            "finish": {"text": "I'm finished.", "variations": ["Done", "Complete", "Finished"]},
            "i_love_you": {"text": "I love you!", "variations": ["Love you", "I love you too"]}
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
        if mode == "speech_to_sign":
            suggestions = {
                "hello": ["How are you?", "Nice to meet you", "What's your name?"],
                "thank": ["You're welcome", "I appreciate it", "No problem"],
                "how": ["How are you?", "How can I help?", "How much?"],
                "": ["Hello", "Thank you", "Please help me"]
            }
            
            for key in suggestions:
                if key in current_input.lower():
                    return suggestions[key]
            return suggestions[""]
        else:
            return ["thank_you", "yes", "no", "help", "please"]

class AIProviderFactory:
    """Factory to create AI providers based on configuration"""
    
    @staticmethod
    def create_provider(provider_name: str = None) -> AIProvider:
        """Create an AI provider instance"""
        
        # If no provider specified, check environment
        if not provider_name:
            provider_name = os.getenv("AI_PROVIDER", "mock").lower()
        
        # Check for API keys and return appropriate provider
        if provider_name == "cerebras" and os.getenv("CEREBRAS_API_KEY"):
            # Import here to avoid circular dependency
            from .cerebras_client import CerebrasClient
            # Wrap CerebrasClient with adapter pattern
            class CerebrasAdapter(AIProvider):
                def __init__(self):
                    self.client = CerebrasClient()
                
                async def translate_speech_to_sign(self, text: str, context: List[Dict] = None) -> Dict[str, Any]:
                    return await self.client.translate_speech_to_sign(text, context)
                
                async def translate_sign_to_speech(self, gesture: str, context: List[Dict] = None) -> Dict[str, Any]:
                    return await self.client.translate_sign_to_speech(gesture, context)
                
                def get_suggestions(self, current_input: str, mode: str) -> List[str]:
                    return self.client.get_suggestions(current_input, mode)
            
            return CerebrasAdapter()
        elif provider_name == "openai" and os.getenv("OPENAI_API_KEY"):
            return OpenAIProvider()
        elif provider_name == "anthropic" and os.getenv("ANTHROPIC_API_KEY"):
            return AnthropicProvider()
        else:
            # Default to mock provider
            print(f"Using mock provider (requested: {provider_name})")
            return MockProvider()