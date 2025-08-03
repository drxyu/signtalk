import asyncio
import json
from typing import Optional, Dict, Any
import numpy as np
from datetime import datetime

class SpeechRecognitionService:
    def __init__(self):
        self.is_listening = False
        self.audio_buffer = []
        self.sample_rate = 16000
        self.chunk_size = 1024
        
    async def process_audio_chunk(self, audio_data: bytes) -> Optional[Dict[str, Any]]:
        """Process incoming audio chunks for speech recognition"""
        try:
            # Convert bytes to numpy array
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            self.audio_buffer.append(audio_array)
            
            # Check if we have enough audio to process
            if len(self.audio_buffer) > 10:  # About 0.5 seconds of audio
                # Here we would integrate with actual speech recognition
                # For now, return mock data for demo
                result = await self._mock_speech_recognition()
                self.audio_buffer = []  # Clear buffer after processing
                return result
                
        except Exception as e:
            print(f"Error processing audio: {e}")
            return None
            
    async def _mock_speech_recognition(self) -> Dict[str, Any]:
        """Mock speech recognition for demo purposes"""
        # Simulate some common phrases
        phrases = [
            "Hello, how are you?",
            "Thank you very much",
            "Can you help me?",
            "Where is the bathroom?",
            "Nice to meet you"
        ]
        
        import random
        detected_text = random.choice(phrases)
        
        return {
            "type": "speech",
            "text": detected_text,
            "confidence": 0.92,
            "language": "en-US",
            "timestamp": datetime.now().isoformat()
        }
        
    def start_listening(self):
        """Start listening for audio input"""
        self.is_listening = True
        self.audio_buffer = []
        
    def stop_listening(self):
        """Stop listening for audio input"""
        self.is_listening = False
        self.audio_buffer = []
        
    def get_audio_level(self, audio_data: bytes) -> float:
        """Calculate the current audio level for visualization"""
        try:
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            # Calculate RMS (Root Mean Square) for volume level
            rms = np.sqrt(np.mean(audio_array**2))
            # Normalize to 0-1 range
            normalized_level = min(1.0, rms / 32768.0)
            return normalized_level
        except:
            return 0.0