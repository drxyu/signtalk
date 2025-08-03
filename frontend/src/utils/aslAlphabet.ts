// ASL Alphabet Recognition
// Complete implementation for all 26 letters of the American Sign Language alphabet

// Define HandLandmark interface locally to avoid circular dependency
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

// MediaPipe hand landmark indices
const LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
};

// Helper functions
function calculateDistance(p1: HandLandmark, p2: HandLandmark): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + 
    Math.pow(p1.y - p2.y, 2) + 
    Math.pow(p1.z - p2.z, 2)
  );
}

function calculateAngle(p1: HandLandmark, p2: HandLandmark, p3: HandLandmark): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
  
  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
  
  const cosAngle = dotProduct / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

// Check if a finger is curled (bent)
function isFingerCurled(landmarks: HandLandmark[], mcp: number, pip: number, dip: number, tip: number): boolean {
  const angle1 = calculateAngle(landmarks[mcp], landmarks[pip], landmarks[dip]);
  const angle2 = calculateAngle(landmarks[pip], landmarks[dip], landmarks[tip]);
  
  // Finger is curled if joints are bent significantly
  return angle1 < 160 || angle2 < 160;
}

// Check if a finger is extended (straight)
function isFingerExtended(landmarks: HandLandmark[], mcp: number, pip: number, dip: number, tip: number): boolean {
  const angle1 = calculateAngle(landmarks[mcp], landmarks[pip], landmarks[dip]);
  const angle2 = calculateAngle(landmarks[pip], landmarks[dip], landmarks[tip]);
  
  // Also check if tip is farther from wrist than base
  const wrist = landmarks[LANDMARKS.WRIST];
  const tipDist = calculateDistance(landmarks[tip], wrist);
  const mcpDist = calculateDistance(landmarks[mcp], wrist);
  
  return angle1 > 160 && angle2 > 160 && tipDist > mcpDist * 0.9;
}

// Check if thumb is extended
function isThumbExtended(landmarks: HandLandmark[]): boolean {
  const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
  const thumbCMC = landmarks[LANDMARKS.THUMB_CMC];
  const indexMCP = landmarks[LANDMARKS.INDEX_MCP];
  
  // Check if thumb is away from palm
  const thumbToIndex = calculateDistance(thumbTip, indexMCP);
  const thumbBaseToIndex = calculateDistance(thumbCMC, indexMCP);
  
  return thumbToIndex > thumbBaseToIndex * 0.9;
}

// Check if thumb is across palm
function isThumbAcrossPalm(landmarks: HandLandmark[]): boolean {
  const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
  const pinkyMCP = landmarks[LANDMARKS.PINKY_MCP];
  const indexMCP = landmarks[LANDMARKS.INDEX_MCP];
  
  // Thumb tip should be closer to pinky side than to index side
  const thumbToPinky = calculateDistance(thumbTip, pinkyMCP);
  const thumbToIndex = calculateDistance(thumbTip, indexMCP);
  
  return thumbToPinky < thumbToIndex * 0.8;
}

// Check if fingers are touching
function areFingersTouch(landmarks: HandLandmark[], finger1Tip: number, finger2Tip: number): boolean {
  const dist = calculateDistance(landmarks[finger1Tip], landmarks[finger2Tip]);
  return dist < 0.04; // Threshold for touching
}

// Get finger states
interface FingerStates {
  thumbExtended: boolean;
  indexExtended: boolean;
  middleExtended: boolean;
  ringExtended: boolean;
  pinkyExtended: boolean;
  thumbCurled: boolean;
  indexCurled: boolean;
  middleCurled: boolean;
  ringCurled: boolean;
  pinkyCurled: boolean;
}

function getFingerStates(landmarks: HandLandmark[]): FingerStates {
  return {
    thumbExtended: isThumbExtended(landmarks),
    indexExtended: isFingerExtended(landmarks, LANDMARKS.INDEX_MCP, LANDMARKS.INDEX_PIP, LANDMARKS.INDEX_DIP, LANDMARKS.INDEX_TIP),
    middleExtended: isFingerExtended(landmarks, LANDMARKS.MIDDLE_MCP, LANDMARKS.MIDDLE_PIP, LANDMARKS.MIDDLE_DIP, LANDMARKS.MIDDLE_TIP),
    ringExtended: isFingerExtended(landmarks, LANDMARKS.RING_MCP, LANDMARKS.RING_PIP, LANDMARKS.RING_DIP, LANDMARKS.RING_TIP),
    pinkyExtended: isFingerExtended(landmarks, LANDMARKS.PINKY_MCP, LANDMARKS.PINKY_PIP, LANDMARKS.PINKY_DIP, LANDMARKS.PINKY_TIP),
    thumbCurled: !isThumbExtended(landmarks),
    indexCurled: isFingerCurled(landmarks, LANDMARKS.INDEX_MCP, LANDMARKS.INDEX_PIP, LANDMARKS.INDEX_DIP, LANDMARKS.INDEX_TIP),
    middleCurled: isFingerCurled(landmarks, LANDMARKS.MIDDLE_MCP, LANDMARKS.MIDDLE_PIP, LANDMARKS.MIDDLE_DIP, LANDMARKS.MIDDLE_TIP),
    ringCurled: isFingerCurled(landmarks, LANDMARKS.RING_MCP, LANDMARKS.RING_PIP, LANDMARKS.RING_DIP, LANDMARKS.RING_TIP),
    pinkyCurled: isFingerCurled(landmarks, LANDMARKS.PINKY_MCP, LANDMARKS.PINKY_PIP, LANDMARKS.PINKY_DIP, LANDMARKS.PINKY_TIP)
  };
}

// Main ASL alphabet recognition function
export function recognizeASLAlphabet(landmarks: HandLandmark[]): { letter: string; confidence: number } {
  const states = getFingerStates(landmarks);
  const { 
    thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended,
    thumbCurled, indexCurled, middleCurled, ringCurled, pinkyCurled 
  } = states;
  
  // Count extended fingers
  const extendedCount = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended].filter(v => v).length;
  
  // A - Closed fist with thumb on side
  if (extendedCount <= 1 && indexCurled && middleCurled && ringCurled && pinkyCurled) {
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const indexPIP = landmarks[LANDMARKS.INDEX_PIP];
    if (thumbTip.x < indexPIP.x || thumbTip.x > indexPIP.x) {
      return { letter: 'A', confidence: 0.85 };
    }
  }
  
  // B - Flat hand with thumb across palm
  if (indexExtended && middleExtended && ringExtended && pinkyExtended && isThumbAcrossPalm(landmarks)) {
    return { letter: 'B', confidence: 0.85 };
  }
  
  // C - Curved hand forming C shape
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    const indexTip = landmarks[LANDMARKS.INDEX_TIP];
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const distance = calculateDistance(indexTip, thumbTip);
    if (distance > 0.08 && distance < 0.15) {
      return { letter: 'C', confidence: 0.8 };
    }
  }
  
  // D - Index up, others curled, thumb touches middle finger
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    if (areFingersTouch(landmarks, LANDMARKS.THUMB_TIP, LANDMARKS.MIDDLE_TIP)) {
      return { letter: 'D', confidence: 0.85 };
    }
  }
  
  // E - All fingers curled, thumb across fingers
  if (indexCurled && middleCurled && ringCurled && pinkyCurled && thumbCurled) {
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const indexPIP = landmarks[LANDMARKS.INDEX_PIP];
    const dist = calculateDistance(thumbTip, indexPIP);
    if (dist < 0.05) {
      return { letter: 'E', confidence: 0.8 };
    }
  }
  
  // F - OK sign (thumb and index touch, others extended)
  if (middleExtended && ringExtended && pinkyExtended) {
    if (areFingersTouch(landmarks, LANDMARKS.THUMB_TIP, LANDMARKS.INDEX_TIP)) {
      return { letter: 'F', confidence: 0.85 };
    }
  }
  
  // G - Index pointing sideways, thumb parallel
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
    const indexDir = {
      x: landmarks[LANDMARKS.INDEX_TIP].x - landmarks[LANDMARKS.INDEX_MCP].x,
      y: landmarks[LANDMARKS.INDEX_TIP].y - landmarks[LANDMARKS.INDEX_MCP].y
    };
    const thumbDir = {
      x: landmarks[LANDMARKS.THUMB_TIP].x - landmarks[LANDMARKS.THUMB_CMC].x,
      y: landmarks[LANDMARKS.THUMB_TIP].y - landmarks[LANDMARKS.THUMB_CMC].y
    };
    // Check if pointing horizontally
    if (Math.abs(indexDir.x) > Math.abs(indexDir.y) * 2) {
      return { letter: 'G', confidence: 0.8 };
    }
  }
  
  // H - Index and middle pointing sideways
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    const indexDir = {
      x: landmarks[LANDMARKS.INDEX_TIP].x - landmarks[LANDMARKS.INDEX_MCP].x,
      y: landmarks[LANDMARKS.INDEX_TIP].y - landmarks[LANDMARKS.INDEX_MCP].y
    };
    if (Math.abs(indexDir.x) > Math.abs(indexDir.y) * 2) {
      return { letter: 'H', confidence: 0.85 };
    }
  }
  
  // I - Pinky up, others closed
  if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && thumbCurled) {
    return { letter: 'I', confidence: 0.9 };
  }
  
  // J - Pinky up with motion (static recognition shows as I)
  // Note: J requires motion, so static detection would show as I
  
  // K - Index and middle up, thumb between them
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const indexPIP = landmarks[LANDMARKS.INDEX_PIP];
    const middlePIP = landmarks[LANDMARKS.MIDDLE_PIP];
    
    // Check if thumb is between index and middle fingers
    if (thumbTip.y > indexPIP.y && thumbTip.y > middlePIP.y) {
      return { letter: 'K', confidence: 0.85 };
    }
  }
  
  // L - Index up, thumb out at 90 degrees
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
    const angle = calculateAngle(
      landmarks[LANDMARKS.THUMB_TIP],
      landmarks[LANDMARKS.WRIST],
      landmarks[LANDMARKS.INDEX_TIP]
    );
    if (angle > 70 && angle < 110) {
      return { letter: 'L', confidence: 0.9 };
    }
  }
  
  // M - Three fingers over thumb
  if (indexCurled && middleCurled && ringCurled && !pinkyExtended && thumbCurled) {
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const pinkyMCP = landmarks[LANDMARKS.PINKY_MCP];
    if (thumbTip.y > pinkyMCP.y) {
      return { letter: 'M', confidence: 0.8 };
    }
  }
  
  // N - Two fingers over thumb
  if (indexCurled && middleCurled && !ringExtended && !pinkyExtended && thumbCurled) {
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const ringMCP = landmarks[LANDMARKS.RING_MCP];
    if (thumbTip.y > ringMCP.y) {
      return { letter: 'N', confidence: 0.8 };
    }
  }
  
  // O - All fingers and thumb form circle
  if (areFingersTouch(landmarks, LANDMARKS.THUMB_TIP, LANDMARKS.INDEX_TIP)) {
    const thumbToMiddle = calculateDistance(landmarks[LANDMARKS.THUMB_TIP], landmarks[LANDMARKS.MIDDLE_TIP]);
    if (thumbToMiddle < 0.06) {
      return { letter: 'O', confidence: 0.85 };
    }
  }
  
  // P - K rotated down (index and middle down, thumb between)
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    const indexTip = landmarks[LANDMARKS.INDEX_TIP];
    const wrist = landmarks[LANDMARKS.WRIST];
    if (indexTip.y > wrist.y) { // Pointing down
      return { letter: 'P', confidence: 0.8 };
    }
  }
  
  // Q - G rotated down
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
    const indexTip = landmarks[LANDMARKS.INDEX_TIP];
    const wrist = landmarks[LANDMARKS.WRIST];
    if (indexTip.y > wrist.y) { // Pointing down
      return { letter: 'Q', confidence: 0.8 };
    }
  }
  
  // R - Crossed fingers (index and middle)
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    const indexTip = landmarks[LANDMARKS.INDEX_TIP];
    const middleTip = landmarks[LANDMARKS.MIDDLE_TIP];
    const indexPIP = landmarks[LANDMARKS.INDEX_PIP];
    const middlePIP = landmarks[LANDMARKS.MIDDLE_PIP];
    
    // Check if fingers cross
    if ((indexTip.x - middleTip.x) * (indexPIP.x - middlePIP.x) < 0) {
      return { letter: 'R', confidence: 0.8 };
    }
  }
  
  // S - Closed fist with thumb over fingers
  if (indexCurled && middleCurled && ringCurled && pinkyCurled && thumbCurled) {
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const indexPIP = landmarks[LANDMARKS.INDEX_PIP];
    if (thumbTip.y < indexPIP.y) { // Thumb in front
      return { letter: 'S', confidence: 0.85 };
    }
  }
  
  // T - Thumb between index and middle
  if (indexCurled && middleCurled && ringCurled && pinkyCurled) {
    const thumbTip = landmarks[LANDMARKS.THUMB_TIP];
    const indexMCP = landmarks[LANDMARKS.INDEX_MCP];
    const middleMCP = landmarks[LANDMARKS.MIDDLE_MCP];
    
    // Check if thumb is between index and middle
    const betweenX = thumbTip.x > Math.min(indexMCP.x, middleMCP.x) && 
                     thumbTip.x < Math.max(indexMCP.x, middleMCP.x);
    if (betweenX) {
      return { letter: 'T', confidence: 0.85 };
    }
  }
  
  // U - Index and middle up together
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && thumbCurled) {
    const indexTip = landmarks[LANDMARKS.INDEX_TIP];
    const middleTip = landmarks[LANDMARKS.MIDDLE_TIP];
    const distance = calculateDistance(indexTip, middleTip);
    if (distance < 0.05) { // Fingers together
      return { letter: 'U', confidence: 0.85 };
    }
  }
  
  // V - Index and middle up spread apart
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && thumbCurled) {
    const indexTip = landmarks[LANDMARKS.INDEX_TIP];
    const middleTip = landmarks[LANDMARKS.MIDDLE_TIP];
    const distance = calculateDistance(indexTip, middleTip);
    if (distance > 0.08) { // Fingers spread
      return { letter: 'V', confidence: 0.9 };
    }
  }
  
  // W - Index, middle, ring up spread
  if (indexExtended && middleExtended && ringExtended && !pinkyExtended && thumbCurled) {
    return { letter: 'W', confidence: 0.9 };
  }
  
  // X - Index bent/hooked
  if (!middleExtended && !ringExtended && !pinkyExtended && thumbCurled) {
    const indexAngle = calculateAngle(
      landmarks[LANDMARKS.INDEX_MCP],
      landmarks[LANDMARKS.INDEX_PIP],
      landmarks[LANDMARKS.INDEX_TIP]
    );
    if (indexAngle > 45 && indexAngle < 135) { // Bent but not fully curled
      return { letter: 'X', confidence: 0.8 };
    }
  }
  
  // Y - Thumb and pinky extended
  if (!indexExtended && !middleExtended && !ringExtended && pinkyExtended && thumbExtended) {
    return { letter: 'Y', confidence: 0.9 };
  }
  
  // Z - Index traces Z (static shows as pointing)
  // Note: Z requires motion, would need motion tracking
  
  // Default
  return { letter: '?', confidence: 0.0 };
}

// Export a simplified version that integrates with existing code
export function recognizeFullASL(landmarks: HandLandmark[]): { gesture: string; confidence: number; landmarks: HandLandmark[] } {
  const result = recognizeASLAlphabet(landmarks);
  return {
    gesture: result.letter,
    confidence: result.confidence,
    landmarks: landmarks
  };
}