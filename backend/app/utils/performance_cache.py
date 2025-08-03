"""
Performance Cache for I3D Model
Implements LRU caching and optimization strategies
"""

import torch
import numpy as np
from typing import Dict, Any, Optional, Tuple
import hashlib
from collections import OrderedDict
import time
import threading

class PerformanceCache:
    """LRU cache for model predictions"""
    
    def __init__(self, max_size: int = 100, ttl_seconds: float = 300):
        """
        Initialize cache
        
        Args:
            max_size: Maximum number of entries
            ttl_seconds: Time to live for entries
        """
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache = OrderedDict()
        self.lock = threading.Lock()
        self.hits = 0
        self.misses = 0
    
    def _generate_key(self, frames: np.ndarray) -> str:
        """Generate cache key from frames"""
        # Use shape and sample of frames for key
        if isinstance(frames, list):
            shape_str = f"{len(frames)}x{frames[0].shape}"
            sample = np.concatenate([f[::10, ::10, :].flatten()[:100] for f in frames[:5]])
        else:
            shape_str = str(frames.shape)
            sample = frames.flatten()[:1000]
        
        key_data = f"{shape_str}_{sample.tobytes()}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, frames: np.ndarray) -> Optional[Dict[str, Any]]:
        """Get cached result"""
        key = self._generate_key(frames)
        
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                # Check if expired
                if time.time() - entry['timestamp'] < self.ttl_seconds:
                    # Move to end (most recently used)
                    self.cache.move_to_end(key)
                    self.hits += 1
                    return entry['result']
                else:
                    # Remove expired entry
                    del self.cache[key]
            
            self.misses += 1
            return None
    
    def put(self, frames: np.ndarray, result: Dict[str, Any]):
        """Store result in cache"""
        key = self._generate_key(frames)
        
        with self.lock:
            # Remove oldest if at capacity
            if len(self.cache) >= self.max_size:
                self.cache.popitem(last=False)
            
            self.cache[key] = {
                'result': result,
                'timestamp': time.time()
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = self.hits / total if total > 0 else 0
        
        return {
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': hit_rate,
            'size': len(self.cache),
            'max_size': self.max_size
        }
    
    def clear(self):
        """Clear cache"""
        with self.lock:
            self.cache.clear()
            self.hits = 0
            self.misses = 0


class I3DOptimizer:
    """Performance optimizations for I3D model"""
    
    def __init__(self, model):
        """Initialize optimizer with model"""
        self.model = model
        self.cache = PerformanceCache()
        self.batch_size = 1
        self.use_half_precision = False
        
    def optimize_model(self):
        """Apply model optimizations"""
        # Set model to eval mode
        self.model.eval()
        
        # Disable gradient computation
        for param in self.model.parameters():
            param.requires_grad = False
        
        # Try to compile with torch.compile if available (PyTorch 2.0+)
        if hasattr(torch, 'compile'):
            try:
                self.model = torch.compile(self.model, mode='reduce-overhead')
                print("Model compiled with torch.compile")
            except:
                pass
    
    def enable_half_precision(self):
        """Enable half precision (FP16) inference"""
        if torch.cuda.is_available():
            self.model = self.model.half()
            self.use_half_precision = True
    
    def batch_inference(self, frame_sequences: list) -> list:
        """Process multiple sequences in batch"""
        if len(frame_sequences) == 1:
            return [self.single_inference(frame_sequences[0])]
        
        # Stack sequences into batch
        batch = torch.stack(frame_sequences)
        
        # Run batch inference
        with torch.no_grad():
            if self.use_half_precision and torch.cuda.is_available():
                batch = batch.half()
            
            outputs = self.model(batch)
            
        # Process outputs
        results = []
        for i in range(len(frame_sequences)):
            result = self._process_output(outputs[i])
            results.append(result)
            
        return results
    
    def single_inference(self, frames) -> Dict[str, Any]:
        """Optimized single inference with caching"""
        # Check cache first
        cached = self.cache.get(frames)
        if cached is not None:
            return cached
        
        # Run inference
        start_time = time.time()
        
        with torch.no_grad():
            if self.use_half_precision and torch.cuda.is_available():
                frames = frames.half()
            
            output = self.model(frames)
            
        result = self._process_output(output)
        result['inference_time_ms'] = (time.time() - start_time) * 1000
        
        # Cache result
        self.cache.put(frames, result)
        
        return result
    
    def _process_output(self, output):
        """Process model output"""
        probs = torch.softmax(output, dim=-1)
        prediction = torch.argmax(probs)
        confidence = torch.max(probs)
        
        return {
            'prediction': prediction.item(),
            'confidence': confidence.item(),
            'probabilities': probs.cpu().numpy()
        }
    
    def warmup(self, input_shape=(1, 3, 64, 224, 224)):
        """Warmup model with dummy input"""
        dummy_input = torch.randn(*input_shape)
        if torch.cuda.is_available():
            dummy_input = dummy_input.cuda()
            if self.use_half_precision:
                dummy_input = dummy_input.half()
        
        # Run a few iterations to warmup
        for _ in range(3):
            with torch.no_grad():
                _ = self.model(dummy_input)
        
        torch.cuda.synchronize() if torch.cuda.is_available() else None
        
    def get_optimization_stats(self) -> Dict[str, Any]:
        """Get optimization statistics"""
        stats = {
            'cache_stats': self.cache.get_stats(),
            'half_precision': self.use_half_precision,
            'batch_size': self.batch_size,
            'device': next(self.model.parameters()).device.type
        }
        return stats