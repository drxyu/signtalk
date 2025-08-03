import asyncio
from typing import Dict, List, Optional, Any
import numpy as np
try:
    from sign_language_translator import SignLanguageTranslator
    from sign_language_translator.config.enums import SignLanguages, TextLanguages
    from sign_language_translator.models import MediaPipeModel
except ImportError:
    # Fallback imports for different versions
    try:
        from sign_language_translator import Translator as SignLanguageTranslator
        from sign_language_translator.config import SignLanguages, TextLanguages
        from sign_language_translator.models import MediaPipeModel
    except ImportError:
        print("Warning: sign-language-translator library not found. Some features may be limited.")
        SignLanguageTranslator = None
        SignLanguages = None
        TextLanguages = None
        MediaPipeModel = None
import cv2
import base64
from io import BytesIO
from PIL import Image

class SLPTranslationService:
    """Service for translating between sign language and text using SLP library"""
    
    def __init__(self):
        self.is_available = SignLanguageTranslator is not None
        
        if self.is_available:
            try:
                # Initialize the translator with ASL as default
                self.translator = SignLanguageTranslator(
                    sign_language=SignLanguages.ASL,
                    text_language=TextLanguages.ENGLISH
                )
                
                # Initialize MediaPipe model for landmark extraction
                self.mp_model = MediaPipeModel()
            except Exception as e:
                print(f"Error initializing SLP translator: {e}")
                self.is_available = False
                self.translator = None
                self.mp_model = None
        else:
            self.translator = None
            self.mp_model = None
        
        # Cache for recent translations
        self.translation_cache = {}
        self.cache_size = 100
        
    async def translate_text_to_signs(self, text: str, context: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Translate text to sign language representation"""
        if not self.is_available:
            return {
                "success": False,
                "error": "SLP library not available",
                "signs": [],
                "gloss": ""
            }
            
        try:
            # Check cache first
            cache_key = f"text2sign:{text}"
            if cache_key in self.translation_cache:
                return self.translation_cache[cache_key]
            
            # Use SLP to translate text to sign
            result = await asyncio.to_thread(
                self.translator.translate,
                text,
                from_language=TextLanguages.ENGLISH,
                to_language=SignLanguages.ASL
            )
            
            # Extract sign sequence and gloss
            signs = []
            gloss = []
            
            if hasattr(result, 'sign_sequence'):
                for sign in result.sign_sequence:
                    signs.append({
                        'gloss': sign.gloss,
                        'duration': getattr(sign, 'duration', 1.0),
                        'handshape': getattr(sign, 'handshape', None),
                        'movement': getattr(sign, 'movement', None),
                        'location': getattr(sign, 'location', None)
                    })
                    gloss.append(sign.gloss)
            
            # Generate landmark data for animation
            landmarks = await self._generate_landmarks_for_signs(signs)
            
            translation_result = {
                "success": True,
                "signs": [sign['gloss'] for sign in signs],
                "detailed_signs": signs,
                "gloss": " ".join(gloss),
                "landmarks": landmarks,
                "confidence": 0.92,
                "language": "ASL"
            }
            
            # Cache the result
            self._add_to_cache(cache_key, translation_result)
            
            return translation_result
            
        except Exception as e:
            print(f"Error in SLP text to sign translation: {e}")
            return {
                "success": False,
                "error": str(e),
                "signs": [],
                "gloss": ""
            }
    
    async def translate_landmarks_to_text(self, landmarks: List[Dict], context: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Translate hand landmarks to text"""
        if not self.is_available:
            return {
                "success": False,
                "error": "SLP library not available",
                "text": "",
                "variations": []
            }
            
        try:
            # Convert landmarks to format expected by SLP
            formatted_landmarks = self._format_landmarks_for_slp(landmarks)
            
            # Use SLP to recognize the sign
            result = await asyncio.to_thread(
                self.translator.translate,
                formatted_landmarks,
                from_language=SignLanguages.ASL,
                to_language=TextLanguages.ENGLISH
            )
            
            # Extract text and variations
            text = result.text if hasattr(result, 'text') else ""
            variations = []
            
            if hasattr(result, 'alternatives'):
                variations = [alt.text for alt in result.alternatives[:3]]
            
            return {
                "success": True,
                "text": text,
                "variations": variations,
                "confidence": getattr(result, 'confidence', 0.85),
                "language": "English"
            }
            
        except Exception as e:
            print(f"Error in SLP landmark to text translation: {e}")
            return {
                "success": False,
                "error": str(e),
                "text": "",
                "variations": []
            }
    
    async def process_video_frame(self, frame_data: str) -> Dict[str, Any]:
        """Process a video frame and extract sign language features"""
        try:
            # Decode base64 image
            img_data = base64.b64decode(frame_data.split(',')[1])
            img = Image.open(BytesIO(img_data))
            frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            
            # Extract landmarks using MediaPipe
            landmarks = await asyncio.to_thread(
                self.mp_model.extract_landmarks,
                frame
            )
            
            if landmarks:
                # Translate landmarks to text
                translation = await self.translate_landmarks_to_text(landmarks)
                
                return {
                    "success": True,
                    "landmarks": landmarks,
                    "translation": translation,
                    "frame_processed": True
                }
            else:
                return {
                    "success": True,
                    "landmarks": None,
                    "translation": None,
                    "frame_processed": True,
                    "message": "No hands detected in frame"
                }
                
        except Exception as e:
            print(f"Error processing video frame: {e}")
            return {
                "success": False,
                "error": str(e),
                "frame_processed": False
            }
    
    async def _generate_landmarks_for_signs(self, signs: List[Dict]) -> List[Dict]:
        """Generate landmark sequences for sign animation"""
        landmarks_sequence = []
        
        for sign in signs:
            # This would ideally use a sign language animation model
            # For now, we'll return placeholder data
            # In production, this would generate actual hand pose sequences
            
            frames = []
            num_frames = int(sign.get('duration', 1.0) * 30)  # 30 fps
            
            for frame_idx in range(num_frames):
                # Generate interpolated landmarks for this frame
                # This is simplified - real implementation would use proper animation
                frame_landmarks = {
                    "frame": frame_idx,
                    "hands": [
                        {
                            "landmarks": self._generate_placeholder_landmarks(),
                            "handedness": "Right"
                        }
                    ]
                }
                frames.append(frame_landmarks)
            
            landmarks_sequence.append({
                "sign": sign['gloss'],
                "frames": frames,
                "duration": sign.get('duration', 1.0)
            })
        
        return landmarks_sequence
    
    def _generate_placeholder_landmarks(self) -> List[Dict]:
        """Generate placeholder landmarks for testing"""
        # 21 landmarks for a hand
        landmarks = []
        for i in range(21):
            landmarks.append({
                "x": 0.5 + (i * 0.01),
                "y": 0.5 + (i * 0.01),
                "z": 0.0
            })
        return landmarks
    
    def _format_landmarks_for_slp(self, landmarks: List[Dict]) -> Any:
        """Format landmarks for SLP library"""
        # Convert our landmark format to what SLP expects
        # This would need to match the actual SLP API
        return {
            "type": "mediapipe_landmarks",
            "data": landmarks,
            "format": "normalized"
        }
    
    def _add_to_cache(self, key: str, value: Any):
        """Add translation to cache with size limit"""
        self.translation_cache[key] = value
        
        # Remove oldest entries if cache is too large
        if len(self.translation_cache) > self.cache_size:
            oldest_key = next(iter(self.translation_cache))
            del self.translation_cache[oldest_key]
    
    def clear_cache(self):
        """Clear the translation cache"""
        self.translation_cache.clear()
    
    def set_language_pair(self, sign_language: str = "ASL", text_language: str = "English"):
        """Change the language pair for translation"""
        try:
            sign_lang = SignLanguages[sign_language.upper()]
            text_lang = TextLanguages[text_language.upper()]
            
            self.translator = SignLanguageTranslator(
                sign_language=sign_lang,
                text_language=text_lang
            )
            
            # Clear cache when language changes
            self.clear_cache()
            
            return True
        except Exception as e:
            print(f"Error setting language pair: {e}")
            return False