import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';
import { 
  recognizeASLLetter, 
  GestureSequenceAnalyzer
} from '../../utils/signLanguageRecognition';
import type { GestureResult } from '../../utils/signLanguageRecognition';
import { translationService } from '../../utils/translationService';
import ASLAlphabetGuide from '../ASLAlphabetGuide';
import ThreeJSHandVisualization from './ThreeJSHandVisualization';
import ThreeJSFullBodyVisualization from './ThreeJSFullBodyVisualization';

interface TranslationResult {
  gesture: string;
  confidence: number;
  timestamp: number;
  translatedText?: string;
}

const SignLanguageTranslator: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('Initializing...');
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [translationHistory, setTranslationHistory] = useState<TranslationResult[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [currentLandmarks, setCurrentLandmarks] = useState<any[] | null>(null);
  const [currentPoseLandmarks, setCurrentPoseLandmarks] = useState<any[] | null>(null);
  const [detectionActive, setDetectionActive] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const gestureAnalyzer = useRef(new GestureSequenceAnalyzer());

  useEffect(() => {
    let handLandmarker: HandLandmarker;
    let poseLandmarker: PoseLandmarker;
    let animationId: number;
    let lastDetectedGesture = '';

    const initMediaPipe = async () => {
      try {
        setStatus('Loading MediaPipe...');
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });

        try {
          poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1
          });
          
          poseLandmarkerRef.current = poseLandmarker;
        } catch (poseInitErr) {
          console.error('Failed to initialize pose landmarker:', poseInitErr);
          // Continue without pose detection
        }

        if (videoRef.current) {
          setStatus('Requesting camera access...');
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
          });
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus('Ready to translate');
        }
      } catch (err) {
        console.error('MediaPipe init error:', err);
        setStatus('Error: ' + (err instanceof Error ? err.message : 'Failed to initialize'));
      }
    };

    const drawHandAndPose = (handLandmarks: any[], poseLandmarks: any[] | null, ctx: CanvasRenderingContext2D) => {
      // Clear canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Draw pose landmarks first (if available) so hands appear on top
      if (poseLandmarks && poseLandmarks.length > 0) {
        // Draw pose connections
        const poseConnections = [
          [11, 12], [12, 24], [24, 23], [23, 11], // torso
          [12, 14], [14, 16], // right arm
          [11, 13], [13, 15], // left arm
          [24, 26], [26, 28], // right leg
          [23, 25], [25, 27], // left leg
        ];

        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        poseConnections.forEach(([start, end]) => {
          if (poseLandmarks[start] && poseLandmarks[end]) {
            ctx.beginPath();
            ctx.moveTo(poseLandmarks[start].x * ctx.canvas.width, poseLandmarks[start].y * ctx.canvas.height);
            ctx.lineTo(poseLandmarks[end].x * ctx.canvas.width, poseLandmarks[end].y * ctx.canvas.height);
            ctx.stroke();
          }
        });

        // Draw pose landmarks
        poseLandmarks.forEach((landmark, index) => {
          if (index >= 11 && index <= 28) { // Only draw body landmarks
            const x = landmark.x * ctx.canvas.width;
            const y = landmark.y * ctx.canvas.height;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#ff00ff';
            ctx.fill();
          }
        });
      }

      // Draw hand landmarks if available
      if (handLandmarks && handLandmarks.length > 0) {
        handLandmarks.forEach((landmark, index) => {
          const x = landmark.x * ctx.canvas.width;
          const y = landmark.y * ctx.canvas.height;
          
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = index === 0 ? '#ff0000' : 
                         index % 4 === 0 ? '#00ff00' : '#00ffff';
          ctx.fill();
        });

        // Draw hand connections
        const handConnections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [0, 9], [9, 10], [10, 11], [11, 12],
          [0, 13], [13, 14], [14, 15], [15, 16],
          [0, 17], [17, 18], [18, 19], [19, 20],
          [5, 9], [9, 13], [13, 17]
        ];

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        handConnections.forEach(([start, end]) => {
          ctx.beginPath();
          ctx.moveTo(handLandmarks[start].x * ctx.canvas.width, handLandmarks[start].y * ctx.canvas.height);
          ctx.lineTo(handLandmarks[end].x * ctx.canvas.width, handLandmarks[end].y * ctx.canvas.height);
          ctx.stroke();
        });
      }
    };

    const detectAndTranslate = () => {
      if (!videoRef.current || !handLandmarker || !canvasRef.current || 
          videoRef.current.readyState < 2) {
        animationId = requestAnimationFrame(detectAndTranslate);
        return;
      }

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      try {
        const handResults = handLandmarker.detectForVideo(videoRef.current, performance.now());
        
        let poseResults;
        if (poseLandmarker) {
          try {
            poseResults = poseLandmarker.detectForVideo(videoRef.current, performance.now());
          } catch (poseErr) {
            console.error('Pose detection error:', poseErr);
          }
        }
        
        // Store current pose landmarks for drawing
        let currentPose = null;
        if (poseResults && poseResults.landmarks && poseResults.landmarks.length > 0) {
          currentPose = poseResults.landmarks[0];
          setCurrentPoseLandmarks(currentPose);
        } else {
          setCurrentPoseLandmarks(null);
        }

        if (handResults.landmarks && handResults.landmarks.length > 0) {
          const landmarks = handResults.landmarks;
          drawHandAndPose(landmarks[0], currentPose, ctx);
          
          // Update current landmarks for 3D visualization
          setCurrentLandmarks(landmarks);
          
          // Recognize gesture from first hand
          const gestureResult = recognizeASLLetter(landmarks[0]);
          gestureAnalyzer.current.addGesture(gestureResult);
          
          // Check for stable gesture
          const stableGesture = gestureAnalyzer.current.detectStableGesture();
          if (stableGesture) {
            setDetectionActive(true);
            setConfidenceLevel(stableGesture.confidence);
            
            if (stableGesture.gesture !== lastDetectedGesture) {
              lastDetectedGesture = stableGesture.gesture;
              setCurrentGesture(`${stableGesture.gesture} (${Math.round(stableGesture.confidence * 100)}%)`);
              
              if (isRecording && stableGesture.gesture !== 'Unknown') {
                setTranslationHistory(prev => [...prev, {
                  gesture: stableGesture.gesture,
                  confidence: stableGesture.confidence,
                  timestamp: Date.now()
                }]);
              }
            }
          } else {
            setDetectionActive(false);
            setConfidenceLevel(0);
          }
            
          // Always try AI translation if enabled, not just for stable gestures
          if (isTranslating && landmarks) {
            translateLandmarks(landmarks[0]);
          }
        } else {
          // No hands detected, but still draw pose if available
          if (currentPose) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            // Draw pose-only visualization
              drawHandAndPose([], currentPose, ctx);
          } else {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          }
          
          setCurrentLandmarks(null);
          if (lastDetectedGesture !== '') {
            lastDetectedGesture = '';
            setCurrentGesture('No hand detected');
            setDetectionActive(false);
            setConfidenceLevel(0);
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
      
      animationId = requestAnimationFrame(detectAndTranslate);
    };

    // Initialize everything
    initMediaPipe().then(() => {
      detectAndTranslate();
    });

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (handLandmarker) {
        handLandmarker.close();
      }
      if (poseLandmarker) {
        poseLandmarker.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isRecording, isTranslating]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTranslationHistory([]);
    }
  };

  const clearHistory = () => {
    setTranslationHistory([]);
  };

  const getTranslationText = () => {
    return translationHistory.map(t => t.gesture).join(' ');
  };

  const translateLandmarks = async (landmarks: any[]) => {
    try {
      // Convert MediaPipe landmarks to our format
      const formattedLandmarks = landmarks.map(landmark => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z
      }));
      
      const result = await translationService.translateLandmarks(formattedLandmarks);
      
      if (result.output_text) {
        setTranslatedText(result.output_text);
        // Update last item in history with translation
        setTranslationHistory(prev => {
          if (prev.length > 0) {
            const updated = [...prev];
            updated[updated.length - 1].translatedText = result.output_text;
            return updated;
          }
          return prev;
        });
      } else if (result.error) {
        setTranslatedText(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Backend not connected - start server on port 8000');
    }
  };
  
  const translateTextToSign = async (text: string) => {
    try {
      const result = await translationService.translateTextToSign(text);
      console.log('Text to sign result:', result);
      // Handle the sign sequence display
      return result;
    } catch (error) {
      console.error('Text to sign error:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          Sign Language Translator
        </h2>
        <p className="text-gray-400">Real-time ASL recognition with 3D visualization</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video and Canvas Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Camera View */}
            <div className="relative overflow-hidden rounded-lg border-2 border-gray-700 hover:border-cyan-600 transition-all duration-300">
              <video 
                ref={videoRef} 
                className="w-full rounded-lg"
                width={640}
                height={480}
                playsInline
                muted
              />
              <canvas 
                ref={canvasRef} 
                width={640} 
                height={480}
                className="absolute top-0 left-0 w-full h-full"
              />
              <div className="absolute top-2 left-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Camera View
              </div>
              <div className="absolute bottom-2 left-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                {status}
              </div>
              {detectionActive && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-pulse">
                  Detecting...
                </div>
              )}
            </div>
            
            {/* 3D View */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 flex items-center justify-center border-2 border-gray-700 hover:border-purple-600 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20 opacity-50"></div>
              <div className="relative z-10">
                <ThreeJSFullBodyVisualization 
                  handLandmarks={currentLandmarks} 
                  poseLandmarks={currentPoseLandmarks}
                  width={320} 
                  height={240}
                />
              </div>
              <div className="absolute top-2 left-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                3D View
              </div>
            </div>
          </div>
          
          {/* Current Gesture Display - Full Width */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
            <h3 className="text-xl font-semibold mb-3 text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text">Local Recognition</h3>
            <div className="text-3xl font-mono text-cyan-400 flex items-center">
              <span className="mr-4">{currentGesture || 'No gesture detected'}</span>
              {confidenceLevel > 0 && (
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-300"
                      style={{ width: `${confidenceLevel * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">Rule-based detection</p>
          </div>
          
          {/* AI Translation Status - Full Width */}
          {isTranslating && (
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-lg border-2 border-blue-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
              <h3 className="text-xl font-semibold mb-3 text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">AI Recognition</h3>
              <div className="text-2xl text-white">
                {translatedText || (
                  <span className="flex items-center">
                    <span className="animate-pulse mr-2">Processing</span>
                    <span className="flex space-x-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                    </span>
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {translatedText ? 'Advanced landmark analysis (No LLM required)' : 'Ensure backend is running on port 8000'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Controls and History */}
        <div className="space-y-4">

          {/* Recording Controls */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wider">Controls</h3>
            <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleRecording}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/25' 
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/25'
              }`}
            >
              {isRecording ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  Stop
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                  Record
                </span>
              )}
            </button>
            <button
              onClick={() => setIsTranslating(!isTranslating)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                isTranslating 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center">
                {isTranslating ? (
                  <>
                    <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                    AI: ON
                  </>
                ) : (
                  <>AI: OFF</>
                )}
              </span>
            </button>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                showGuide 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {showGuide ? 'Hide Guide' : 'Show Guide'}
            </button>
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded font-semibold"
            >
              Clear
            </button>
            </div>
          </div>

          {/* Translation History */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text">Translation History</h3>
            <div className="min-h-[100px] max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {translationHistory.length > 0 ? (
                <div className="space-y-1">
                  {translationHistory.map((item, index) => (
                    <div 
                      key={index} 
                      className="text-sm p-2 rounded hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <span className="text-cyan-400 font-mono font-semibold">{item.gesture}</span>
                      <span className="text-gray-500 ml-2">
                        ({Math.round(item.confidence * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  {isRecording ? 'Recording...' : 'Click "Start Recording" to begin'}
                </p>
              )}
            </div>
          </div>

          {/* Translation Output */}
          {translationHistory.length > 0 && (
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-4 rounded-lg border border-cyan-600/50">
              <h3 className="text-lg font-semibold mb-2 text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text">Gesture Sequence</h3>
              <p className="text-lg font-mono text-cyan-300 break-words">{getTranslationText()}</p>
            </div>
          )}
          

          {/* Instructions */}
          {!showGuide ? (
            <div className="bg-gray-800 p-4 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">Recognition Capabilities:</h3>
              <div className="space-y-2 text-gray-300">
                <div>
                  <strong>Full ASL Alphabet:</strong> A-Z (all 26 letters)
                </div>
                <div>
                  <strong>Numbers:</strong> 0-5
                </div>
                <div>
                  <strong>Common Gestures:</strong> Thumbs up, Peace sign, Rock on, etc.
                </div>
                <div>
                  <strong>AI Translation:</strong> Convert gesture sequences to natural language
                </div>
              </div>
              <p className="mt-2 text-gray-400">
                Click "Show Guide" to see how to form each letter!
              </p>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* ASL Alphabet Guide */}
      {showGuide && (
        <div className="mt-6">
          <ASLAlphabetGuide />
        </div>
      )}
    </div>
  );
};

export default SignLanguageTranslator;