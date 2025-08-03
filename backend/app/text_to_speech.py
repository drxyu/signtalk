import asyncio
import os
from typing import Optional, List, Dict
import base64
from datetime import datetime

# Try to import pyttsx3, but gracefully handle if not available
PYTTSX3_AVAILABLE = False
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False
    print("pyttsx3 not available, using mock TTS")

class TextToSpeechService:
    def __init__(self):
        self.voices = []
        self.current_voice_id = None
        self.rate = 150  # Words per minute
        self.volume = 0.9
        
        if PYTTSX3_AVAILABLE:
            try:
                self.engine = pyttsx3.init()
                self._setup_engine()
            except:
                self.engine = None
                print("Failed to initialize pyttsx3, using mock TTS")
        
    def _setup_engine(self):
        """Setup the TTS engine with default settings"""
        if PYTTSX3_AVAILABLE and hasattr(self, 'engine'):
            self.engine.setProperty('rate', self.rate)
            self.engine.setProperty('volume', self.volume)
            
            # Get available voices
            voices = self.engine.getProperty('voices')
            self.voices = [
                {
                    "id": voice.id,
                    "name": voice.name,
                    "language": getattr(voice, 'languages', ['en'])[0] if hasattr(voice, 'languages') else 'en'
                }
                for voice in voices
            ]
            
            # Set default voice
            if self.voices:
                self.current_voice_id = self.voices[0]["id"]
                self.engine.setProperty('voice', self.current_voice_id)
    
    async def synthesize_speech(self, text: str) -> Optional[Dict]:
        """Convert text to speech and return audio data"""
        try:
            if PYTTSX3_AVAILABLE and hasattr(self, 'engine'):
                # For real implementation, we would save to a temporary file
                # and then read the audio data
                # For now, return mock audio data
                pass
            
            # Return mock audio data for demo
            return await self._mock_audio_synthesis(text)
            
        except Exception as e:
            print(f"Error in TTS synthesis: {e}")
            return None
    
    async def _mock_audio_synthesis(self, text: str) -> Dict:
        """Generate mock audio data for demo purposes"""
        # In a real implementation, this would return actual audio data
        # For demo, we'll return a structure that the frontend can handle
        
        # Simulate processing time
        await asyncio.sleep(0.1)
        
        # Calculate approximate duration based on text length and speech rate
        word_count = len(text.split())
        duration = (word_count / self.rate) * 60  # Convert to seconds
        
        return {
            "type": "audio",
            "text": text,
            "duration": duration,
            "format": "mp3",
            "sample_rate": 22050,
            "timestamp": datetime.now().isoformat(),
            # In real implementation, this would be actual audio data
            "audio_data": base64.b64encode(b"mock_audio_data").decode('utf-8')
        }
    
    def set_voice(self, voice_id: str):
        """Change the TTS voice"""
        if PYTTSX3_AVAILABLE and hasattr(self, 'engine'):
            if any(voice["id"] == voice_id for voice in self.voices):
                self.current_voice_id = voice_id
                self.engine.setProperty('voice', voice_id)
    
    def set_rate(self, rate: int):
        """Set speech rate (words per minute)"""
        self.rate = max(50, min(300, rate))  # Clamp between 50-300 wpm
        if PYTTSX3_AVAILABLE and hasattr(self, 'engine'):
            self.engine.setProperty('rate', self.rate)
    
    def set_volume(self, volume: float):
        """Set speech volume (0.0 to 1.0)"""
        self.volume = max(0.0, min(1.0, volume))
        if PYTTSX3_AVAILABLE and hasattr(self, 'engine'):
            self.engine.setProperty('volume', self.volume)
    
    def get_available_voices(self) -> List[Dict]:
        """Get list of available voices"""
        if self.voices:
            return self.voices
        else:
            # Return mock voices for demo
            return [
                {"id": "voice1", "name": "Default Voice", "language": "en-US"},
                {"id": "voice2", "name": "Female Voice", "language": "en-US"},
                {"id": "voice3", "name": "Male Voice", "language": "en-US"}
            ]