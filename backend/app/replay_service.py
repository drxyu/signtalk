import asyncio
import json
import base64
from datetime import datetime
from typing import Dict, List, Optional, Tuple, AsyncGenerator
from collections import deque
import os

class ReplayService:
    """Service for recording and replaying translation sessions"""
    
    def __init__(self, max_history: int = 10):
        self.max_history = max_history
        self.translation_history: deque = deque(maxlen=max_history)
        self.active_recording = None
        self.replay_cache = {}
    
    def start_recording(self, session_id: str) -> Dict:
        """Start recording a new translation session"""
        self.active_recording = {
            "session_id": session_id,
            "start_time": datetime.now().isoformat(),
            "frames": [],
            "translations": [],
            "mode_sequence": []
        }
        return {
            "status": "recording",
            "session_id": session_id
        }
    
    def add_frame(self, frame_data: Dict) -> None:
        """Add a frame to the active recording"""
        if not self.active_recording:
            return
        
        frame_entry = {
            "timestamp": datetime.now().isoformat(),
            "audio_data": frame_data.get("audio"),
            "video_data": frame_data.get("video"),
            "mode": frame_data.get("mode"),
            "translation": frame_data.get("translation")
        }
        
        self.active_recording["frames"].append(frame_entry)
        
        # Add translation if present
        if frame_data.get("translation"):
            self.active_recording["translations"].append({
                "timestamp": frame_entry["timestamp"],
                "data": frame_data["translation"]
            })
        
        # Track mode changes
        if frame_data.get("mode"):
            if not self.active_recording["mode_sequence"] or \
               self.active_recording["mode_sequence"][-1]["mode"] != frame_data["mode"]:
                self.active_recording["mode_sequence"].append({
                    "mode": frame_data["mode"],
                    "timestamp": frame_entry["timestamp"]
                })
    
    def stop_recording(self) -> Dict:
        """Stop recording and save to history"""
        if not self.active_recording:
            return {"status": "no_active_recording"}
        
        self.active_recording["end_time"] = datetime.now().isoformat()
        self.active_recording["duration"] = len(self.active_recording["frames"]) * 0.1  # Assuming 10 FPS
        
        # Save to history
        self.translation_history.append(self.active_recording)
        
        # Cache for quick access
        session_id = self.active_recording["session_id"]
        self.replay_cache[session_id] = self.active_recording
        
        result = {
            "status": "saved",
            "session_id": session_id,
            "duration": self.active_recording["duration"],
            "translation_count": len(self.active_recording["translations"])
        }
        
        self.active_recording = None
        return result
    
    async def replay_session(self, session_id: str, speed: float = 1.0) -> AsyncGenerator:
        """Replay a recorded session"""
        # Get session from cache or history
        session_data = self.replay_cache.get(session_id)
        if not session_data:
            # Search in history
            for session in self.translation_history:
                if session["session_id"] == session_id:
                    session_data = session
                    break
        
        if not session_data:
            raise ValueError(f"Session {session_id} not found")
        
        # Calculate frame delay based on speed
        frame_delay = 0.1 / speed  # 100ms per frame at normal speed
        
        for i, frame in enumerate(session_data["frames"]):
            yield {
                "type": "replay_frame",
                "frame_number": i + 1,
                "total_frames": len(session_data["frames"]),
                "progress": (i + 1) / len(session_data["frames"]),
                "data": frame
            }
            await asyncio.sleep(frame_delay)
    
    def get_session_summary(self, session_id: str) -> Optional[Dict]:
        """Get summary of a recorded session"""
        session_data = self.replay_cache.get(session_id)
        if not session_data:
            for session in self.translation_history:
                if session["session_id"] == session_id:
                    session_data = session
                    break
        
        if not session_data:
            return None
        
        # Extract key moments
        key_moments = []
        for translation in session_data["translations"]:
            if translation["data"].get("type") == "speech_to_sign":
                key_moments.append({
                    "type": "speech",
                    "text": translation["data"].get("input_text", ""),
                    "signs": translation["data"].get("signs", []),
                    "timestamp": translation["timestamp"]
                })
            elif translation["data"].get("type") == "sign_to_speech":
                key_moments.append({
                    "type": "sign",
                    "gesture": translation["data"].get("gesture", ""),
                    "text": translation["data"].get("output_text", ""),
                    "timestamp": translation["timestamp"]
                })
        
        return {
            "session_id": session_id,
            "duration": session_data["duration"],
            "start_time": session_data["start_time"],
            "end_time": session_data["end_time"],
            "translation_count": len(session_data["translations"]),
            "mode_changes": len(session_data["mode_sequence"]),
            "key_moments": key_moments[:5]  # Top 5 moments
        }
    
    def get_recent_sessions(self, limit: int = 5) -> List[Dict]:
        """Get recent session summaries"""
        recent = []
        for session in reversed(list(self.translation_history)):
            summary = self.get_session_summary(session["session_id"])
            if summary:
                recent.append(summary)
            if len(recent) >= limit:
                break
        return recent
    
    def export_session(self, session_id: str, format: str = "json") -> bytes:
        """Export session data in specified format"""
        session_data = self.replay_cache.get(session_id)
        if not session_data:
            for session in self.translation_history:
                if session["session_id"] == session_id:
                    session_data = session
                    break
        
        if not session_data:
            raise ValueError(f"Session {session_id} not found")
        
        if format == "json":
            return json.dumps(session_data, indent=2).encode()
        elif format == "summary":
            summary = self.get_session_summary(session_id)
            return json.dumps(summary, indent=2).encode()
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def create_highlight_reel(self, session_id: str) -> Dict:
        """Create a highlight reel of key translations"""
        session_data = self.replay_cache.get(session_id)
        if not session_data:
            for session in self.translation_history:
                if session["session_id"] == session_id:
                    session_data = session
                    break
        
        if not session_data:
            return {"error": "Session not found"}
        
        highlights = []
        
        # Extract interesting translations
        for translation in session_data["translations"]:
            trans_data = translation["data"]
            
            # High confidence translations
            if trans_data.get("confidence", 0) > 0.9:
                highlights.append({
                    "timestamp": translation["timestamp"],
                    "type": trans_data.get("type"),
                    "content": trans_data.get("input_text") or trans_data.get("gesture"),
                    "translation": trans_data.get("signs") or trans_data.get("output_text"),
                    "confidence": trans_data.get("confidence")
                })
        
        # Sort by confidence and take top 10
        highlights.sort(key=lambda x: x.get("confidence", 0), reverse=True)
        
        return {
            "session_id": session_id,
            "duration": session_data["duration"],
            "highlight_count": len(highlights[:10]),
            "highlights": highlights[:10]
        }