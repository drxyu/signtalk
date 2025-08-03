// Sign Language Recognition Utilities
// This module processes MediaPipe hand landmarks to recognize ASL gestures

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureResult {
  gesture: string;
  confidence: number;
  landmarks: HandLandmark[];
}

// MediaPipe hand landmark indices
const LANDMARK_INDICES = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20
};

// Calculate distance between two landmarks
function calculateDistance(p1: HandLandmark, p2: HandLandmark): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + 
    Math.pow(p1.y - p2.y, 2) + 
    Math.pow(p1.z - p2.z, 2)
  );
}

// Calculate angle between three points
function calculateAngle(p1: HandLandmark, p2: HandLandmark, p3: HandLandmark): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
  
  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
  
  const cosAngle = dotProduct / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

// Check if a finger is extended
function isFingerExtended(landmarks: HandLandmark[], fingerBase: number, fingerTip: number): boolean {
  const wrist = landmarks[LANDMARK_INDICES.WRIST];
  const base = landmarks[fingerBase];
  const tip = landmarks[fingerTip];
  
  // For thumb, use different logic
  if (fingerBase === LANDMARK_INDICES.THUMB_CMC) {
    const thumbMCP = landmarks[LANDMARK_INDICES.THUMB_MCP];
    const thumbIP = landmarks[LANDMARK_INDICES.THUMB_IP];
    
    // Check if thumb is away from palm
    const indexMCP = landmarks[LANDMARK_INDICES.INDEX_MCP];
    const thumbToIndex = calculateDistance(tip, indexMCP);
    const thumbBaseToIndex = calculateDistance(base, indexMCP);
    
    return thumbToIndex > thumbBaseToIndex * 0.8;
  }
  
  // For other fingers, check if tip is higher than base (smaller y value)
  // and farther from wrist
  const baseToWristDist = calculateDistance(base, wrist);
  const tipToWristDist = calculateDistance(tip, wrist);
  
  // Also check vertical position
  const isHigher = tip.y < base.y + 0.02; // Small tolerance
  const isFarther = tipToWristDist > baseToWristDist * 1.1; // Reduced threshold
  
  return isHigher || isFarther;
}

// Count extended fingers
function countExtendedFingers(landmarks: HandLandmark[]): number {
  let count = 0;
  
  // Check thumb
  if (isFingerExtended(landmarks, LANDMARK_INDICES.THUMB_CMC, LANDMARK_INDICES.THUMB_TIP)) {
    count++;
  }
  
  // Check other fingers
  const fingerPairs = [
    [LANDMARK_INDICES.INDEX_MCP, LANDMARK_INDICES.INDEX_TIP],
    [LANDMARK_INDICES.MIDDLE_MCP, LANDMARK_INDICES.MIDDLE_TIP],
    [LANDMARK_INDICES.RING_MCP, LANDMARK_INDICES.RING_TIP],
    [LANDMARK_INDICES.PINKY_MCP, LANDMARK_INDICES.PINKY_TIP]
  ];
  
  for (const [base, tip] of fingerPairs) {
    if (isFingerExtended(landmarks, base, tip)) {
      count++;
    }
  }
  
  return count;
}

// Recognize basic ASL letters and numbers
export function recognizeGesture(landmarks: HandLandmark[]): GestureResult {
  const extendedCount = countExtendedFingers(landmarks);
  
  // Basic number recognition (0-5)
  if (extendedCount === 0) {
    // Check if it's 'A' (fist with thumb on side) or '0'
    const thumbAngle = calculateAngle(
      landmarks[LANDMARK_INDICES.THUMB_TIP],
      landmarks[LANDMARK_INDICES.THUMB_CMC],
      landmarks[LANDMARK_INDICES.INDEX_MCP]
    );
    
    if (thumbAngle < 60) {
      return { gesture: 'A', confidence: 0.8, landmarks };
    } else {
      return { gesture: '0', confidence: 0.8, landmarks };
    }
  } else if (extendedCount === 1) {
    // Check which finger is extended
    if (isFingerExtended(landmarks, LANDMARK_INDICES.INDEX_MCP, LANDMARK_INDICES.INDEX_TIP)) {
      return { gesture: '1', confidence: 0.9, landmarks };
    } else if (isFingerExtended(landmarks, LANDMARK_INDICES.THUMB_CMC, LANDMARK_INDICES.THUMB_TIP)) {
      return { gesture: 'Thumbs up', confidence: 0.8, landmarks };
    }
  } else if (extendedCount === 2) {
    // Check for 'V' or '2'
    const indexExtended = isFingerExtended(landmarks, LANDMARK_INDICES.INDEX_MCP, LANDMARK_INDICES.INDEX_TIP);
    const middleExtended = isFingerExtended(landmarks, LANDMARK_INDICES.MIDDLE_MCP, LANDMARK_INDICES.MIDDLE_TIP);
    
    if (indexExtended && middleExtended) {
      return { gesture: '2/V', confidence: 0.9, landmarks };
    }
  } else if (extendedCount === 3) {
    // Check for '3' or 'W'
    const indexExtended = isFingerExtended(landmarks, LANDMARK_INDICES.INDEX_MCP, LANDMARK_INDICES.INDEX_TIP);
    const middleExtended = isFingerExtended(landmarks, LANDMARK_INDICES.MIDDLE_MCP, LANDMARK_INDICES.MIDDLE_TIP);
    const ringExtended = isFingerExtended(landmarks, LANDMARK_INDICES.RING_MCP, LANDMARK_INDICES.RING_TIP);
    
    if (indexExtended && middleExtended && ringExtended) {
      return { gesture: '3/W', confidence: 0.85, landmarks };
    }
  } else if (extendedCount === 4) {
    return { gesture: '4', confidence: 0.9, landmarks };
  } else if (extendedCount === 5) {
    return { gesture: '5/Open hand', confidence: 0.95, landmarks };
  }
  
  return { gesture: 'Unknown', confidence: 0, landmarks };
}

// Import will be added after the exports at the bottom to avoid circular dependency

// Import the function at the top level to avoid issues
let recognizeFullASL: any = null;
import('./aslAlphabet').then(module => {
  recognizeFullASL = module.recognizeFullASL;
});

// Advanced gesture recognition for ASL letters
export function recognizeASLLetter(landmarks: HandLandmark[]): GestureResult {
  // First try the full ASL alphabet recognizer if loaded
  if (recognizeFullASL) {
    const fullASLResult = recognizeFullASL(landmarks);
    if (fullASLResult.confidence > 0.7) {
      return fullASLResult;
    }
  }
  // Get finger states
  const fingerStates = {
    thumb: isFingerExtended(landmarks, LANDMARK_INDICES.THUMB_CMC, LANDMARK_INDICES.THUMB_TIP),
    index: isFingerExtended(landmarks, LANDMARK_INDICES.INDEX_MCP, LANDMARK_INDICES.INDEX_TIP),
    middle: isFingerExtended(landmarks, LANDMARK_INDICES.MIDDLE_MCP, LANDMARK_INDICES.MIDDLE_TIP),
    ring: isFingerExtended(landmarks, LANDMARK_INDICES.RING_MCP, LANDMARK_INDICES.RING_TIP),
    pinky: isFingerExtended(landmarks, LANDMARK_INDICES.PINKY_MCP, LANDMARK_INDICES.PINKY_TIP)
  };
  
  const extendedCount = Object.values(fingerStates).filter(v => v).length;
  
  // Check for specific letter patterns
  
  // 'A' - closed fist with thumb on side
  if (extendedCount === 0 || (extendedCount === 1 && fingerStates.thumb)) {
    const thumbPos = landmarks[LANDMARK_INDICES.THUMB_TIP];
    const indexBase = landmarks[LANDMARK_INDICES.INDEX_MCP];
    if (thumbPos.x < indexBase.x + 0.1) { // Thumb is on the side
      return { gesture: 'A', confidence: 0.85, landmarks };
    }
  }
  
  // 'B' - flat hand with thumb across palm
  if (fingerStates.index && fingerStates.middle && fingerStates.ring && fingerStates.pinky && !fingerStates.thumb) {
    return { gesture: 'B', confidence: 0.8, landmarks };
  }
  
  // 'C' - curved hand
  if (extendedCount === 0) {
    const indexTip = landmarks[LANDMARK_INDICES.INDEX_TIP];
    const pinkyTip = landmarks[LANDMARK_INDICES.PINKY_TIP];
    const distance = calculateDistance(indexTip, pinkyTip);
    if (distance > 0.15) { // Fingers are curved, not closed
      return { gesture: 'C', confidence: 0.75, landmarks };
    }
  }
  
  // 'D' - index up, others closed, thumb touches middle
  if (fingerStates.index && !fingerStates.middle && !fingerStates.ring && !fingerStates.pinky) {
    const thumbTip = landmarks[LANDMARK_INDICES.THUMB_TIP];
    const middleMCP = landmarks[LANDMARK_INDICES.MIDDLE_MCP];
    const distance = calculateDistance(thumbTip, middleMCP);
    if (distance < 0.05) {
      return { gesture: 'D', confidence: 0.85, landmarks };
    }
  }
  
  // 'I' - pinky up only
  if (!fingerStates.thumb && !fingerStates.index && !fingerStates.middle && !fingerStates.ring && fingerStates.pinky) {
    return { gesture: 'I', confidence: 0.9, landmarks };
  }
  
  // 'L' - thumb and index extended at 90 degrees
  if (fingerStates.thumb && fingerStates.index && !fingerStates.middle && !fingerStates.ring && !fingerStates.pinky) {
    const angle = calculateAngle(
      landmarks[LANDMARK_INDICES.THUMB_TIP],
      landmarks[LANDMARK_INDICES.WRIST],
      landmarks[LANDMARK_INDICES.INDEX_TIP]
    );
    if (angle > 70 && angle < 110) {
      return { gesture: 'L', confidence: 0.85, landmarks };
    }
  }
  
  // 'O' - fingers and thumb make circle
  if (!fingerStates.index && !fingerStates.middle && !fingerStates.ring && !fingerStates.pinky) {
    const thumbTip = landmarks[LANDMARK_INDICES.THUMB_TIP];
    const indexTip = landmarks[LANDMARK_INDICES.INDEX_TIP];
    const distance = calculateDistance(thumbTip, indexTip);
    if (distance < 0.03) { // Tips are touching
      return { gesture: 'O', confidence: 0.8, landmarks };
    }
  }
  
  // 'Y' - thumb and pinky extended
  if (fingerStates.thumb && !fingerStates.index && !fingerStates.middle && !fingerStates.ring && fingerStates.pinky) {
    return { gesture: 'Y', confidence: 0.85, landmarks };
  }
  
  // 'W' - index, middle, ring up
  if (!fingerStates.thumb && fingerStates.index && fingerStates.middle && fingerStates.ring && !fingerStates.pinky) {
    return { gesture: 'W', confidence: 0.85, landmarks };
  }
  
  // Peace sign / V
  if (fingerStates.index && fingerStates.middle && !fingerStates.ring && !fingerStates.pinky) {
    return { gesture: 'Peace/V', confidence: 0.9, landmarks };
  }
  
  // Rock on / horns
  if (fingerStates.index && fingerStates.pinky && !fingerStates.middle && !fingerStates.ring) {
    return { gesture: 'Rock on', confidence: 0.85, landmarks };
  }
  
  // Thumbs up
  if (fingerStates.thumb && !fingerStates.index && !fingerStates.middle && !fingerStates.ring && !fingerStates.pinky) {
    return { gesture: 'Thumbs up', confidence: 0.9, landmarks };
  }
  
  // Numbers
  if (extendedCount === 1 && fingerStates.index) {
    return { gesture: '1', confidence: 0.95, landmarks };
  } else if (extendedCount === 2 && fingerStates.index && fingerStates.middle) {
    return { gesture: '2', confidence: 0.95, landmarks };
  } else if (extendedCount === 3 && fingerStates.index && fingerStates.middle && fingerStates.ring) {
    return { gesture: '3', confidence: 0.95, landmarks };
  } else if (extendedCount === 4 && !fingerStates.thumb) {
    return { gesture: '4', confidence: 0.9, landmarks };
  } else if (extendedCount === 5) {
    return { gesture: '5/Open hand', confidence: 0.95, landmarks };
  } else if (extendedCount === 0) {
    return { gesture: '0/Fist', confidence: 0.85, landmarks };
  }
  
  // Default to basic gesture recognition
  return { gesture: 'Unknown', confidence: 0.3, landmarks };
}

// Gesture sequence analyzer for words
export class GestureSequenceAnalyzer {
  private gestureBuffer: GestureResult[] = [];
  private readonly bufferSize = 30; // ~1 second at 30fps
  private readonly minGestureDuration = 10; // frames
  
  addGesture(gesture: GestureResult): void {
    this.gestureBuffer.push(gesture);
    if (this.gestureBuffer.length > this.bufferSize) {
      this.gestureBuffer.shift();
    }
  }
  
  detectStableGesture(): GestureResult | null {
    if (this.gestureBuffer.length < this.minGestureDuration) {
      return null;
    }
    
    // Check if the last N frames have the same gesture
    const recentGestures = this.gestureBuffer.slice(-this.minGestureDuration);
    const firstGesture = recentGestures[0].gesture;
    
    if (firstGesture === 'Unknown') {
      return null;
    }
    
    const isStable = recentGestures.every(g => g.gesture === firstGesture);
    
    if (isStable) {
      // Calculate average confidence
      const avgConfidence = recentGestures.reduce((sum, g) => sum + g.confidence, 0) / recentGestures.length;
      return {
        gesture: firstGesture,
        confidence: avgConfidence,
        landmarks: recentGestures[recentGestures.length - 1].landmarks
      };
    }
    
    return null;
  }
  
  clear(): void {
    this.gestureBuffer = [];
  }
}

// Dictionary of common ASL words (simplified)
export const ASL_WORD_DICTIONARY: Record<string, string[]> = {
  'HELLO': ['5/Open hand', 'wave'], // Open hand with waving motion
  'THANK YOU': ['5/Open hand', 'forward'], // Open hand moving from chin forward
  'YES': ['A', 'nod'], // Fist with nodding motion
  'NO': ['2/V', 'tap'], // Two fingers tapping with thumb
  'PLEASE': ['5/Open hand', 'circle'], // Open hand circular motion on chest
};

// Export types for use in components
export type { HandLandmark, GestureResult };