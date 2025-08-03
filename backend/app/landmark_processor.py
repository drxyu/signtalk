"""
Advanced landmark processing for sign language recognition
Uses statistical analysis and pattern matching instead of LLMs
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from collections import deque
import json

class LandmarkProcessor:
    """Process hand landmarks for better gesture recognition"""
    
    def __init__(self):
        # Landmark indices
        self.WRIST = 0
        self.THUMB_CMC = 1
        self.THUMB_MCP = 2  
        self.THUMB_IP = 3
        self.THUMB_TIP = 4
        self.INDEX_MCP = 5
        self.INDEX_PIP = 6
        self.INDEX_DIP = 7
        self.INDEX_TIP = 8
        self.MIDDLE_MCP = 9
        self.MIDDLE_PIP = 10
        self.MIDDLE_DIP = 11
        self.MIDDLE_TIP = 12
        self.RING_MCP = 13
        self.RING_PIP = 14
        self.RING_DIP = 15
        self.RING_TIP = 16
        self.PINKY_MCP = 17
        self.PINKY_PIP = 18
        self.PINKY_DIP = 19
        self.PINKY_TIP = 20
        
        # Gesture history for temporal analysis
        self.gesture_history = deque(maxlen=30)  # 1 second at 30fps
        
        # Pre-computed ASL patterns
        self.asl_patterns = self._load_asl_patterns()
        
    def _load_asl_patterns(self) -> Dict:
        """Load pre-computed patterns for ASL letters"""
        return {
            'A': {
                'finger_states': [False, False, False, False, False],  # All closed
                'thumb_position': 'side',
                'key_angles': {'thumb_to_index': (30, 90)},
                'key_distances': {}
            },
            'B': {
                'finger_states': [False, True, True, True, True],  # Fingers extended
                'thumb_position': 'across',
                'key_angles': {},
                'key_distances': {'fingers_together': (0, 0.03)}
            },
            'C': {
                'finger_states': [False, False, False, False, False],
                'thumb_position': 'curved',
                'key_angles': {},
                'key_distances': {'thumb_to_fingers': (0.08, 0.15)}
            },
            'D': {
                'finger_states': [False, True, False, False, False],  # Index up
                'thumb_position': 'touching_middle',
                'key_angles': {},
                'key_distances': {'thumb_to_middle': (0, 0.03)}
            },
            'E': {
                'finger_states': [False, False, False, False, False],
                'thumb_position': 'across_fingers',
                'key_angles': {},
                'key_distances': {'thumb_to_fingers': (0, 0.04)}
            },
            'F': {
                'finger_states': [False, False, True, True, True],  # OK sign
                'thumb_position': 'touching_index',
                'key_angles': {},
                'key_distances': {'thumb_to_index': (0, 0.03)}
            },
            'I': {
                'finger_states': [False, False, False, False, True],  # Pinky up
                'thumb_position': 'tucked',
                'key_angles': {},
                'key_distances': {}
            },
            'L': {
                'finger_states': [True, True, False, False, False],  # L shape
                'thumb_position': 'extended',
                'key_angles': {'thumb_to_index': (70, 110)},
                'key_distances': {}
            },
            'O': {
                'finger_states': [False, False, False, False, False],
                'thumb_position': 'circle',
                'key_angles': {},
                'key_distances': {'thumb_to_index': (0, 0.04), 'circle_gap': (0, 0.02)}
            },
            'V': {
                'finger_states': [False, True, True, False, False],  # Peace sign
                'thumb_position': 'tucked',
                'key_angles': {'index_to_middle': (20, 60)},
                'key_distances': {'finger_spread': (0.05, 0.15)}
            },
            'Y': {
                'finger_states': [True, False, False, False, True],  # Hang loose
                'thumb_position': 'extended',
                'key_angles': {},
                'key_distances': {}
            }
        }
    
    def process_landmarks(self, landmarks: List[Dict]) -> Dict[str, any]:
        """Process landmarks and return recognized gesture with confidence"""
        if not landmarks or len(landmarks) != 21:
            return {"gesture": "Unknown", "confidence": 0.0}
        
        # Convert to numpy array for easier processing
        points = np.array([[l['x'], l['y'], l['z']] for l in landmarks])
        
        # Extract features
        finger_states = self._get_finger_states(points)
        thumb_position = self._get_thumb_position(points)
        key_angles = self._calculate_key_angles(points)
        key_distances = self._calculate_key_distances(points)
        
        # Match against patterns
        best_match = None
        best_confidence = 0.0
        
        for letter, pattern in self.asl_patterns.items():
            confidence = self._match_pattern(
                finger_states, thumb_position, key_angles, key_distances,
                pattern
            )
            
            if confidence > best_confidence:
                best_confidence = confidence
                best_match = letter
        
        # Use temporal smoothing
        self.gesture_history.append((best_match, best_confidence))
        smoothed_result = self._temporal_smoothing()
        
        return {
            "gesture": smoothed_result[0] if smoothed_result else "Unknown",
            "confidence": smoothed_result[1] if smoothed_result else 0.0,
            "raw_match": best_match,
            "raw_confidence": best_confidence
        }
    
    def _get_finger_states(self, points: np.ndarray) -> List[bool]:
        """Determine if each finger is extended"""
        states = []
        
        # Thumb (special case)
        thumb_extended = self._is_thumb_extended(points)
        states.append(thumb_extended)
        
        # Other fingers
        finger_tips = [self.INDEX_TIP, self.MIDDLE_TIP, self.RING_TIP, self.PINKY_TIP]
        finger_pips = [self.INDEX_PIP, self.MIDDLE_PIP, self.RING_PIP, self.PINKY_PIP]
        finger_mcps = [self.INDEX_MCP, self.MIDDLE_MCP, self.RING_MCP, self.PINKY_MCP]
        
        for tip, pip, mcp in zip(finger_tips, finger_pips, finger_mcps):
            extended = self._is_finger_extended(points, tip, pip, mcp)
            states.append(extended)
        
        return states
    
    def _is_thumb_extended(self, points: np.ndarray) -> bool:
        """Check if thumb is extended"""
        thumb_tip = points[self.THUMB_TIP]
        thumb_cmc = points[self.THUMB_CMC]
        index_mcp = points[self.INDEX_MCP]
        
        # Distance from tip to index base
        dist_to_index = np.linalg.norm(thumb_tip - index_mcp)
        base_dist = np.linalg.norm(thumb_cmc - index_mcp)
        
        return dist_to_index > base_dist * 0.8
    
    def _is_finger_extended(self, points: np.ndarray, tip: int, pip: int, mcp: int) -> bool:
        """Check if a finger is extended"""
        # Calculate angles
        angle1 = self._calculate_angle(points[mcp], points[pip], points[tip])
        
        # Check vertical position
        tip_y = points[tip][1]
        pip_y = points[pip][1]
        
        # Finger is extended if straight and tip is higher
        return angle1 > 160 and tip_y < pip_y + 0.02
    
    def _get_thumb_position(self, points: np.ndarray) -> str:
        """Determine thumb position relative to hand"""
        thumb_tip = points[self.THUMB_TIP]
        thumb_cmc = points[self.THUMB_CMC]
        index_mcp = points[self.INDEX_MCP]
        middle_mcp = points[self.MIDDLE_MCP]
        pinky_mcp = points[self.PINKY_MCP]
        
        # Check various positions
        if self._is_thumb_across_palm(points):
            return 'across'
        elif self._is_thumb_touching_finger(points, self.INDEX_TIP):
            return 'touching_index'
        elif self._is_thumb_touching_finger(points, self.MIDDLE_TIP):
            return 'touching_middle'
        elif np.linalg.norm(thumb_tip - thumb_cmc) < 0.05:
            return 'tucked'
        else:
            return 'extended'
    
    def _is_thumb_across_palm(self, points: np.ndarray) -> bool:
        """Check if thumb is across the palm"""
        thumb_tip = points[self.THUMB_TIP]
        pinky_mcp = points[self.PINKY_MCP]
        index_mcp = points[self.INDEX_MCP]
        
        thumb_to_pinky = np.linalg.norm(thumb_tip - pinky_mcp)
        thumb_to_index = np.linalg.norm(thumb_tip - index_mcp)
        
        return thumb_to_pinky < thumb_to_index * 0.7
    
    def _is_thumb_touching_finger(self, points: np.ndarray, finger_tip: int) -> bool:
        """Check if thumb is touching a specific finger"""
        distance = np.linalg.norm(points[self.THUMB_TIP] - points[finger_tip])
        return distance < 0.04
    
    def _calculate_angle(self, p1: np.ndarray, p2: np.ndarray, p3: np.ndarray) -> float:
        """Calculate angle between three points"""
        v1 = p1 - p2
        v2 = p3 - p2
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        angle = np.arccos(np.clip(cos_angle, -1, 1))
        
        return np.degrees(angle)
    
    def _calculate_key_angles(self, points: np.ndarray) -> Dict[str, float]:
        """Calculate important angles for gesture recognition"""
        angles = {}
        
        # Thumb to index angle
        angles['thumb_to_index'] = self._calculate_angle(
            points[self.THUMB_TIP],
            points[self.WRIST],
            points[self.INDEX_TIP]
        )
        
        # Index to middle spread
        angles['index_to_middle'] = self._calculate_angle(
            points[self.INDEX_TIP],
            points[self.INDEX_MCP],
            points[self.MIDDLE_TIP]
        )
        
        return angles
    
    def _calculate_key_distances(self, points: np.ndarray) -> Dict[str, float]:
        """Calculate important distances for gesture recognition"""
        distances = {}
        
        # Thumb to index distance
        distances['thumb_to_index'] = np.linalg.norm(
            points[self.THUMB_TIP] - points[self.INDEX_TIP]
        )
        
        # Thumb to middle distance
        distances['thumb_to_middle'] = np.linalg.norm(
            points[self.THUMB_TIP] - points[self.MIDDLE_TIP]
        )
        
        # Finger spread (index to middle)
        distances['finger_spread'] = np.linalg.norm(
            points[self.INDEX_TIP] - points[self.MIDDLE_TIP]
        )
        
        # Fingers together distance
        distances['fingers_together'] = np.mean([
            np.linalg.norm(points[self.INDEX_TIP] - points[self.MIDDLE_TIP]),
            np.linalg.norm(points[self.MIDDLE_TIP] - points[self.RING_TIP]),
            np.linalg.norm(points[self.RING_TIP] - points[self.PINKY_TIP])
        ])
        
        return distances
    
    def _match_pattern(self, finger_states: List[bool], thumb_position: str,
                      key_angles: Dict, key_distances: Dict, pattern: Dict) -> float:
        """Match current hand state against a pattern"""
        confidence = 0.0
        checks = 0
        
        # Check finger states
        if 'finger_states' in pattern:
            expected = pattern['finger_states']
            matches = sum(1 for e, a in zip(expected, finger_states) if e == a)
            confidence += (matches / len(expected)) * 0.4
            checks += 0.4
        
        # Check thumb position
        if 'thumb_position' in pattern:
            if thumb_position == pattern['thumb_position']:
                confidence += 0.3
            checks += 0.3
        
        # Check key angles
        for angle_name, (min_val, max_val) in pattern.get('key_angles', {}).items():
            if angle_name in key_angles:
                if min_val <= key_angles[angle_name] <= max_val:
                    confidence += 0.15
                checks += 0.15
        
        # Check key distances
        for dist_name, (min_val, max_val) in pattern.get('key_distances', {}).items():
            if dist_name in key_distances:
                if min_val <= key_distances[dist_name] <= max_val:
                    confidence += 0.15
                checks += 0.15
        
        # Normalize confidence
        if checks > 0:
            confidence = confidence / checks
        
        return confidence
    
    def _temporal_smoothing(self) -> Optional[Tuple[str, float]]:
        """Apply temporal smoothing to reduce jitter"""
        if len(self.gesture_history) < 5:
            return None
        
        # Count occurrences of each gesture in recent history
        gesture_counts = {}
        confidence_sum = {}
        
        for gesture, confidence in list(self.gesture_history)[-10:]:
            if gesture not in gesture_counts:
                gesture_counts[gesture] = 0
                confidence_sum[gesture] = 0
            gesture_counts[gesture] += 1
            confidence_sum[gesture] += confidence
        
        # Find most common gesture
        if gesture_counts:
            best_gesture = max(gesture_counts, key=gesture_counts.get)
            avg_confidence = confidence_sum[best_gesture] / gesture_counts[best_gesture]
            
            # Only return if it appears frequently enough
            if gesture_counts[best_gesture] >= 3:
                return (best_gesture, avg_confidence)
        
        return None