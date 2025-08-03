import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeJSFullBodyVisualizationProps {
  handLandmarks: any[] | any[][] | null;
  poseLandmarks: any[] | null;
  width?: number;
  height?: number;
}

const ThreeJSFullBodyVisualization: React.FC<ThreeJSFullBodyVisualizationProps> = ({ 
  handLandmarks, 
  poseLandmarks,
  width = 320, 
  height = 240 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const handMeshRef = useRef<THREE.Group | null>(null);
  const bodyMeshRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup - wider view for full body
    const camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 8;
    camera.position.y = 0.5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Enhanced Lighting for full body
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 2, 2);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    backLight.position.set(-2, -2, -2);
    scene.add(backLight);
    
    // Add rim lighting
    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.3);
    rimLight.position.set(0, 0, -2);
    scene.add(rimLight);

    // Create hand group
    const handGroup = new THREE.Group();
    handMeshRef.current = handGroup;
    scene.add(handGroup);

    // Create body group
    const bodyGroup = new THREE.Group();
    bodyMeshRef.current = bodyGroup;
    scene.add(bodyGroup);

    // Add grid for visual reference
    const gridHelper = new THREE.GridHelper(20, 20, 0x222222, 0x111111);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -4;
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Gentle rotation for better viewing angle
      if (scene) {
        scene.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
    };
  }, [width, height]);

  // Update body visualization when pose landmarks change
  useEffect(() => {
    if (!bodyMeshRef.current || !poseLandmarks || poseLandmarks.length === 0) {
      if (bodyMeshRef.current) {
        bodyMeshRef.current.clear();
      }
      return;
    }

    // Clear previous visualization
    bodyMeshRef.current.clear();

    // Key body landmarks for MediaPipe Pose
    const bodyPoints = {
      nose: 0,
      leftShoulder: 11,
      rightShoulder: 12,
      leftElbow: 13,
      rightElbow: 14,
      leftWrist: 15,
      rightWrist: 16,
      leftHip: 23,
      rightHip: 24,
      leftKnee: 25,
      rightKnee: 26,
      leftAnkle: 27,
      rightAnkle: 28
    };

    // Draw ALL pose landmarks (0-32 for MediaPipe Pose)
    poseLandmarks.forEach((landmark, index) => {
      const geometry = new THREE.SphereGeometry(0.08, 16, 16);
      
      // Color coding for different body parts
      let color = 0x00ff00; // Default green
      
      // Face landmarks (0-10)
      if (index <= 10) {
        color = 0xff00ff; // Magenta for face
      }
      // Upper body (11-16)
      else if (index >= 11 && index <= 16) {
        color = 0x00aaff; // Light blue for arms/shoulders
      }
      // Hands (17-22)
      else if (index >= 17 && index <= 22) {
        color = 0xffaa00; // Orange for hands
      }
      // Lower body (23-32)
      else if (index >= 23 && index <= 32) {
        color = 0x00ff88; // Cyan for legs
      }
      
      const material = new THREE.MeshPhongMaterial({ 
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        shininess: 100
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      
      // Convert normalized coordinates to 3D space
      sphere.position.x = (landmark.x - 0.5) * 6;
      sphere.position.y = -(landmark.y - 0.5) * 6 + 1;
      sphere.position.z = landmark.z * 2;
      
      bodyMeshRef.current!.add(sphere);
    });


    // Body connections
    const bodyConnections = [
      // Torso
      [bodyPoints.leftShoulder, bodyPoints.rightShoulder],
      [bodyPoints.leftShoulder, bodyPoints.leftHip],
      [bodyPoints.rightShoulder, bodyPoints.rightHip],
      [bodyPoints.leftHip, bodyPoints.rightHip],
      // Left arm
      [bodyPoints.leftShoulder, bodyPoints.leftElbow],
      [bodyPoints.leftElbow, bodyPoints.leftWrist],
      // Right arm
      [bodyPoints.rightShoulder, bodyPoints.rightElbow],
      [bodyPoints.rightElbow, bodyPoints.rightWrist],
      // Left leg
      [bodyPoints.leftHip, bodyPoints.leftKnee],
      [bodyPoints.leftKnee, bodyPoints.leftAnkle],
      // Right leg
      [bodyPoints.rightHip, bodyPoints.rightKnee],
      [bodyPoints.rightKnee, bodyPoints.rightAnkle],
      // Head to shoulders
      [bodyPoints.nose, bodyPoints.leftShoulder],
      [bodyPoints.nose, bodyPoints.rightShoulder]
    ];

    // Draw body connections
    bodyConnections.forEach(([start, end]) => {
      if (poseLandmarks[start] && poseLandmarks[end]) {
        const points = [
          new THREE.Vector3(
            (poseLandmarks[start].x - 0.5) * 6,
            -(poseLandmarks[start].y - 0.5) * 6 + 1,
            poseLandmarks[start].z * 2
          ),
          new THREE.Vector3(
            (poseLandmarks[end].x - 0.5) * 6,
            -(poseLandmarks[end].y - 0.5) * 6 + 1,
            poseLandmarks[end].z * 2
          )
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: 0x00ff88,
          linewidth: 5,
          opacity: 1.0,
          transparent: false
        });
        const line = new THREE.Line(geometry, material);
        bodyMeshRef.current!.add(line);
      }
    });

  }, [poseLandmarks]);

  // Update hand visualization when landmarks change
  useEffect(() => {
    if (!handMeshRef.current || !handLandmarks) {
      if (handMeshRef.current) {
        handMeshRef.current.clear();
      }
      return;
    }

    // Clear previous visualization
    handMeshRef.current.clear();

    // Handle both single hand array and array of hands
    const handsToRender = Array.isArray(handLandmarks[0]) ? handLandmarks : [handLandmarks];
    
    handsToRender.forEach((handData, handIndex) => {
      if (!handData || handData.length === 0) return;
      
      // Create enhanced hand visualization
      const landmarkMeshes: THREE.Mesh[] = [];
      handData.forEach((landmark, index) => {
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
          color: index === 0 ? 0xff0000 :      // Wrist - red
                 index % 4 === 0 ? 0x00ff00 :  // Base joints - green  
                 index === 4 || index === 8 || index === 12 || index === 16 || index === 20 ? 0xffff00 : // Tips - yellow
                 0x00ffff,                      // Others - cyan
          emissive: index === 0 ? 0x440000 :
                    index % 4 === 0 ? 0x004400 :
                    index === 4 || index === 8 || index === 12 || index === 16 || index === 20 ? 0x444400 :
                    0x004444,
          emissiveIntensity: 0.4,
          shininess: 100,
          transparent: true,
          opacity: 0.95
        });
        const sphere = new THREE.Mesh(geometry, material);
        
        // Position hand relative to wrist if pose is available
        let handOffset = new THREE.Vector3(0, 0, 0);
        if (poseLandmarks) {
          // Use different wrist for each hand
          const wristIndex = handIndex === 0 ? 16 : 15; // Left wrist : Right wrist
          if (poseLandmarks[wristIndex]) {
            handOffset.x = (poseLandmarks[wristIndex].x - 0.5) * 6;
            handOffset.y = -(poseLandmarks[wristIndex].y - 0.5) * 6 + 1;
            handOffset.z = poseLandmarks[wristIndex].z * 2;
          }
        }
        
        // Convert normalized coordinates to 3D space
        // Offset hands slightly if multiple hands
        const handSpacing = handIndex === 0 ? -0.5 : 0.5;
        sphere.position.x = handOffset.x + (landmark.x - 0.5) * 2 + (handsToRender.length > 1 ? handSpacing : 0);
        sphere.position.y = handOffset.y + -(landmark.y - 0.5) * 2;
        sphere.position.z = handOffset.z + landmark.z;
        
        landmarkMeshes.push(sphere);
        handMeshRef.current!.add(sphere);
      });

      // Hand connections
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
        // Palm connections
        [5, 9], [9, 13], [13, 17]
      ];

      connections.forEach(([start, end]) => {
        const points = [
          landmarkMeshes[start].position.clone(),
          landmarkMeshes[end].position.clone()
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: 0xffff00,
          linewidth: 2,
          opacity: 0.9,
          transparent: true
        });
        const line = new THREE.Line(geometry, material);
        handMeshRef.current!.add(line);
      });
    });

  }, [handLandmarks, poseLandmarks]);

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="rounded-lg shadow-lg"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="absolute top-2 left-2 text-xs text-gray-400 bg-black bg-opacity-50 px-2 py-1 rounded">
        Full Body 3D View
      </div>
      <div className="absolute top-2 right-2 text-xs text-gray-400 bg-black bg-opacity-50 px-2 py-1 rounded">
        {poseLandmarks ? '👤 Body' : ''} {handLandmarks ? '✋ Hand' : ''}
      </div>
    </div>
  );
};

export default ThreeJSFullBodyVisualization;