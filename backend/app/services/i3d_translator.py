"""
I3D Translator Service
Integrates I3D model with the translation pipeline
"""

import asyncio
import numpy as np
from typing import List, Dict, Optional, Tuple, Any
import logging
import time
from collections import deque
import threading

from ..models.i3d import I3DProcessor, VocabularyManager, TemporalBuffer
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class I3DTranslatorService:
    """Service for translating sign language using I3D model"""
    
    def __init__(self, 
                 vocab_size: int = 100,
                 weights_path: Optional[str] = None,
                 device: Optional[str] = None,
                 confidence_threshold: float = 0.7):
        """
        Initialize I3D translator service
        
        Args:
            vocab_size: Vocabulary size (100, 300, 1000, 2000, 3000)
            weights_path: Path to I3D model weights
            device: Device to use for inference
            confidence_threshold: Minimum confidence for predictions
        """
        self.vocab_size = vocab_size
        self.confidence_threshold = confidence_threshold
        
        # Initialize components
        self.processor = I3DProcessor(
            num_classes=vocab_size,
            weights_path=weights_path,
            device=device
        )
        
        self.vocabulary = VocabularyManager(vocab_size=vocab_size)
        
        self.temporal_buffer = TemporalBuffer(
            buffer_size=128,
            sequence_length=64,
            stride=16,
            fps_target=25,
            on_sequence_ready=self._on_sequence_ready
        )
        
        # Translation cache
        self.translation_cache = deque(maxlen=10)
        self.last_translation = None
        self.last_translation_time = 0
        
        # Processing queue
        self.processing_queue = asyncio.Queue(maxsize=5)
        self.is_processing = False
        
        # Statistics
        self.stats = {
            'translations_completed': 0,
            'average_confidence': 0.0,
            'average_latency': 0.0,
            'cache_hits': 0
        }
        
        logger.info(f"I3D Translator initialized with vocab_size={vocab_size}")
    
    def _on_sequence_ready(self, sequence):
        """Callback when temporal buffer has a ready sequence"""
        try:
            # Extract frames from sequence
            frames = [frame_data.frame for frame_data in sequence]
            
            # Add to processing queue (non-blocking)
            asyncio.create_task(self._add_to_queue(frames))
            
        except Exception as e:
            logger.error(f"Error in sequence ready callback: {e}")
    
    async def _add_to_queue(self, frames):
        """Add frames to processing queue"""
        try:
            await asyncio.wait_for(
                self.processing_queue.put(frames),
                timeout=0.1  # Don't block if queue is full
            )
        except asyncio.TimeoutError:
            logger.warning("Processing queue full, dropping sequence")
    
    async def process_frame(self, frame: np.ndarray) -> bool:
        """
        Process a single frame
        
        Args:
            frame: Video frame
            
        Returns:
            True if frame was added to buffer
        """
        return self.temporal_buffer.add_frame(frame)
    
    async def translate_frames(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """
        Translate a sequence of frames
        
        Args:
            frames: List of video frames
            
        Returns:
            Translation result
        """
        start_time = time.time()
        
        try:
            # Run I3D inference
            inference_result = self.processor.inference(frames)
            
            if not inference_result['success']:
                return {
                    'success': False,
                    'error': inference_result.get('error', 'Inference failed')
                }
            
            # Get prediction
            prediction_id = inference_result['prediction']
            confidence = inference_result['confidence']
            
            # Check confidence threshold
            if confidence < self.confidence_threshold:
                return {
                    'success': False,
                    'confidence': confidence,
                    'reason': 'Low confidence'
                }
            
            # Get gloss and text
            gloss = self.vocabulary.id_to_gloss.get(prediction_id, 'unknown')
            text = self.vocabulary.get_gloss_text(gloss)
            
            # Get top-k predictions for alternatives
            top_k_indices = inference_result['top_k_indices']
            top_k_confidences = inference_result['top_k_confidences']
            
            alternatives = []
            for idx, conf in zip(top_k_indices[1:], top_k_confidences[1:]):  # Skip first (main prediction)
                alt_gloss = self.vocabulary.id_to_gloss.get(idx, 'unknown')
                alt_text = self.vocabulary.get_gloss_text(alt_gloss)
                alternatives.append({
                    'gloss': alt_gloss,
                    'text': alt_text,
                    'confidence': float(conf)
                })
            
            # Calculate latency
            latency = (time.time() - start_time) * 1000  # ms
            
            # Update statistics
            self._update_stats(confidence, latency)
            
            # Create result
            result = {
                'success': True,
                'gloss': gloss,
                'text': text,
                'confidence': float(confidence),
                'alternatives': alternatives,
                'latency_ms': latency,
                'vocab_size': self.vocab_size,
                'method': 'i3d'
            }
            
            # Cache result
            self._cache_translation(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in I3D translation: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_latest_translation(self) -> Optional[Dict[str, Any]]:
        """Get the latest translation from queue or cache"""
        # Check if we have pending sequences
        if not self.processing_queue.empty():
            try:
                frames = await asyncio.wait_for(
                    self.processing_queue.get(),
                    timeout=0.1
                )
                return await self.translate_frames(frames)
            except asyncio.TimeoutError:
                pass
        
        # Return cached translation if recent
        current_time = time.time()
        if self.last_translation and (current_time - self.last_translation_time) < 1.0:
            self.stats['cache_hits'] += 1
            return self.last_translation
        
        return None
    
    async def translate_with_context(self, 
                                   frames: List[np.ndarray],
                                   context: List[Dict]) -> Dict[str, Any]:
        """
        Translate with context awareness
        
        Args:
            frames: Video frames
            context: Previous translations for context
            
        Returns:
            Translation result
        """
        # Get base translation
        result = await self.translate_frames(frames)
        
        if result['success'] and context:
            # Apply context-based adjustments
            result = self._apply_context(result, context)
        
        return result
    
    def _apply_context(self, result: Dict[str, Any], context: List[Dict]) -> Dict[str, Any]:
        """Apply context to improve translation"""
        # Simple context application - can be enhanced
        recent_glosses = [c.get('gloss', '') for c in context[-3:] if c.get('success')]
        
        # Add context information
        result['context_glosses'] = recent_glosses
        
        # Adjust confidence based on context consistency
        if result['gloss'] in recent_glosses:
            result['confidence'] = min(1.0, result['confidence'] * 1.1)
            result['context_boost'] = True
        
        return result
    
    def _cache_translation(self, result: Dict[str, Any]):
        """Cache translation result"""
        self.last_translation = result
        self.last_translation_time = time.time()
        self.translation_cache.append(result)
    
    def _update_stats(self, confidence: float, latency: float):
        """Update service statistics"""
        self.stats['translations_completed'] += 1
        
        # Update running averages
        n = self.stats['translations_completed']
        self.stats['average_confidence'] = (
            (self.stats['average_confidence'] * (n - 1) + confidence) / n
        )
        self.stats['average_latency'] = (
            (self.stats['average_latency'] * (n - 1) + latency) / n
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        stats = self.stats.copy()
        stats['buffer_info'] = self.temporal_buffer.get_buffer_info()
        stats['vocabulary_stats'] = self.vocabulary.get_vocabulary_stats()
        return stats
    
    def update_vocabulary_size(self, vocab_size: int):
        """Update vocabulary size and reload models"""
        if vocab_size != self.vocab_size:
            logger.info(f"Updating vocabulary size from {self.vocab_size} to {vocab_size}")
            self.vocab_size = vocab_size
            
            # Update processor
            self.processor.set_num_classes(vocab_size)
            
            # Reload vocabulary
            self.vocabulary = VocabularyManager(vocab_size=vocab_size)
            
            # Clear caches
            self.translation_cache.clear()
            self.last_translation = None
    
    def clear_buffer(self):
        """Clear temporal buffer"""
        self.temporal_buffer.clear()
        logger.info("I3D temporal buffer cleared")
    
    async def search_signs(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for signs in vocabulary"""
        results = self.vocabulary.search_glosses(query, limit)
        
        return [
            {
                'gloss': gloss,
                'text': self.vocabulary.get_gloss_text(gloss),
                'score': score,
                'id': self.vocabulary.get_gloss_id(gloss)
            }
            for gloss, score in results
        ]