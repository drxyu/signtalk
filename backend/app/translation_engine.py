import asyncio
from typing import Dict, Any, Optional, List, Union
from datetime import datetime
import json
import numpy as np
import logging

from .mode_manager import TranslationMode
from .speech_recognition import SpeechRecognitionService
from .text_to_speech import TextToSpeechService
from .ai_providers import AIProviderFactory
from .slp_translator import SLPTranslationService
from .simple_sign_translator import SimpleSignTranslator
from .landmark_processor import LandmarkProcessor
from .services.i3d_translator import I3DTranslatorService
from .services.ensemble_translator import EnsembleTranslator
from .models.tgcn import PoseProcessor
from .utils.logger import setup_logger
from .utils.video_augmentation import PoseAwareAugmentation
from .utils.pose_visualization import PoseVisualizer

logger = setup_logger(__name__)

# Mock data for demo purposes
SIGN_TO_TEXT_MAPPING = {
    "hello": "Hello! Nice to meet you!",
    "thank_you": "Thank you very much",
    "yes": "Yes, I agree",
    "no": "No, I don't think so",
    "please": "Please, if you could",
    "stop": "Stop right there",
    "good": "That's really good!",
    "bad": "That's not good",
    "help": "Can you help me?",
    "what": "What do you mean?",
    "where": "Where is it?",
    "who": "Who is that?",
    "more": "I need more information",
    "finish": "I'm finished",
    "i_love_you": "I love you"
}

TEXT_TO_SIGN_MAPPING = {
    "hello": ["hello"],
    "hi": ["hello"],
    "thank": ["thank_you"],
    "thanks": ["thank_you"],
    "yes": ["yes"],
    "no": ["no"],
    "please": ["please"],
    "stop": ["stop"],
    "good": ["good"],
    "bad": ["bad"],
    "help": ["help"],
    "what": ["what"],
    "where": ["where"],
    "who": ["who"],
    "more": ["more"],
    "finish": ["finish"],
    "done": ["finish"],
    "love": ["i_love_you"]
}

class TranslationEngine:
    def __init__(self):
        self.speech_service = SpeechRecognitionService()
        self.tts_service = TextToSpeechService()
        # Use factory to get the appropriate AI provider
        self.ai_provider = AIProviderFactory.create_provider()
        # Initialize SLP translation service
        self.slp_service = SLPTranslationService()
        # Initialize simple translator as fallback
        self.simple_translator = SimpleSignTranslator()
        # Initialize landmark processor for better recognition
        self.landmark_processor = LandmarkProcessor()
        # Initialize I3D translator for advanced recognition
        self.i3d_service = I3DTranslatorService(vocab_size=100)  # Start with 100, can be updated
        # Initialize TGCN pose processor
        self.pose_processor = PoseProcessor(num_classes=100)
        # Initialize ensemble translator
        self.ensemble_translator = EnsembleTranslator(vocab_size=100)
        # Initialize augmentation
        self.augmentation = PoseAwareAugmentation()
        # Initialize visualizer
        self.pose_visualizer = PoseVisualizer()
        self.translation_history = []
        self.context_window = []  # Last 5 translations for context
        self.max_context_size = 5
        # Track if I3D is enabled
        self.i3d_enabled = True
        # Track if ensemble is enabled
        self.ensemble_enabled = True
        
    async def translate_speech_to_sign(self, text: str) -> Dict[str, Any]:
        """Translate speech text to sign language gestures"""
        try:
            # Add to context
            self._update_context("speech", text)
            
            # Try SLP translation first
            slp_result = await self.slp_service.translate_text_to_signs(text, self.context_window)
            
            if slp_result.get("success") and slp_result.get("signs"):
                signs = slp_result["signs"]
                gloss = slp_result.get("gloss", "")
                detailed_signs = slp_result.get("detailed_signs", [])
                landmarks = slp_result.get("landmarks", [])
                confidence = slp_result.get("confidence", 0.92)
            else:
                # Try simple translator as first fallback
                simple_result = await self.simple_translator.translate_text_to_signs(text, self.context_window)
                
                if simple_result.get("success") and simple_result.get("signs"):
                    signs = simple_result["signs"]
                    gloss = simple_result.get("gloss", "")
                    detailed_signs = simple_result.get("detailed_signs", [])
                    landmarks = simple_result.get("landmarks", [])
                    confidence = simple_result.get("confidence", 0.7)
                else:
                    # Try AI provider translation as second fallback
                    ai_result = await self.ai_provider.translate_speech_to_sign(
                        text, 
                        self.context_window
                    )
                    
                    if ai_result.get("success") and ai_result.get("signs"):
                        signs = ai_result["signs"]
                        gloss = ai_result.get("gloss", "")
                        detailed_signs = []
                        landmarks = []
                        confidence = 0.85
                    else:
                        # Final fallback to simple word matching
                        signs = []
                        text_lower = text.lower()
                        
                        for word in text_lower.split():
                            if word in TEXT_TO_SIGN_MAPPING:
                                signs.extend(TEXT_TO_SIGN_MAPPING[word])
                        
                        if not signs:
                            signs = ["what"]  # Default to "what" gesture
                        
                        gloss = " ".join(signs).upper()
                        detailed_signs = []
                        landmarks = []
                        confidence = 0.6
            
            # Get suggestions from AI provider
            suggestions = self.ai_provider.get_suggestions(text, "speech_to_sign")
            
            # Create translation result
            result = {
                "type": "speech_to_sign",
                "input_text": text,
                "signs": signs,
                "sign_sequence": " → ".join(signs),
                "gloss": gloss,
                "detailed_signs": detailed_signs,
                "landmarks": landmarks,
                "confidence": confidence,
                "context": self._get_context_summary(),
                "timestamp": datetime.now().isoformat(),
                "suggestions": suggestions,
                "slp_used": slp_result.get("success", False),
                "ai_provider_used": not slp_result.get("success", False) and ai_result.get("success", False) if 'ai_result' in locals() else False
            }
            
            # Store in history
            self._add_to_history(result)
            
            return result
            
        except Exception as e:
            print(f"Error in speech to sign translation: {e}")
            return {
                "type": "speech_to_sign",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def translate_sign_to_speech(self, gesture: str) -> Dict[str, Any]:
        """Translate sign language gesture to speech"""
        try:
            # Add to context
            self._update_context("sign", gesture)
            
            # Try AI provider translation first
            ai_result = await self.ai_provider.translate_sign_to_speech(
                gesture,
                self.context_window
            )
            
            if ai_result.get("success") and ai_result.get("text"):
                text = ai_result["text"]
                variations = ai_result.get("variations", [])
                confidence = ai_result.get("confidence", 0.9)
            else:
                # Fallback to mapping
                text = SIGN_TO_TEXT_MAPPING.get(gesture, f"Unknown gesture: {gesture}")
                variations = []
                confidence = 0.9 if gesture in SIGN_TO_TEXT_MAPPING else 0.3
            
            # Generate speech
            audio_result = await self.tts_service.synthesize_speech(text)
            
            # Get suggestions from AI provider
            suggestions = self.ai_provider.get_suggestions(gesture, "sign_to_speech")
            
            # Create translation result
            result = {
                "type": "sign_to_speech",
                "input_gesture": gesture,
                "output_text": text,
                "text_variations": variations,
                "audio": audio_result,
                "confidence": confidence,
                "context": self._get_context_summary(),
                "timestamp": datetime.now().isoformat(),
                "suggestions": suggestions,
                "ai_provider_used": ai_result.get("success", False)
            }
            
            # Store in history
            self._add_to_history(result)
            
            return result
            
        except Exception as e:
            print(f"Error in sign to speech translation: {e}")
            return {
                "type": "sign_to_speech",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def process_unified_stream(
        self, 
        mode: TranslationMode,
        audio_data: Optional[bytes] = None,
        gesture_data: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process unified stream based on current mode"""
        
        if mode == TranslationMode.SPEECH_TO_SIGN and audio_data:
            # Process audio for speech recognition
            speech_result = await self.speech_service.process_audio_chunk(audio_data)
            if speech_result and speech_result.get("text"):
                return await self.translate_speech_to_sign(speech_result["text"])
                
        elif mode == TranslationMode.SIGN_TO_SPEECH and gesture_data:
            # Process gesture data
            return await self.translate_sign_to_speech(gesture_data)
        
        return {
            "type": "no_translation",
            "mode": mode.value,
            "timestamp": datetime.now().isoformat()
        }
    
    def _update_context(self, input_type: str, content: str):
        """Update translation context"""
        context_entry = {
            "type": input_type,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        self.context_window.append(context_entry)
        
        # Keep context window size limited
        if len(self.context_window) > self.max_context_size:
            self.context_window.pop(0)
    
    def _get_context_summary(self) -> List[Dict[str, str]]:
        """Get a summary of recent context"""
        return [
            {
                "type": entry["type"],
                "content": entry["content"][:50] + "..." if len(entry["content"]) > 50 else entry["content"]
            }
            for entry in self.context_window[-3:]  # Last 3 entries
        ]
    
    def _get_suggestions(self, translation_type: str, current_input: str) -> List[str]:
        """Get suggestions for next likely inputs based on context"""
        # Simple suggestions for demo
        if translation_type == "speech_to_sign":
            return ["How are you?", "Nice to meet you", "Can you help me?"]
        else:
            return ["thank_you", "yes", "help"]
    
    def _add_to_history(self, translation_result: Dict[str, Any]):
        """Add translation to history"""
        self.translation_history.append(translation_result)
        
        # Keep history size reasonable
        if len(self.translation_history) > 100:
            self.translation_history.pop(0)
    
    def get_last_translation(self) -> Optional[Dict[str, Any]]:
        """Get the last translation for replay functionality"""
        if self.translation_history:
            return self.translation_history[-1]
        return None
    
    def clear_context(self):
        """Clear context and history"""
        self.context_window = []
        self.translation_history = []
    
    async def process_landmarks(self, landmarks: List[Dict]) -> Dict[str, Any]:
        """Process hand landmarks and translate to text"""
        try:
            # First try our advanced landmark processor
            processor_result = self.landmark_processor.process_landmarks(landmarks)
            
            if processor_result["confidence"] > 0.7:
                gesture = processor_result["gesture"]
                
                # Add to context
                self._update_context("landmarks", gesture)
                
                # Generate appropriate text
                text = SIGN_TO_TEXT_MAPPING.get(gesture.lower(), gesture)
                
                # Generate speech if needed
                audio_result = await self.tts_service.synthesize_speech(text)
                
                result = {
                    "type": "landmarks_to_speech",
                    "input_landmarks": len(landmarks),
                    "output_text": text,
                    "detected_letter": gesture,
                    "text_variations": [gesture],
                    "audio": audio_result,
                    "confidence": processor_result["confidence"],
                    "timestamp": datetime.now().isoformat(),
                    "method": "landmark_processor"
                }
                
                self._add_to_history(result)
                return result
            
            # Try SLP as fallback
            slp_result = await self.slp_service.translate_landmarks_to_text(landmarks, self.context_window)
            
            if slp_result.get("success") and slp_result.get("text"):
                text = slp_result["text"]
                variations = slp_result.get("variations", [])
                confidence = slp_result.get("confidence", 0.85)
                
                # Add to context
                self._update_context("landmarks", text)
                
                # Generate speech if needed
                audio_result = await self.tts_service.synthesize_speech(text)
                
                result = {
                    "type": "landmarks_to_speech",
                    "input_landmarks": len(landmarks),
                    "output_text": text,
                    "text_variations": variations,
                    "audio": audio_result,
                    "confidence": confidence,
                    "timestamp": datetime.now().isoformat(),
                    "method": "slp"
                }
                
                self._add_to_history(result)
                return result
            else:
                # Final fallback to simple gesture classification
                from .hand_detector import HandDetector
                detector = HandDetector()
                
                # Convert landmarks to hand_data format
                hand_data = {
                    "hands_detected": True,
                    "num_hands": 1,
                    "landmarks": [landmarks],
                    "handedness": ["Right"]
                }
                
                gesture, confidence = detector.classify_gesture(hand_data)
                return await self.translate_sign_to_speech(gesture)
                
        except Exception as e:
            print(f"Error processing landmarks: {e}")
            return {
                "type": "landmarks_to_speech",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def process_video_frame(self, frame: np.ndarray) -> bool:
        """Process a video frame for I3D"""
        if self.i3d_enabled:
            return await self.i3d_service.process_frame(frame)
        return False
    
    async def get_i3d_translation(self) -> Optional[Dict[str, Any]]:
        """Get latest I3D translation if available"""
        if not self.i3d_enabled:
            return None
        
        # Get latest translation from I3D service
        i3d_result = await self.i3d_service.get_latest_translation()
        
        if i3d_result and i3d_result.get('success'):
            # Add to context
            self._update_context("i3d", i3d_result['gloss'])
            
            # Generate speech
            audio_result = await self.tts_service.synthesize_speech(i3d_result['text'])
            i3d_result['audio'] = audio_result
            
            # Add to history
            self._add_to_history(i3d_result)
            
            return i3d_result
        
        return None
    
    def set_i3d_enabled(self, enabled: bool):
        """Enable or disable I3D processing"""
        self.i3d_enabled = enabled
        logger.info(f"I3D processing {'enabled' if enabled else 'disabled'}")
    
    def set_i3d_vocab_size(self, vocab_size: int):
        """Update I3D vocabulary size"""
        self.i3d_service.update_vocabulary_size(vocab_size)
    
    def get_i3d_stats(self) -> Dict[str, Any]:
        """Get I3D service statistics"""
        return self.i3d_service.get_stats()
    
    async def search_signs(self, query: str) -> List[Dict[str, Any]]:
        """Search for signs in vocabulary"""
        return await self.i3d_service.search_signs(query)
    
    async def process_video_frame_ensemble(self, frame: np.ndarray) -> bool:
        """Process frame for ensemble model"""
        if self.ensemble_enabled:
            return await self.ensemble_translator.process_frame(frame)
        return False
    
    async def get_ensemble_translation(self) -> Optional[Dict[str, Any]]:
        """Get ensemble translation result"""
        if not self.ensemble_enabled:
            return None
        
        result = await self.ensemble_translator.get_ensemble_prediction()
        
        if result and result.get('success'):
            # Add to context
            self._update_context("ensemble", result['gloss'])
            
            # Generate speech
            audio_result = await self.tts_service.synthesize_speech(result['text'])
            result['audio'] = audio_result
            
            # Add to history
            self._add_to_history(result)
            
            return result
        
        return None
    
    def set_ensemble_enabled(self, enabled: bool):
        """Enable or disable ensemble model"""
        self.ensemble_enabled = enabled
        logger.info(f"Ensemble processing {'enabled' if enabled else 'disabled'}")
    
    def get_ensemble_stats(self) -> Dict[str, Any]:
        """Get ensemble statistics"""
        return self.ensemble_translator.get_stats()
    
    async def extract_pose_from_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """Extract pose from single frame"""
        return self.pose_processor.process_single_frame(frame)
    
    def visualize_pose(self, frame: np.ndarray, pose_data: Dict) -> np.ndarray:
        """Visualize pose on frame"""
        keypoints = pose_data.get('keypoints', np.array([]))
        if keypoints.size > 0:
            return self.pose_visualizer.draw_skeleton_on_image(frame, keypoints)
        return frame
    
    def augment_frame(self, frame: np.ndarray, training: bool = False) -> np.ndarray:
        """Apply augmentation to frame"""
        return self.augmentation.augment_frame(frame, crop_size=(224, 224), training=training)