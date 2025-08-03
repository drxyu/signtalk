from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio

class TranslationMode(Enum):
    SPEECH_TO_SIGN = "speech_to_sign"
    SIGN_TO_SPEECH = "sign_to_speech"
    AUTO_DETECT = "auto_detect"

class ModeManager:
    def __init__(self):
        self.current_mode = TranslationMode.AUTO_DETECT
        self.audio_level_threshold = 0.1  # Minimum audio level to trigger speech mode
        self.motion_level_threshold = 0.2  # Minimum motion to trigger sign mode
        self.mode_switch_cooldown = 1.0  # Seconds before allowing mode switch
        self.last_mode_switch = datetime.now()
        self.audio_levels = []  # Rolling buffer for audio levels
        self.motion_levels = []  # Rolling buffer for motion levels
        self.buffer_size = 10  # Number of samples to keep
        
    async def detect_active_mode(
        self, 
        audio_level: float, 
        motion_level: float,
        has_hands: bool
    ) -> TranslationMode:
        """Automatically detect which mode should be active based on input signals"""
        
        # Add to rolling buffers
        self.audio_levels.append(audio_level)
        self.motion_levels.append(motion_level)
        
        # Keep buffer size limited
        if len(self.audio_levels) > self.buffer_size:
            self.audio_levels.pop(0)
        if len(self.motion_levels) > self.buffer_size:
            self.motion_levels.pop(0)
        
        # Calculate average levels
        avg_audio = sum(self.audio_levels) / len(self.audio_levels) if self.audio_levels else 0
        avg_motion = sum(self.motion_levels) / len(self.motion_levels) if self.motion_levels else 0
        
        # Check if we're in cooldown period
        time_since_switch = (datetime.now() - self.last_mode_switch).total_seconds()
        if time_since_switch < self.mode_switch_cooldown:
            return self.current_mode
        
        # Determine mode based on signals
        detected_mode = self.current_mode
        
        if self.current_mode == TranslationMode.AUTO_DETECT:
            # Priority: Speech > Sign
            if avg_audio > self.audio_level_threshold:
                detected_mode = TranslationMode.SPEECH_TO_SIGN
            elif has_hands and avg_motion > self.motion_level_threshold:
                detected_mode = TranslationMode.SIGN_TO_SPEECH
        else:
            # Check if we should switch modes
            if self.current_mode == TranslationMode.SPEECH_TO_SIGN:
                # Switch to sign mode if no audio but hands are moving
                if avg_audio < self.audio_level_threshold * 0.5 and has_hands and avg_motion > self.motion_level_threshold:
                    detected_mode = TranslationMode.SIGN_TO_SPEECH
            elif self.current_mode == TranslationMode.SIGN_TO_SPEECH:
                # Switch to speech mode if audio detected
                if avg_audio > self.audio_level_threshold:
                    detected_mode = TranslationMode.SPEECH_TO_SIGN
        
        # Update mode if changed
        if detected_mode != self.current_mode:
            self.current_mode = detected_mode
            self.last_mode_switch = datetime.now()
            
        return detected_mode
    
    def set_mode(self, mode: TranslationMode):
        """Manually set the translation mode"""
        self.current_mode = mode
        self.last_mode_switch = datetime.now()
        # Clear buffers when manually switching
        self.audio_levels = []
        self.motion_levels = []
    
    def get_mode_info(self) -> Dict[str, Any]:
        """Get current mode information"""
        return {
            "current_mode": self.current_mode.value,
            "audio_level": self.audio_levels[-1] if self.audio_levels else 0,
            "motion_level": self.motion_levels[-1] if self.motion_levels else 0,
            "avg_audio_level": sum(self.audio_levels) / len(self.audio_levels) if self.audio_levels else 0,
            "avg_motion_level": sum(self.motion_levels) / len(self.motion_levels) if self.motion_levels else 0,
            "time_in_mode": (datetime.now() - self.last_mode_switch).total_seconds()
        }
    
    def reset(self):
        """Reset the mode manager to initial state"""
        self.current_mode = TranslationMode.AUTO_DETECT
        self.last_mode_switch = datetime.now()
        self.audio_levels = []
        self.motion_levels = []