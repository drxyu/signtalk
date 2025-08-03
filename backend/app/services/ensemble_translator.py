"""
Ensemble Translator Service
Combines I3D (appearance-based) and TGCN (pose-based) models for improved accuracy
"""

import asyncio
import numpy as np
from typing import List, Dict, Optional, Tuple, Any
import logging
import time
from collections import deque
import threading

from ..models.i3d import I3DProcessor, VocabularyManager, TemporalBuffer
from ..models.tgcn import PoseProcessor
from ..utils.logger import setup_logger
from ..utils.video_augmentation import PoseAwareAugmentation

logger = setup_logger(__name__)


class EnsembleTranslator:
    """Ensemble service combining I3D and TGCN models"""
    
    def __init__(self,
                 vocab_size: int = 100,
                 i3d_weights_path: Optional[str] = None,
                 tgcn_weights_path: Optional[str] = None,
                 device: Optional[str] = None,
                 ensemble_weights: Optional[Dict[str, float]] = None):
        """
        Initialize ensemble translator
        
        Args:
            vocab_size: Vocabulary size
            i3d_weights_path: Path to I3D weights
            tgcn_weights_path: Path to TGCN weights
            device: Device to use
            ensemble_weights: Model weights for ensemble
        """
        self.vocab_size = vocab_size
        
        # Initialize models
        self.i3d_processor = I3DProcessor(
            num_classes=vocab_size,
            weights_path=i3d_weights_path,
            device=device
        )
        
        self.pose_processor = PoseProcessor(
            num_classes=vocab_size,
            weights_path=tgcn_weights_path,
            device=device
        )
        
        # Shared vocabulary
        self.vocabulary = VocabularyManager(vocab_size=vocab_size)
        
        # Ensemble weights (can be learned or tuned)
        self.ensemble_weights = ensemble_weights or {
            'i3d': 0.6,  # Appearance features
            'tgcn': 0.4  # Pose features
        }
        
        # Temporal buffers for both models
        self.i3d_buffer = TemporalBuffer(
            buffer_size=128,
            sequence_length=64,
            stride=16,
            fps_target=25
        )
        
        self.pose_buffer = TemporalBuffer(
            buffer_size=64,
            sequence_length=30,
            stride=10,
            fps_target=15  # Lower FPS for pose
        )
        
        # Augmentation
        self.augmentation = PoseAwareAugmentation()
        
        # Results cache with thread safety
        self.results_cache = deque(maxlen=10)
        self.cache_lock = threading.Lock()
        
        # Statistics
        self.stats = {
            'ensemble_predictions': 0,
            'i3d_only': 0,
            'tgcn_only': 0,
            'agreement_rate': 0.0,
            'average_confidence': 0.0
        }
        
        logger.info(f"Ensemble translator initialized with weights: {self.ensemble_weights}")
    
    async def process_frame(self, frame: np.ndarray) -> bool:
        """
        Process a single frame for both models
        
        Args:
            frame: Video frame
            
        Returns:
            Success status
        """
        # Add to I3D buffer
        i3d_added = self.i3d_buffer.add_frame(frame)
        
        # Extract pose and add to TGCN buffer
        pose_data = self.pose_processor.process_single_frame(frame)
        if pose_data['confidence'] > 0.5:  # Only add good poses
            pose_frame = pose_data['keypoints']
            self.pose_buffer.add_frame(pose_frame)
        
        return i3d_added
    
    async def get_ensemble_prediction(self) -> Optional[Dict[str, Any]]:
        """
        Get ensemble prediction from both models
        
        Returns:
            Ensemble prediction result
        """
        # Get sequences from buffers
        i3d_sequence = self.i3d_buffer.get_latest_sequence()
        pose_sequence = self.pose_buffer.get_latest_sequence()
        
        if i3d_sequence is None and pose_sequence is None:
            return None
        
        # Run predictions in parallel
        tasks = []
        
        if i3d_sequence is not None:
            tasks.append(self._get_i3d_prediction(i3d_sequence))
        
        if pose_sequence is not None:
            tasks.append(self._get_tgcn_prediction(pose_sequence))
        
        if not tasks:
            return None
        
        # Wait for predictions
        predictions = await asyncio.gather(*tasks)
        
        # Combine predictions
        return self._ensemble_predictions(predictions)
    
    async def _get_i3d_prediction(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Get I3D prediction"""
        try:
            result = self.i3d_processor.inference(frames)
            result['model'] = 'i3d'
            return result
        except Exception as e:
            logger.error(f"I3D prediction error: {e}")
            return {'success': False, 'model': 'i3d', 'error': str(e)}
    
    async def _get_tgcn_prediction(self, pose_sequence: List[np.ndarray]) -> Dict[str, Any]:
        """Get TGCN prediction"""
        try:
            # Convert list to numpy array
            pose_array = np.array(pose_sequence)
            result = self.pose_processor.inference(pose_array)
            result['model'] = 'tgcn'
            return result
        except Exception as e:
            logger.error(f"TGCN prediction error: {e}")
            return {'success': False, 'model': 'tgcn', 'error': str(e)}
    
    def _ensemble_predictions(self, predictions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Combine predictions from multiple models
        
        Args:
            predictions: List of model predictions
            
        Returns:
            Ensemble result
        """
        start_time = time.time()
        
        # Filter successful predictions
        valid_predictions = [p for p in predictions if p.get('success', False)]
        
        if not valid_predictions:
            return {
                'success': False,
                'error': 'No valid predictions',
                'method': 'ensemble'
            }
        
        # Single model fallback
        if len(valid_predictions) == 1:
            result = valid_predictions[0].copy()
            result['method'] = 'ensemble_single'
            result['models_used'] = [valid_predictions[0]['model']]
            
            # Update stats
            self.stats[f"{valid_predictions[0]['model']}_only"] += 1
            
            return result
        
        # Ensemble combination
        ensemble_probs = None
        model_results = {}
        
        for pred in valid_predictions:
            model = pred['model']
            weight = self.ensemble_weights.get(model, 0.5)
            probs = pred['probabilities']
            
            # Weight probabilities
            weighted_probs = probs * weight
            
            if ensemble_probs is None:
                ensemble_probs = weighted_probs
            else:
                ensemble_probs += weighted_probs
            
            # Store individual results
            model_results[model] = {
                'prediction': pred['prediction'],
                'confidence': pred['confidence'],
                'top_k': list(zip(pred.get('top_k_indices', []), 
                                pred.get('top_k_confidences', [])))
            }
        
        # Normalize ensemble probabilities
        ensemble_probs = ensemble_probs / sum(self.ensemble_weights.values())
        
        # Get ensemble prediction
        prediction_id = int(np.argmax(ensemble_probs))
        confidence = float(ensemble_probs[prediction_id])
        
        # Get top-k
        top_k = min(5, len(ensemble_probs))
        top_indices = np.argsort(ensemble_probs)[-top_k:][::-1]
        top_confidences = ensemble_probs[top_indices]
        
        # Get gloss and text
        gloss = self.vocabulary.id_to_gloss.get(prediction_id, 'unknown')
        text = self.vocabulary.get_gloss_text(gloss)
        
        # Check model agreement
        model_predictions = [r['prediction'] for r in model_results.values()]
        agreement = len(set(model_predictions)) == 1
        
        # Update stats
        self.stats['ensemble_predictions'] += 1
        n = self.stats['ensemble_predictions']
        self.stats['agreement_rate'] = (
            (self.stats['agreement_rate'] * (n - 1) + (1 if agreement else 0)) / n
        )
        self.stats['average_confidence'] = (
            (self.stats['average_confidence'] * (n - 1) + confidence) / n
        )
        
        # Create result
        result = {
            'success': True,
            'prediction': prediction_id,
            'gloss': gloss,
            'text': text,
            'confidence': confidence,
            'probabilities': ensemble_probs,
            'top_k_indices': top_indices.tolist(),
            'top_k_confidences': top_confidences.tolist(),
            'method': 'ensemble',
            'models_used': list(model_results.keys()),
            'model_results': model_results,
            'agreement': agreement,
            'latency_ms': (time.time() - start_time) * 1000
        }
        
        # Cache result with thread safety
        with self.cache_lock:
            self.results_cache.append(result)
        
        return result
    
    def update_ensemble_weights(self, weights: Dict[str, float]):
        """
        Update ensemble weights
        
        Args:
            weights: New weights dictionary
        """
        # Normalize weights
        total = sum(weights.values())
        self.ensemble_weights = {k: v/total for k, v in weights.items()}
        logger.info(f"Updated ensemble weights: {self.ensemble_weights}")
    
    def get_adaptive_weights(self) -> Dict[str, float]:
        """
        Calculate adaptive weights based on recent performance
        
        Returns:
            Adaptive weights
        """
        with self.cache_lock:
            if len(self.results_cache) < 5:
                return self.ensemble_weights
            
            # Analyze recent predictions
            model_confidences = {'i3d': [], 'tgcn': []}
            
            for result in list(self.results_cache):  # Create a copy for thread safety
                if 'model_results' in result:
                    for model, data in result['model_results'].items():
                        model_confidences[model].append(data['confidence'])
        
        # Calculate average confidences
        adaptive_weights = {}
        for model in ['i3d', 'tgcn']:
            if model_confidences[model]:
                avg_conf = np.mean(model_confidences[model])
                adaptive_weights[model] = avg_conf
            else:
                adaptive_weights[model] = 0.5
        
        # Normalize
        total = sum(adaptive_weights.values())
        if total > 0:
            adaptive_weights = {k: v/total for k, v in adaptive_weights.items()}
        
        return adaptive_weights
    
    def get_stats(self) -> Dict[str, Any]:
        """Get ensemble statistics"""
        stats = self.stats.copy()
        stats['current_weights'] = self.ensemble_weights
        stats['adaptive_weights'] = self.get_adaptive_weights()
        stats['i3d_buffer_info'] = self.i3d_buffer.get_buffer_info()
        stats['pose_buffer_info'] = self.pose_buffer.get_buffer_info()
        return stats
    
    def clear_buffers(self):
        """Clear all buffers"""
        self.i3d_buffer.clear()
        self.pose_buffer.clear()
        with self.cache_lock:
            self.results_cache.clear()
        logger.info("Ensemble buffers cleared")