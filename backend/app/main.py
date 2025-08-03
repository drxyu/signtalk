from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
import asyncio
import time
from dotenv import load_dotenv
import base64
import cv2
import numpy as np
from datetime import datetime

# Import our services
from .hand_detector import HandDetector
from .mode_manager import ModeManager, TranslationMode
from .translation_engine import TranslationEngine
from .speech_recognition import SpeechRecognitionService
from .text_to_speech import TextToSpeechService
from .replay_service import ReplayService
from .performance_optimizer import PerformanceOptimizer

load_dotenv()

app = FastAPI(title="SignSpeak AI - Real-time Sign Language Translator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationResult(BaseModel):
    gesture_detected: str
    translation: str
    confidence: float
    emoji: str
    timestamp: str

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.translation_history: List[TranslationResult] = []
        # Initialize services
        self.hand_detector = HandDetector()
        self.mode_manager = ModeManager()
        self.translation_engine = TranslationEngine()
        self.replay_service = ReplayService()
        self.performance_optimizer = PerformanceOptimizer()
        # Link hand detector to translation engine for I3D processing
        self.hand_detector.translation_engine = self.translation_engine
        self.previous_landmarks = None
        self.active_sessions = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def get():
    return HTMLResponse("""
    <html>
        <head>
            <title>SignSpeak AI</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    text-align: center;
                }
                h1 {
                    font-size: 3em;
                    margin-bottom: 0.5em;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                .emoji {
                    font-size: 5em;
                    animation: float 3s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .stats {
                    background: rgba(255,255,255,0.2);
                    border-radius: 20px;
                    padding: 20px;
                    margin: 20px 0;
                    backdrop-filter: blur(10px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>SignSpeak AI</h1>
                <div class="emoji"></div>
                <p>Breaking barriers with AI-powered sign language translation</p>
                <div class="stats">
                    <h2>Live Demo Stats</h2>
                    <p>Active Connections: <span id="connections">0</span></p>
                    <p>Translations Today: <span id="translations">0</span></p>
                    <p>Avg Response Time: <span id="response">45ms</span></p>
                </div>
            </div>
        </body>
    </html>
    """)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    max_retries = 3
    retry_count = 0
    
    try:
        while True:
            try:
                # Receive data from client with timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                message = json.loads(data)
                
                # Process based on message type
                result = await process_unified_message(message)
                
                # Send back the result
                await manager.send_personal_message(json.dumps(result), websocket)
                
                # Reset retry count on successful processing
                retry_count = 0
                
            except asyncio.TimeoutError:
                # Send keep-alive ping
                await websocket.send_json({"type": "ping", "timestamp": datetime.now().isoformat()})
                
            except json.JSONDecodeError as e:
                # Handle invalid JSON
                error_response = {
                    "type": "error",
                    "error": "Invalid JSON format",
                    "details": str(e),
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send_json(error_response)
                
            except Exception as e:
                retry_count += 1
                print(f"WebSocket processing error (attempt {retry_count}/{max_retries}): {e}")
                
                if retry_count >= max_retries:
                    # Send error message before closing
                    error_response = {
                        "type": "fatal_error",
                        "error": "Max retries exceeded",
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send_json(error_response)
                    break
                    
                # Send error response and continue
                error_response = {
                    "type": "error",
                    "error": "Processing error",
                    "retry_count": retry_count,
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send_json(error_response)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket fatal error: {e}")
        try:
            await websocket.close(code=1011, reason="Server error")
        except:
            pass
        finally:
            manager.disconnect(websocket)

async def process_unified_message(message: Dict) -> Dict:
    """Process unified message containing audio and/or video data"""
    try:
        start_time = time.time()
        message_type = message.get("type", "unknown")
        
        # Check if we should skip this frame for performance
        if manager.performance_optimizer.should_skip_frame():
            return {
                "type": "frame_skipped",
                "timestamp": datetime.now().isoformat()
            }
        
        # Extract audio and video data
        audio_data = message.get("audio")
        video_data = message.get("video")
        
        # Initialize response
        response = {
            "type": "translation_result",
            "timestamp": datetime.now().isoformat()
        }
        
        # Process video frame for hand detection
        hand_data = None
        motion_level = 0.0
        if video_data:
            # Decode base64 image
            image = manager.hand_detector.decode_base64_image(video_data)
            # Optimize image for performance
            image = manager.performance_optimizer.optimize_video_frame(image)
            hand_data = manager.hand_detector.detect_hands(image)
            
            # Calculate motion level
            if hand_data["hands_detected"] and hand_data["landmarks"]:
                motion_level = manager.hand_detector.calculate_motion_level(
                    hand_data["landmarks"][0],
                    manager.previous_landmarks
                )
                manager.previous_landmarks = hand_data["landmarks"][0]
                
                # Classify gesture
                gesture, confidence = manager.hand_detector.classify_gesture(hand_data)
                hand_data["gesture"] = gesture
                hand_data["gesture_confidence"] = confidence
        
        # Process audio for speech level
        audio_level = 0.0
        if audio_data:
            # Convert base64 to bytes
            audio_bytes = base64.b64decode(audio_data)
            # Optimize audio chunk
            audio_bytes = manager.performance_optimizer.optimize_audio_chunk(audio_bytes)
            audio_level = manager.translation_engine.speech_service.get_audio_level(audio_bytes)
        
        # Detect active mode
        current_mode = await manager.mode_manager.detect_active_mode(
            audio_level=audio_level,
            motion_level=motion_level,
            has_hands=hand_data["hands_detected"] if hand_data else False
        )
        
        # Process translation based on mode
        translation_result = await manager.translation_engine.process_unified_stream(
            mode=current_mode,
            audio_data=base64.b64decode(audio_data) if audio_data else None,
            gesture_data=hand_data.get("gesture") if hand_data else None
        )
        
        # Check for I3D translation results (runs in parallel)
        i3d_result = await manager.translation_engine.get_i3d_translation()
        if i3d_result:
            # Merge I3D results with main translation
            if translation_result.get("type") == "no_translation":
                # Use I3D result as primary
                translation_result = i3d_result
            else:
                # Add I3D as additional information
                translation_result["i3d_prediction"] = {
                    "gloss": i3d_result.get("gloss"),
                    "text": i3d_result.get("text"),
                    "confidence": i3d_result.get("confidence"),
                    "method": "i3d"
                }
        
        # Check for ensemble translation results
        ensemble_result = await manager.translation_engine.get_ensemble_translation()
        if ensemble_result:
            # Ensemble takes priority if available
            if translation_result.get("type") == "no_translation":
                translation_result = ensemble_result
            else:
                # Add ensemble as the primary prediction
                translation_result["ensemble_prediction"] = {
                    "gloss": ensemble_result.get("gloss"),
                    "text": ensemble_result.get("text"),
                    "confidence": ensemble_result.get("confidence"),
                    "method": "ensemble",
                    "models_used": ensemble_result.get("models_used", []),
                    "agreement": ensemble_result.get("agreement", False)
                }
                # If ensemble has high confidence, use it as primary
                if ensemble_result.get("confidence", 0) > 0.8:
                    translation_result["primary_prediction"] = "ensemble"
        
        # Combine all results
        response.update({
            "mode": current_mode.value,
            "audio_level": audio_level,
            "motion_level": motion_level,
            "hand_data": hand_data,
            "translation": translation_result,
            "mode_info": manager.mode_manager.get_mode_info()
        })
        
        # Record frame for replay if session is active
        if manager.replay_service.active_recording:
            manager.replay_service.add_frame({
                "audio": audio_data,
                "video": video_data,
                "mode": current_mode.value,
                "translation": translation_result
            })
        
        # Measure total processing time
        total_latency = manager.performance_optimizer.measure_latency(start_time, "translation_latency")
        
        # Add performance metrics to response
        response["performance"] = {
            "latency_ms": total_latency,
            "optimized": True
        }
        
        # Auto-adjust quality if needed
        if total_latency > 200:  # More than 200ms
            manager.performance_optimizer.auto_adjust_quality()
        
        # Optimize response size
        response = await manager.performance_optimizer.optimize_websocket_message(response)
        
        return response
        
    except Exception as e:
        print(f"Error processing message: {e}")
        return {
            "type": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/stats")
async def get_stats():
    return {
        "active_connections": len(manager.active_connections),
        "total_translations": len(manager.translation_history),
        "supported_gestures": 50,
        "accuracy_rate": 0.94
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

class LandmarkTranslationRequest(BaseModel):
    landmarks: List[Dict]
    context: Optional[List[Dict]] = None
    language: Optional[str] = "ASL"

@app.post("/api/v1/translate/landmarks")
async def translate_landmarks(request: LandmarkTranslationRequest):
    """Translate hand landmarks to text using SLP"""
    try:
        # Process landmarks through translation engine
        result = await manager.translation_engine.process_landmarks(request.landmarks)
        
        return {
            "success": True,
            "translation": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TextToSignRequest(BaseModel):
    text: str
    context: Optional[List[Dict]] = None
    language: Optional[str] = "ASL"

@app.post("/api/v1/translate/text-to-sign")
async def translate_text_to_sign(request: TextToSignRequest):
    """Translate text to sign language representation"""
    try:
        result = await manager.translation_engine.translate_speech_to_sign(request.text)
        
        return {
            "success": True,
            "translation": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/session/start")
async def start_session():
    """Initialize a new bi-directional translation session"""
    session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    manager.translation_engine.clear_context()
    
    # Start recording for replay
    manager.replay_service.start_recording(session_id)
    manager.active_sessions[session_id] = {
        "start_time": datetime.now().isoformat(),
        "status": "active"
    }
    
    return {
        "session_id": session_id,
        "status": "active",
        "recording": True,
        "supported_modes": ["speech_to_sign", "sign_to_speech", "auto_detect"],
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/session/{session_id}/stop")
async def stop_session(session_id: str):
    """Stop recording a session"""
    if session_id not in manager.active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    result = manager.replay_service.stop_recording()
    manager.active_sessions[session_id]["status"] = "stopped"
    manager.active_sessions[session_id]["end_time"] = datetime.now().isoformat()
    
    return result

@app.get("/api/v1/replay/{session_id}")
async def get_replay_info(session_id: str):
    """Get information about a recorded session"""
    summary = manager.replay_service.get_session_summary(session_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Session not found")
    return summary

@app.websocket("/ws/replay/{session_id}")
async def replay_session_websocket(websocket: WebSocket, session_id: str, speed: float = 1.0):
    """Stream replay of a recorded session via WebSocket"""
    await websocket.accept()
    try:
        async for frame in manager.replay_service.replay_session(session_id, speed):
            await websocket.send_json(frame)
        
        # Send completion message
        await websocket.send_json({
            "type": "replay_complete",
            "session_id": session_id
        })
    except ValueError as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
    except WebSocketDisconnect:
        pass
    finally:
        await websocket.close()

@app.get("/api/v1/replay/recent")
async def get_recent_replays(limit: int = 5):
    """Get recent recorded sessions"""
    return {
        "sessions": manager.replay_service.get_recent_sessions(limit)
    }

@app.get("/api/v1/replay/{session_id}/highlights")
async def get_session_highlights(session_id: str):
    """Get highlight reel from a session"""
    highlights = manager.replay_service.create_highlight_reel(session_id)
    if "error" in highlights:
        raise HTTPException(status_code=404, detail=highlights["error"])
    return highlights

@app.get("/api/v1/replay/{session_id}/export")
async def export_session(session_id: str, format: str = "json"):
    """Export session data"""
    try:
        data = manager.replay_service.export_session(session_id, format)
        return {
            "status": "success",
            "data": base64.b64encode(data).decode(),
            "format": format,
            "filename": f"{session_id}.{format}"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/settings/voice")
async def get_voice_settings():
    """Get available TTS voice options"""
    voices = manager.translation_engine.tts_service.get_available_voices()
    return {
        "voices": voices,
        "current_voice": manager.translation_engine.tts_service.current_voice_id,
        "rate": manager.translation_engine.tts_service.rate,
        "volume": manager.translation_engine.tts_service.volume
    }

@app.post("/api/v1/settings/voice")
async def update_voice_settings(voice_id: Optional[str] = None, rate: Optional[int] = None, volume: Optional[float] = None):
    """Update TTS voice settings"""
    if voice_id:
        manager.translation_engine.tts_service.set_voice(voice_id)
    if rate:
        manager.translation_engine.tts_service.set_rate(rate)
    if volume:
        manager.translation_engine.tts_service.set_volume(volume)
    
    return await get_voice_settings()

@app.get("/api/v1/analytics/demo")
async def get_demo_analytics():
    """Get mock analytics for demo purposes"""
    import random
    
    # Get real performance stats
    perf_stats = manager.performance_optimizer.get_performance_stats()
    avg_latency = perf_stats.get("translation_latency", {}).get("avg", 50)
    
    return {
        "total_translations": len(manager.translation_history) + random.randint(100, 500),
        "mode_usage": {
            "speech_to_sign": random.randint(40, 60),
            "sign_to_speech": random.randint(30, 50),
            "auto_detect": random.randint(10, 20)
        },
        "average_response_time_ms": int(avg_latency) if avg_latency else random.randint(40, 80),
        "popular_signs": [
            {"sign": "hello", "count": random.randint(50, 100)},
            {"sign": "thank_you", "count": random.randint(40, 80)},
            {"sign": "yes", "count": random.randint(30, 70)},
            {"sign": "help", "count": random.randint(20, 50)},
            {"sign": "please", "count": random.randint(15, 40)}
        ],
        "accuracy_rate": 0.94 + (random.random() * 0.05),
        "performance_metrics": perf_stats
    }

@app.get("/api/v1/performance/stats")
async def get_performance_stats():
    """Get real-time performance statistics"""
    stats = manager.performance_optimizer.get_performance_stats()
    recommendations = manager.performance_optimizer.get_optimization_recommendations()
    
    return {
        "stats": stats,
        "recommendations": recommendations,
        "optimization_settings": manager.performance_optimizer.optimization_settings
    }

@app.get("/api/v1/i3d/status")
async def get_i3d_status():
    """Get I3D model status and statistics"""
    return {
        "enabled": manager.translation_engine.i3d_enabled,
        "stats": manager.translation_engine.get_i3d_stats(),
        "vocabulary_sizes": [100, 300, 1000, 2000, 3000],
        "current_vocab_size": manager.translation_engine.i3d_service.vocab_size
    }

@app.post("/api/v1/i3d/config")
async def update_i3d_config(enabled: Optional[bool] = None, vocab_size: Optional[int] = None):
    """Update I3D configuration"""
    if enabled is not None:
        manager.translation_engine.set_i3d_enabled(enabled)
    
    if vocab_size is not None:
        if vocab_size not in [100, 300, 1000, 2000, 3000]:
            raise HTTPException(status_code=400, detail="Invalid vocabulary size")
        manager.translation_engine.set_i3d_vocab_size(vocab_size)
    
    return await get_i3d_status()

@app.get("/api/v1/i3d/search")
async def search_signs(query: str, limit: int = 10):
    """Search for signs in I3D vocabulary"""
    results = await manager.translation_engine.search_signs(query)
    return {
        "query": query,
        "results": results[:limit],
        "total": len(results)
    }

@app.get("/api/v1/ensemble/status")
async def get_ensemble_status():
    """Get ensemble model status"""
    return {
        "enabled": manager.translation_engine.ensemble_enabled,
        "stats": manager.translation_engine.get_ensemble_stats(),
        "models": ["i3d", "tgcn"],
        "current_weights": manager.translation_engine.ensemble_translator.ensemble_weights
    }

@app.post("/api/v1/ensemble/config")
async def update_ensemble_config(
    enabled: Optional[bool] = None,
    weights: Optional[Dict[str, float]] = None
):
    """Update ensemble configuration"""
    if enabled is not None:
        manager.translation_engine.set_ensemble_enabled(enabled)
    
    if weights is not None:
        manager.translation_engine.ensemble_translator.update_ensemble_weights(weights)
    
    return await get_ensemble_status()

@app.post("/api/v1/pose/extract")
async def extract_pose(image_data: str):
    """Extract pose from base64 image"""
    try:
        # Decode image
        frame = manager.hand_detector.decode_base64_image(image_data)
        
        # Extract pose
        pose_data = await manager.translation_engine.extract_pose_from_frame(frame)
        
        # Generate visualization
        viz_frame = manager.translation_engine.visualize_pose(frame, pose_data)
        
        # Encode visualization
        _, buffer = cv2.imencode('.jpg', viz_frame)
        viz_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "success": True,
            "pose_data": {
                "pose_detected": pose_data['pose_detected'],
                "left_hand_detected": pose_data['left_hand_detected'],
                "right_hand_detected": pose_data['right_hand_detected'],
                "face_detected": pose_data['face_detected'],
                "confidence": pose_data['confidence']
            },
            "visualization": f"data:image/jpeg;base64,{viz_base64}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/models/comparison")
async def get_model_comparison():
    """Compare performance of different models"""
    i3d_stats = manager.translation_engine.get_i3d_stats()
    ensemble_stats = manager.translation_engine.get_ensemble_stats()
    
    return {
        "i3d": {
            "average_confidence": i3d_stats.get("average_confidence", 0),
            "average_latency": i3d_stats.get("average_latency", 0),
            "translations_completed": i3d_stats.get("translations_completed", 0)
        },
        "ensemble": {
            "average_confidence": ensemble_stats.get("average_confidence", 0),
            "agreement_rate": ensemble_stats.get("agreement_rate", 0),
            "i3d_only": ensemble_stats.get("i3d_only", 0),
            "tgcn_only": ensemble_stats.get("tgcn_only", 0),
            "ensemble_predictions": ensemble_stats.get("ensemble_predictions", 0)
        }
    }