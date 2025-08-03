import cv2
import mediapipe as mp
import numpy as np
from typing import List, Dict, Tuple, Optional
import base64
from io import BytesIO
from PIL import Image

class HandDetector:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.translation_engine = None  # Will be set by main app
        
    def decode_base64_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 string to numpy array"""
        img_data = base64.b64decode(base64_string.split(',')[1])
        img = Image.open(BytesIO(img_data))
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    
    def detect_hands(self, image: np.ndarray) -> Dict:
        """Detect hands and extract landmarks"""
        # Send frame to I3D processing if translation engine is available
        if self.translation_engine:
            import asyncio
            try:
                # Process frame asynchronously without blocking
                asyncio.create_task(self.translation_engine.process_video_frame(image))
                # Also process for ensemble if enabled
                asyncio.create_task(self.translation_engine.process_video_frame_ensemble(image))
            except Exception as e:
                # Silently handle errors to not disrupt main flow
                pass
        
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.hands.process(image_rgb)
        
        hand_data = {
            "hands_detected": False,
            "num_hands": 0,
            "landmarks": [],
            "handedness": []
        }
        
        if results.multi_hand_landmarks:
            hand_data["hands_detected"] = True
            hand_data["num_hands"] = len(results.multi_hand_landmarks)
            
            for hand_idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                # Extract normalized landmarks
                landmarks = []
                for landmark in hand_landmarks.landmark:
                    landmarks.append({
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z
                    })
                hand_data["landmarks"].append(landmarks)
                
                # Get handedness (left/right)
                if results.multi_handedness:
                    handedness = results.multi_handedness[hand_idx].classification[0].label
                    hand_data["handedness"].append(handedness)
        
        return hand_data
    
    def extract_features(self, landmarks: List[Dict]) -> np.ndarray:
        """Extract feature vector from hand landmarks"""
        features = []
        
        # Calculate relative positions and angles
        for i, landmark in enumerate(landmarks):
            features.extend([landmark["x"], landmark["y"], landmark["z"]])
            
        # Add relative distances between key points
        # Wrist to fingertips distances
        wrist = landmarks[0]
        for tip_idx in [4, 8, 12, 16, 20]:  # Fingertip indices
            tip = landmarks[tip_idx]
            distance = np.sqrt(
                (tip["x"] - wrist["x"])**2 + 
                (tip["y"] - wrist["y"])**2 + 
                (tip["z"] - wrist["z"])**2
            )
            features.append(distance)
        
        return np.array(features)
    
    def draw_landmarks(self, image: np.ndarray, hand_data: Dict) -> np.ndarray:
        """Draw hand landmarks on image"""
        annotated_image = image.copy()
        
        if hand_data["hands_detected"]:
            for landmarks in hand_data["landmarks"]:
                # Convert normalized coordinates to pixel coordinates
                h, w, _ = image.shape
                for landmark in landmarks:
                    x = int(landmark["x"] * w)
                    y = int(landmark["y"] * h)
                    cv2.circle(annotated_image, (x, y), 5, (0, 255, 0), -1)
        
        return annotated_image
    
    def classify_gesture(self, hand_data: Dict) -> Tuple[str, float]:
        """Classify hand gesture based on landmarks"""
        if not hand_data["hands_detected"] or not hand_data["landmarks"]:
            return "none", 0.0
            
        landmarks = hand_data["landmarks"][0]  # Use first hand
        
        # Simple gesture classification based on finger positions
        # This is a simplified version for demo purposes
        gesture = self._identify_gesture(landmarks)
        confidence = 0.85  # Mock confidence for demo
        
        return gesture, confidence
    
    def _identify_gesture(self, landmarks: List[Dict]) -> str:
        """Identify specific gestures based on landmark positions"""
        # Calculate finger states (extended or folded)
        finger_states = self._get_finger_states(landmarks)
        
        # Map finger states to gestures
        # [thumb, index, middle, ring, pinky]
        if finger_states == [True, True, True, True, True]:
            return "stop"  # All fingers extended
        elif finger_states == [True, False, False, False, False]:
            return "good"  # Thumbs up
        elif finger_states == [False, True, False, False, False]:
            return "where"  # Pointing
        elif finger_states == [False, True, True, False, False]:
            return "no"  # Peace sign (simplified)
        elif finger_states == [True, False, False, False, True]:
            return "i_love_you"  # ILY sign
        else:
            return "hello"  # Default
    
    def _get_finger_states(self, landmarks: List[Dict]) -> List[bool]:
        """Determine if each finger is extended or folded"""
        # Landmark indices for fingertips and bases
        tips = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky tips
        bases = [2, 5, 9, 13, 17]  # Corresponding base joints
        
        finger_states = []
        wrist_y = landmarks[0]["y"]
        
        for tip_idx, base_idx in zip(tips, bases):
            tip_y = landmarks[tip_idx]["y"]
            base_y = landmarks[base_idx]["y"]
            
            # Finger is extended if tip is higher (smaller y) than base
            # For thumb, use x-coordinate as well
            if tip_idx == 4:  # Thumb
                is_extended = abs(landmarks[tip_idx]["x"] - landmarks[base_idx]["x"]) > 0.1
            else:
                is_extended = tip_y < base_y
                
            finger_states.append(is_extended)
        
        return finger_states
    
    def calculate_motion_level(self, current_landmarks: List[Dict], previous_landmarks: Optional[List[Dict]] = None) -> float:
        """Calculate motion level between frames"""
        if previous_landmarks is None or not current_landmarks:
            return 0.0
            
        total_motion = 0.0
        
        for i in range(min(len(current_landmarks), len(previous_landmarks))):
            curr = current_landmarks[i]
            prev = previous_landmarks[i]
            
            motion = np.sqrt(
                (curr["x"] - prev["x"])**2 + 
                (curr["y"] - prev["y"])**2 + 
                (curr["z"] - prev["z"])**2
            )
            total_motion += motion
        
        # Normalize by number of landmarks
        avg_motion = total_motion / len(current_landmarks)
        
        # Scale to 0-1 range (adjust threshold as needed)
        normalized_motion = min(1.0, avg_motion * 10)
        
        return normalized_motion