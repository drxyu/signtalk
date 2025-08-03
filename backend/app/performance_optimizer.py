import asyncio
import time
from typing import Dict, List, Optional, Callable
from collections import deque
import numpy as np
import cv2
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

class PerformanceOptimizer:
    """Service for optimizing real-time streaming performance"""
    
    def __init__(self):
        self.metrics = {
            "audio_latency": deque(maxlen=100),
            "video_latency": deque(maxlen=100),
            "translation_latency": deque(maxlen=100),
            "frame_rate": deque(maxlen=100),
            "audio_processing_time": deque(maxlen=100),
            "video_processing_time": deque(maxlen=100)
        }
        self.frame_skip_threshold = 30  # Skip frames if FPS > 30
        self.audio_buffer_size = 2048  # Optimal buffer size
        self.last_frame_time = time.time()
        self.frame_count = 0
        self.optimization_settings = {
            "enable_frame_skipping": True,
            "enable_audio_compression": True,
            "enable_caching": True,
            "max_resolution": (640, 480),
            "target_fps": 15,
            "audio_sample_rate": 16000,
            "i3d_buffer_size": 128,
            "i3d_sequence_length": 64,
            "i3d_stride": 16,
            "enable_i3d": True
        }
        self._cache = {}
        
    def measure_latency(self, start_time: float, metric_name: str) -> float:
        """Measure and record latency for a specific operation"""
        latency = (time.time() - start_time) * 1000  # Convert to ms
        if metric_name in self.metrics:
            self.metrics[metric_name].append(latency)
        return latency
    
    def should_skip_frame(self) -> bool:
        """Determine if current frame should be skipped for performance"""
        if not self.optimization_settings["enable_frame_skipping"]:
            return False
            
        current_time = time.time()
        time_since_last_frame = current_time - self.last_frame_time
        current_fps = 1.0 / time_since_last_frame if time_since_last_frame > 0 else 0
        
        # Skip frame if FPS is too high
        if current_fps > self.optimization_settings["target_fps"]:
            return True
            
        self.last_frame_time = current_time
        return False
    
    def optimize_video_frame(self, frame: np.ndarray) -> np.ndarray:
        """Optimize video frame for streaming"""
        start_time = time.time()
        
        # Resize if needed
        max_width, max_height = self.optimization_settings["max_resolution"]
        height, width = frame.shape[:2]
        
        if width > max_width or height > max_height:
            scale = min(max_width / width, max_height / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        # Convert to lower quality JPEG for streaming
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]
        _, buffer = cv2.imencode('.jpg', frame, encode_param)
        frame = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
        
        self.measure_latency(start_time, "video_processing_time")
        return frame
    
    def optimize_audio_chunk(self, audio_data: bytes) -> bytes:
        """Optimize audio chunk for streaming"""
        start_time = time.time()
        
        if not self.optimization_settings["enable_audio_compression"]:
            return audio_data
        
        # Convert to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.float32)
        
        # Apply simple compression by reducing bit depth
        audio_array = (audio_array * 32767).astype(np.int16)
        audio_array = audio_array.astype(np.float32) / 32767
        
        # Downsample if needed
        current_length = len(audio_array)
        if current_length > self.audio_buffer_size * 2:
            # Simple downsampling by taking every other sample
            audio_array = audio_array[::2]
        
        optimized_data = audio_array.tobytes()
        self.measure_latency(start_time, "audio_processing_time")
        return optimized_data
    
    @lru_cache(maxsize=128)
    def get_cached_gesture(self, gesture_key: str) -> Optional[Dict]:
        """Get cached gesture data to avoid reprocessing"""
        return self._cache.get(gesture_key)
    
    def cache_gesture(self, gesture_key: str, data: Dict) -> None:
        """Cache gesture data for reuse"""
        if self.optimization_settings["enable_caching"]:
            self._cache[gesture_key] = data
            # Limit cache size
            if len(self._cache) > 100:
                # Remove oldest entries
                oldest_keys = list(self._cache.keys())[:20]
                for key in oldest_keys:
                    del self._cache[key]
    
    async def optimize_websocket_message(self, message: Dict) -> Dict:
        """Optimize WebSocket message size"""
        optimized = {}
        
        # Only include non-null fields
        for key, value in message.items():
            if value is not None:
                if key == "audio" and isinstance(value, str):
                    # Truncate audio data if too large
                    if len(value) > 50000:  # ~50KB limit
                        optimized[key] = value[:50000]
                    else:
                        optimized[key] = value
                elif key == "video" and isinstance(value, str):
                    # Video already optimized by optimize_video_frame
                    optimized[key] = value
                else:
                    optimized[key] = value
        
        return optimized
    
    def get_performance_stats(self) -> Dict:
        """Get current performance statistics"""
        stats = {}
        
        for metric_name, values in self.metrics.items():
            if values:
                stats[metric_name] = {
                    "avg": np.mean(values),
                    "min": np.min(values),
                    "max": np.max(values),
                    "p95": np.percentile(values, 95)
                }
        
        # Calculate current FPS
        if self.frame_count > 0:
            elapsed_time = time.time() - self.last_frame_time
            stats["current_fps"] = self.frame_count / elapsed_time if elapsed_time > 0 else 0
        
        return stats
    
    def auto_adjust_quality(self) -> None:
        """Automatically adjust quality settings based on performance"""
        stats = self.get_performance_stats()
        
        # Check if we need to reduce quality
        avg_video_latency = stats.get("video_latency", {}).get("avg", 0)
        avg_audio_latency = stats.get("audio_latency", {}).get("avg", 0)
        
        if avg_video_latency > 100:  # More than 100ms latency
            # Reduce video quality
            current_res = self.optimization_settings["max_resolution"]
            new_width = int(current_res[0] * 0.8)
            new_height = int(current_res[1] * 0.8)
            self.optimization_settings["max_resolution"] = (max(320, new_width), max(240, new_height))
            logger.info(f"Reduced video resolution to {self.optimization_settings['max_resolution']}")
        
        if avg_audio_latency > 50:  # More than 50ms latency
            # Reduce audio quality
            self.optimization_settings["audio_sample_rate"] = max(8000, self.optimization_settings["audio_sample_rate"] - 2000)
            logger.info(f"Reduced audio sample rate to {self.optimization_settings['audio_sample_rate']}")
    
    async def optimize_batch_processing(self, items: List[Dict], processor: Callable) -> List[Dict]:
        """Process items in optimized batches"""
        batch_size = 5  # Process 5 items at a time
        results = []
        
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            batch_results = await asyncio.gather(*[processor(item) for item in batch])
            results.extend(batch_results)
            
            # Small delay to prevent overwhelming the system
            await asyncio.sleep(0.01)
        
        return results
    
    def get_optimization_recommendations(self) -> List[str]:
        """Get recommendations for improving performance"""
        recommendations = []
        stats = self.get_performance_stats()
        
        # Check video latency
        if stats.get("video_latency", {}).get("avg", 0) > 100:
            recommendations.append("Consider reducing video resolution or frame rate")
        
        # Check audio latency
        if stats.get("audio_latency", {}).get("avg", 0) > 50:
            recommendations.append("Consider reducing audio sample rate or buffer size")
        
        # Check translation latency
        if stats.get("translation_latency", {}).get("avg", 0) > 150:
            recommendations.append("Consider using cached translations or simplified models")
        
        # Check FPS
        current_fps = stats.get("current_fps", 0)
        if current_fps < 10:
            recommendations.append("Frame rate is low, check CPU/GPU usage")
        elif current_fps > 30:
            recommendations.append("Frame rate is high, consider enabling frame skipping")
        
        return recommendations
    
    def get_i3d_optimization_settings(self) -> Dict:
        """Get I3D-specific optimization settings"""
        return {
            "buffer_size": self.optimization_settings["i3d_buffer_size"],
            "sequence_length": self.optimization_settings["i3d_sequence_length"],
            "stride": self.optimization_settings["i3d_stride"],
            "enabled": self.optimization_settings["enable_i3d"]
        }
    
    def update_i3d_settings(self, settings: Dict) -> None:
        """Update I3D optimization settings"""
        if "buffer_size" in settings:
            self.optimization_settings["i3d_buffer_size"] = settings["buffer_size"]
        if "sequence_length" in settings:
            self.optimization_settings["i3d_sequence_length"] = settings["sequence_length"]
        if "stride" in settings:
            self.optimization_settings["i3d_stride"] = settings["stride"]
        if "enabled" in settings:
            self.optimization_settings["enable_i3d"] = settings["enabled"]
        
        logger.info(f"Updated I3D settings: {self.get_i3d_optimization_settings()}")
    
    def should_process_i3d_frame(self, frame_count: int) -> bool:
        """Determine if current frame should be processed by I3D"""
        if not self.optimization_settings["enable_i3d"]:
            return False
        
        # Process every Nth frame based on stride
        stride = self.optimization_settings["i3d_stride"]
        return frame_count % stride == 0