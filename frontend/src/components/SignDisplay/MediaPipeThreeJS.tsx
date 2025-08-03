import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const MediaPipeThreeJS: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const handMeshRef = useRef<THREE.Group | null>(null);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker;
    let animationId: number;

    const initThreeJS = () => {
      if (!canvasRef.current) return;

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        canvasRef.current.width / canvasRef.current.height,
        0.1,
        1000
      );
      camera.position.z = 5;
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current,
        antialias: true 
      });
      renderer.setSize(320, 240);
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Create hand representation
      const handGroup = new THREE.Group();
      handMeshRef.current = handGroup;
      scene.add(handGroup);
    };

    const createHandVisualization = (landmarks: any[]) => {
      if (!handMeshRef.current || !sceneRef.current) return;

      // Clear previous visualization
      handMeshRef.current.clear();

      // Create spheres for each landmark
      landmarks.forEach((landmark, index) => {
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
          color: index === 0 ? 0xff0000 : // Wrist - red
                 index % 4 === 0 ? 0x00ff00 : // Base joints - green
                 0x00ffff // Others - cyan
        });
        const sphere = new THREE.Mesh(geometry, material);
        
        // Convert normalized coordinates to 3D space
        sphere.position.x = (landmark.x - 0.5) * 4;
        sphere.position.y = -(landmark.y - 0.5) * 4;
        sphere.position.z = landmark.z * 2;
        
        handMeshRef.current!.add(sphere);
      });

      // Create connections between joints
      const connections = [
        // Thumb
        [0, 1], [1, 2], [2, 3], [3, 4],
        // Index finger
        [0, 5], [5, 6], [6, 7], [7, 8],
        // Middle finger
        [0, 9], [9, 10], [10, 11], [11, 12],
        // Ring finger
        [0, 13], [13, 14], [14, 15], [15, 16],
        // Pinky
        [0, 17], [17, 18], [18, 19], [19, 20],
        // Palm
        [5, 9], [9, 13], [13, 17]
      ];

      connections.forEach(([start, end]) => {
        const points = [
          new THREE.Vector3(
            (landmarks[start].x - 0.5) * 4,
            -(landmarks[start].y - 0.5) * 4,
            landmarks[start].z * 2
          ),
          new THREE.Vector3(
            (landmarks[end].x - 0.5) * 4,
            -(landmarks[end].y - 0.5) * 4,
            landmarks[end].z * 2
          )
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const line = new THREE.Line(geometry, material);
        handMeshRef.current!.add(line);
      });
    };

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
        numHands: 1
      });

      if (videoRef.current) {
        setStatus('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240 } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current!.play();
            setStatus('Camera ready');
          } catch (playError) {
            console.log('Autoplay prevented, waiting for user interaction');
            setStatus('Click to start camera');
            setError('Click anywhere to start camera');
          }
        };
      }
      } catch (err) {
        console.error('MediaPipe init error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize MediaPipe');
        setStatus('Error');
      }
    };

    const detectHands = () => {
      if (!videoRef.current || !handLandmarker || !rendererRef.current || !sceneRef.current || !cameraRef.current || videoRef.current.readyState < 2) {
        animationId = requestAnimationFrame(detectHands);
        return;
      }

      // Check if video has valid dimensions
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        animationId = requestAnimationFrame(detectHands);
        return;
      }

      try {
        const results = handLandmarker.detectForVideo(videoRef.current, performance.now());
        
        if (results.landmarks && results.landmarks.length > 0) {
          createHandVisualization(results.landmarks[0]);
          // Remove test cube if it exists
          const testCube = sceneRef.current.getObjectByName('testCube');
          if (testCube) {
            sceneRef.current.remove(testCube);
          }
        } else {
          // Clear visualization if no hands detected
          if (handMeshRef.current) {
            handMeshRef.current.clear();
          }
          // Add test cube for debugging
          if (!sceneRef.current.getObjectByName('testCube')) {
            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const cube = new THREE.Mesh(geometry, material);
            cube.name = 'testCube';
            sceneRef.current.add(cube);
          }
        }

        // Render the scene
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      } catch (err) {
        console.error('Hand detection error:', err);
      }
      
      animationId = requestAnimationFrame(detectHands);
    };

    // Initialize everything
    initThreeJS();
    initMediaPipe().then(() => {
      detectHands();
    });

    // Handle click to start video if autoplay is blocked
    const handleClick = async () => {
      if (videoRef.current && videoRef.current.paused) {
        try {
          await videoRef.current.play();
          setStatus('Camera ready');
          setError(null);
        } catch (err) {
          console.error('Failed to start video:', err);
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (handLandmarker) {
        handLandmarker.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-2 text-white">Three.js</h3>
      <video 
        ref={videoRef} 
        className="hidden"
        width={320}
        height={240}
        playsInline
        muted
      />
      <canvas 
        ref={canvasRef} 
        width={320} 
        height={240}
        className="border border-gray-600 rounded"
      />
      <div className="mt-2 text-sm">
        <p className="text-gray-400">Status: {status}</p>
        {error && <p className="text-red-400">Error: {error}</p>}
      </div>
    </div>
  );
};

export default MediaPipeThreeJS;