"""
Video Augmentation Techniques
Adapted from WLASL for improving sign language recognition robustness
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional, Union
import random
from dataclasses import dataclass


@dataclass
class AugmentationConfig:
    """Configuration for video augmentation"""
    random_crop_prob: float = 0.5
    random_flip_prob: float = 0.3
    brightness_range: Tuple[float, float] = (0.8, 1.2)
    contrast_range: Tuple[float, float] = (0.8, 1.2)
    rotation_range: Tuple[float, float] = (-10, 10)
    scale_range: Tuple[float, float] = (0.9, 1.1)
    noise_prob: float = 0.2
    noise_std: float = 0.01


class VideoAugmentation:
    """Video augmentation for sign language data"""
    
    def __init__(self, config: Optional[AugmentationConfig] = None):
        """
        Initialize video augmentation
        
        Args:
            config: Augmentation configuration
        """
        self.config = config or AugmentationConfig()
    
    def random_crop(self, frame: np.ndarray, crop_size: Tuple[int, int]) -> np.ndarray:
        """
        Randomly crop frame
        
        Args:
            frame: Input frame
            crop_size: Target crop size (width, height)
            
        Returns:
            Cropped frame
        """
        h, w = frame.shape[:2]
        crop_w, crop_h = crop_size
        
        if w <= crop_w or h <= crop_h:
            # Resize if frame is smaller than crop size
            return cv2.resize(frame, crop_size)
        
        # Random crop position
        x = random.randint(0, w - crop_w)
        y = random.randint(0, h - crop_h)
        
        return frame[y:y+crop_h, x:x+crop_w]
    
    def center_crop(self, frame: np.ndarray, crop_size: Tuple[int, int]) -> np.ndarray:
        """
        Center crop frame
        
        Args:
            frame: Input frame
            crop_size: Target crop size (width, height)
            
        Returns:
            Cropped frame
        """
        h, w = frame.shape[:2]
        crop_w, crop_h = crop_size
        
        if w <= crop_w or h <= crop_h:
            return cv2.resize(frame, crop_size)
        
        # Center crop
        x = (w - crop_w) // 2
        y = (h - crop_h) // 2
        
        return frame[y:y+crop_h, x:x+crop_w]
    
    def random_flip(self, frame: np.ndarray) -> np.ndarray:
        """
        Randomly flip frame horizontally
        
        Args:
            frame: Input frame
            
        Returns:
            Possibly flipped frame
        """
        if random.random() < self.config.random_flip_prob:
            return cv2.flip(frame, 1)  # Horizontal flip
        return frame
    
    def adjust_brightness(self, frame: np.ndarray) -> np.ndarray:
        """
        Randomly adjust brightness
        
        Args:
            frame: Input frame
            
        Returns:
            Brightness-adjusted frame
        """
        factor = random.uniform(*self.config.brightness_range)
        return np.clip(frame * factor, 0, 255).astype(np.uint8)
    
    def adjust_contrast(self, frame: np.ndarray) -> np.ndarray:
        """
        Randomly adjust contrast
        
        Args:
            frame: Input frame
            
        Returns:
            Contrast-adjusted frame
        """
        factor = random.uniform(*self.config.contrast_range)
        mean = np.mean(frame, axis=(0, 1), keepdims=True)
        return np.clip((frame - mean) * factor + mean, 0, 255).astype(np.uint8)
    
    def random_rotation(self, frame: np.ndarray) -> np.ndarray:
        """
        Randomly rotate frame
        
        Args:
            frame: Input frame
            
        Returns:
            Rotated frame
        """
        angle = random.uniform(*self.config.rotation_range)
        h, w = frame.shape[:2]
        center = (w // 2, h // 2)
        
        # Rotation matrix
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        
        # Rotate with black borders
        return cv2.warpAffine(frame, M, (w, h), borderValue=(0, 0, 0))
    
    def random_scale(self, frame: np.ndarray) -> np.ndarray:
        """
        Randomly scale frame
        
        Args:
            frame: Input frame
            
        Returns:
            Scaled frame
        """
        scale = random.uniform(*self.config.scale_range)
        h, w = frame.shape[:2]
        new_h, new_w = int(h * scale), int(w * scale)
        
        # Resize
        resized = cv2.resize(frame, (new_w, new_h))
        
        # Crop or pad to original size
        if scale > 1:
            # Crop center
            x = (new_w - w) // 2
            y = (new_h - h) // 2
            return resized[y:y+h, x:x+w]
        else:
            # Pad with black
            pad_h = (h - new_h) // 2
            pad_w = (w - new_w) // 2
            padded = np.zeros_like(frame)
            padded[pad_h:pad_h+new_h, pad_w:pad_w+new_w] = resized
            return padded
    
    def add_gaussian_noise(self, frame: np.ndarray) -> np.ndarray:
        """
        Add Gaussian noise
        
        Args:
            frame: Input frame
            
        Returns:
            Noisy frame
        """
        if random.random() < self.config.noise_prob:
            noise = np.random.normal(0, self.config.noise_std * 255, frame.shape)
            noisy = frame.astype(np.float32) + noise
            return np.clip(noisy, 0, 255).astype(np.uint8)
        return frame
    
    def augment_frame(self, 
                     frame: np.ndarray,
                     crop_size: Optional[Tuple[int, int]] = None,
                     training: bool = True) -> np.ndarray:
        """
        Apply augmentations to a single frame
        
        Args:
            frame: Input frame
            crop_size: Target crop size
            training: Whether in training mode
            
        Returns:
            Augmented frame
        """
        if not training:
            # Only center crop during inference
            if crop_size:
                return self.center_crop(frame, crop_size)
            return frame
        
        # Apply augmentations
        frame = frame.copy()
        
        # Geometric augmentations
        if crop_size and random.random() < self.config.random_crop_prob:
            frame = self.random_crop(frame, crop_size)
        elif crop_size:
            frame = self.center_crop(frame, crop_size)
        
        frame = self.random_flip(frame)
        
        # Skip rotation and scale for sign language (can distort signs)
        # frame = self.random_rotation(frame)
        # frame = self.random_scale(frame)
        
        # Color augmentations
        frame = self.adjust_brightness(frame)
        frame = self.adjust_contrast(frame)
        
        # Noise
        frame = self.add_gaussian_noise(frame)
        
        return frame
    
    def augment_sequence(self,
                        frames: List[np.ndarray],
                        crop_size: Optional[Tuple[int, int]] = None,
                        training: bool = True,
                        consistent: bool = True) -> List[np.ndarray]:
        """
        Apply augmentations to video sequence
        
        Args:
            frames: List of frames
            crop_size: Target crop size
            training: Whether in training mode
            consistent: Apply same augmentation to all frames
            
        Returns:
            Augmented frames
        """
        if not training:
            # Only center crop during inference
            if crop_size:
                return [self.center_crop(frame, crop_size) for frame in frames]
            return frames
        
        augmented = []
        
        if consistent:
            # Decide augmentations once for the whole sequence
            do_flip = random.random() < self.config.random_flip_prob
            brightness_factor = random.uniform(*self.config.brightness_range)
            contrast_factor = random.uniform(*self.config.contrast_range)
            
            # For crop, decide position once
            if frames and crop_size and random.random() < self.config.random_crop_prob:
                h, w = frames[0].shape[:2]
                crop_w, crop_h = crop_size
                if w > crop_w and h > crop_h:
                    x = random.randint(0, w - crop_w)
                    y = random.randint(0, h - crop_h)
                else:
                    x = y = 0
            else:
                x = y = None
            
            for frame in frames:
                aug_frame = frame.copy()
                
                # Apply consistent crop
                if x is not None and crop_size:
                    h, w = frame.shape[:2]
                    crop_w, crop_h = crop_size
                    aug_frame = aug_frame[y:y+crop_h, x:x+crop_w]
                elif crop_size:
                    aug_frame = self.center_crop(aug_frame, crop_size)
                
                # Apply consistent flip
                if do_flip:
                    aug_frame = cv2.flip(aug_frame, 1)
                
                # Apply consistent color adjustments
                aug_frame = np.clip(aug_frame * brightness_factor, 0, 255).astype(np.uint8)
                mean = np.mean(aug_frame, axis=(0, 1), keepdims=True)
                aug_frame = np.clip((aug_frame - mean) * contrast_factor + mean, 0, 255).astype(np.uint8)
                
                augmented.append(aug_frame)
        else:
            # Independent augmentation for each frame
            for frame in frames:
                augmented.append(self.augment_frame(frame, crop_size, training))
        
        return augmented


class PoseAwareAugmentation(VideoAugmentation):
    """Pose-aware augmentation that preserves sign language structure"""
    
    def __init__(self, config: Optional[AugmentationConfig] = None):
        super().__init__(config)
        # Reduce augmentation probabilities for sign language
        self.config.random_flip_prob = 0.0  # Don't flip signs
        self.config.rotation_range = (-5, 5)  # Smaller rotations
        self.config.scale_range = (0.95, 1.05)  # Smaller scale changes
    
    def safe_crop_with_hands(self, 
                           frame: np.ndarray,
                           hand_landmarks: Optional[List] = None,
                           crop_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
        """
        Crop frame while keeping hands in view
        
        Args:
            frame: Input frame
            hand_landmarks: Hand landmark positions
            crop_size: Target crop size
            
        Returns:
            Cropped frame
        """
        h, w = frame.shape[:2]
        crop_w, crop_h = crop_size
        
        if not hand_landmarks or w <= crop_w or h <= crop_h:
            return self.center_crop(frame, crop_size)
        
        # Find bounding box of hands
        points = []
        for landmarks in hand_landmarks:
            for point in landmarks:
                if len(point) >= 2:
                    x = int(point[0] * w)
                    y = int(point[1] * h)
                    points.append((x, y))
        
        if not points:
            return self.center_crop(frame, crop_size)
        
        # Calculate bounding box
        xs, ys = zip(*points)
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        # Add padding
        pad = 50
        min_x = max(0, min_x - pad)
        max_x = min(w, max_x + pad)
        min_y = max(0, min_y - pad)
        max_y = min(h, max_y + pad)
        
        # Calculate crop position to include hands
        hand_w = max_x - min_x
        hand_h = max_y - min_y
        
        if hand_w <= crop_w and hand_h <= crop_h:
            # Center crop around hands
            center_x = (min_x + max_x) // 2
            center_y = (min_y + max_y) // 2
            
            x = max(0, min(w - crop_w, center_x - crop_w // 2))
            y = max(0, min(h - crop_h, center_y - crop_h // 2))
            
            return frame[y:y+crop_h, x:x+crop_w]
        else:
            # Resize to fit
            return cv2.resize(frame, crop_size)