"""
I3D Performance Monitoring and Logging
"""

import time
import json
from typing import Dict, List, Optional
from collections import deque, defaultdict
from datetime import datetime
import logging
import asyncio
from pathlib import Path

from .logger import setup_logger

logger = setup_logger(__name__)


class I3DPerformanceMonitor:
    """Monitor I3D model performance and collect metrics"""
    
    def __init__(self, log_dir: str = "./logs/i3d"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Metrics storage
        self.metrics = {
            "inference_times": deque(maxlen=1000),
            "buffer_fill_rates": deque(maxlen=1000),
            "confidence_scores": deque(maxlen=1000),
            "vocabulary_usage": defaultdict(int),
            "frame_processing_times": deque(maxlen=1000),
            "memory_usage": deque(maxlen=100),
            "gpu_usage": deque(maxlen=100)
        }
        
        # Performance thresholds
        self.thresholds = {
            "max_inference_time": 200,  # ms
            "min_confidence": 0.7,
            "max_buffer_lag": 1000,  # ms
            "max_memory_usage": 2048  # MB
        }
        
        # Alert tracking
        self.alerts = deque(maxlen=100)
        self.alert_callbacks = []
        
        # Start time
        self.start_time = time.time()
        
        # Logging interval
        self.log_interval = 60  # seconds
        self.last_log_time = time.time()
    
    def log_inference(self, 
                     inference_time: float, 
                     confidence: float, 
                     prediction: str,
                     vocab_size: int):
        """Log inference metrics"""
        self.metrics["inference_times"].append(inference_time)
        self.metrics["confidence_scores"].append(confidence)
        self.metrics["vocabulary_usage"][prediction] += 1
        
        # Check for performance issues
        if inference_time > self.thresholds["max_inference_time"]:
            self._create_alert(
                "high_inference_time",
                f"Inference time {inference_time:.1f}ms exceeds threshold"
            )
        
        if confidence < self.thresholds["min_confidence"]:
            self._create_alert(
                "low_confidence",
                f"Low confidence score: {confidence:.2f} for {prediction}"
            )
        
        # Log detailed metrics
        logger.debug(f"I3D Inference: {prediction} (conf={confidence:.2f}, "
                    f"time={inference_time:.1f}ms, vocab={vocab_size})")
    
    def log_buffer_state(self, 
                        buffer_size: int, 
                        sequences_ready: int,
                        dropped_frames: int):
        """Log temporal buffer state"""
        self.metrics["buffer_fill_rates"].append(buffer_size)
        
        if dropped_frames > 0:
            logger.warning(f"Dropped {dropped_frames} frames from I3D buffer")
            self._create_alert(
                "frames_dropped",
                f"Dropped {dropped_frames} frames"
            )
    
    def log_frame_processing(self, processing_time: float):
        """Log frame processing time"""
        self.metrics["frame_processing_times"].append(processing_time)
    
    def log_resource_usage(self, memory_mb: float, gpu_percent: Optional[float] = None):
        """Log resource usage"""
        self.metrics["memory_usage"].append(memory_mb)
        
        if gpu_percent is not None:
            self.metrics["gpu_usage"].append(gpu_percent)
        
        if memory_mb > self.thresholds["max_memory_usage"]:
            self._create_alert(
                "high_memory_usage",
                f"Memory usage {memory_mb:.1f}MB exceeds threshold"
            )
    
    def _create_alert(self, alert_type: str, message: str):
        """Create and log an alert"""
        alert = {
            "type": alert_type,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        self.alerts.append(alert)
        logger.warning(f"I3D Alert: {alert_type} - {message}")
        
        # Trigger callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")
    
    def add_alert_callback(self, callback):
        """Add callback for alerts"""
        self.alert_callbacks.append(callback)
    
    def get_current_stats(self) -> Dict:
        """Get current performance statistics"""
        stats = {}
        
        # Calculate averages
        if self.metrics["inference_times"]:
            stats["avg_inference_time"] = sum(self.metrics["inference_times"]) / len(self.metrics["inference_times"])
            stats["max_inference_time"] = max(self.metrics["inference_times"])
        
        if self.metrics["confidence_scores"]:
            stats["avg_confidence"] = sum(self.metrics["confidence_scores"]) / len(self.metrics["confidence_scores"])
            stats["min_confidence"] = min(self.metrics["confidence_scores"])
        
        if self.metrics["buffer_fill_rates"]:
            stats["avg_buffer_fill"] = sum(self.metrics["buffer_fill_rates"]) / len(self.metrics["buffer_fill_rates"])
        
        # Top predictions
        top_predictions = sorted(
            self.metrics["vocabulary_usage"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        stats["top_predictions"] = top_predictions
        
        # Resource usage
        if self.metrics["memory_usage"]:
            stats["avg_memory_mb"] = sum(self.metrics["memory_usage"]) / len(self.metrics["memory_usage"])
        
        if self.metrics["gpu_usage"]:
            stats["avg_gpu_percent"] = sum(self.metrics["gpu_usage"]) / len(self.metrics["gpu_usage"])
        
        # Recent alerts
        stats["recent_alerts"] = list(self.alerts)[-10:]
        
        # Uptime
        stats["uptime_seconds"] = time.time() - self.start_time
        
        return stats
    
    async def periodic_logging(self):
        """Periodically log metrics to file"""
        while True:
            await asyncio.sleep(self.log_interval)
            
            try:
                current_time = time.time()
                if current_time - self.last_log_time >= self.log_interval:
                    stats = self.get_current_stats()
                    
                    # Log to file
                    log_file = self.log_dir / f"i3d_metrics_{datetime.now().strftime('%Y%m%d')}.jsonl"
                    with open(log_file, 'a') as f:
                        log_entry = {
                            "timestamp": datetime.now().isoformat(),
                            "stats": stats
                        }
                        f.write(json.dumps(log_entry) + '\n')
                    
                    # Log summary
                    logger.info(f"I3D Performance: avg_inference={stats.get('avg_inference_time', 0):.1f}ms, "
                               f"avg_confidence={stats.get('avg_confidence', 0):.2f}, "
                               f"alerts={len(self.alerts)}")
                    
                    self.last_log_time = current_time
            
            except Exception as e:
                logger.error(f"Error in periodic logging: {e}")
    
    def get_performance_report(self) -> str:
        """Generate a performance report"""
        stats = self.get_current_stats()
        
        report = "=== I3D Performance Report ===\n\n"
        
        # Inference Performance
        report += "Inference Performance:\n"
        report += f"  Average Time: {stats.get('avg_inference_time', 0):.1f}ms\n"
        report += f"  Max Time: {stats.get('max_inference_time', 0):.1f}ms\n"
        report += f"  Average Confidence: {stats.get('avg_confidence', 0):.2f}\n"
        report += f"  Min Confidence: {stats.get('min_confidence', 0):.2f}\n\n"
        
        # Top Predictions
        report += "Top Predictions:\n"
        for pred, count in stats.get('top_predictions', [])[:5]:
            report += f"  {pred}: {count} times\n"
        report += "\n"
        
        # Resource Usage
        report += "Resource Usage:\n"
        report += f"  Average Memory: {stats.get('avg_memory_mb', 0):.1f}MB\n"
        if 'avg_gpu_percent' in stats:
            report += f"  Average GPU: {stats['avg_gpu_percent']:.1f}%\n"
        report += "\n"
        
        # Alerts
        report += f"Total Alerts: {len(self.alerts)}\n"
        if self.alerts:
            report += "Recent Alerts:\n"
            for alert in list(self.alerts)[-5:]:
                report += f"  [{alert['timestamp']}] {alert['type']}: {alert['message']}\n"
        
        # Uptime
        uptime = stats.get('uptime_seconds', 0)
        hours = int(uptime // 3600)
        minutes = int((uptime % 3600) // 60)
        report += f"\nUptime: {hours}h {minutes}m\n"
        
        return report
    
    def reset_metrics(self):
        """Reset all metrics"""
        for key in self.metrics:
            if isinstance(self.metrics[key], deque):
                self.metrics[key].clear()
            elif isinstance(self.metrics[key], defaultdict):
                self.metrics[key].clear()
        
        self.alerts.clear()
        logger.info("I3D metrics reset")


# Global monitor instance
_monitor_instance = None


def get_i3d_monitor() -> I3DPerformanceMonitor:
    """Get global I3D monitor instance"""
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = I3DPerformanceMonitor()
    return _monitor_instance