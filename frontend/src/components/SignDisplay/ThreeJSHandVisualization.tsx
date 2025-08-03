import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeJSHandVisualizationProps {
  landmarks: any[] | null;
  width?: number;
  height?: number;
}

const ThreeJSHandVisualization: React.FC<ThreeJSHandVisualizationProps> = ({ 
  landmarks, 
  width = 320, 
  height = 240 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const handMeshRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 5;
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

    // Enhanced Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0x4488ff, 0.6);
    backLight.position.set(-1, -1, -1);
    scene.add(backLight);
    
    // Add rim lighting
    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.3);
    rimLight.position.set(0, 0, -1);
    scene.add(rimLight);

    // Create hand group
    const handGroup = new THREE.Group();
    handMeshRef.current = handGroup;
    scene.add(handGroup);

    // Add grid for visual reference
    const gridHelper = new THREE.GridHelper(10, 10, 0x222222, 0x111111);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -2;
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Gentle rotation for better viewing angle
      if (handMeshRef.current && landmarks) {
        handMeshRef.current.rotation.y += 0.003;
        
        // Add subtle floating motion
        handMeshRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
      }
      
      // Animate lights for dynamic effect
      if (rimLight) {
        rimLight.intensity = 0.3 + Math.sin(Date.now() * 0.002) * 0.1;
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

  // Update hand visualization when landmarks change
  useEffect(() => {
    if (!handMeshRef.current || !landmarks || landmarks.length === 0) {
      // Clear visualization if no landmarks
      if (handMeshRef.current) {
        handMeshRef.current.clear();
      }
      return;
    }

    // Clear previous visualization
    handMeshRef.current.clear();
    
    // Reset rotation when updating
    handMeshRef.current.rotation.y = 0;

    // Create enhanced spheres for each landmark
    const landmarkMeshes: THREE.Mesh[] = [];
    landmarks.forEach((landmark, index) => {
      const geometry = new THREE.SphereGeometry(0.03, 16, 16);
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
        opacity: 0.9
      });
      const sphere = new THREE.Mesh(geometry, material);
      
      // Convert normalized coordinates to 3D space
      sphere.position.x = (landmark.x - 0.5) * 4;
      sphere.position.y = -(landmark.y - 0.5) * 4;
      sphere.position.z = landmark.z * 2;
      
      landmarkMeshes.push(sphere);
      handMeshRef.current!.add(sphere);
    });

    // Create connections between joints with gradient colors
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
      const material = new THREE.LineBasicMaterial({ 
        color: 0x00ff88,
        linewidth: 3,
        opacity: 0.9,
        transparent: true
      });
      const line = new THREE.Line(geometry, material);
      handMeshRef.current!.add(line);
    });

    // Add palm mesh for better visualization
    if (landmarks.length >= 21) {
      const palmIndices = [0, 5, 9, 13, 17];
      const palmGeometry = new THREE.BufferGeometry();
      const palmVertices = new Float32Array(palmIndices.length * 3);
      
      palmIndices.forEach((idx, i) => {
        palmVertices[i * 3] = (landmarks[idx].x - 0.5) * 4;
        palmVertices[i * 3 + 1] = -(landmarks[idx].y - 0.5) * 4;
        palmVertices[i * 3 + 2] = landmarks[idx].z * 2;
      });
      
      palmGeometry.setAttribute('position', new THREE.BufferAttribute(palmVertices, 3));
      palmGeometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]);
      palmGeometry.computeVertexNormals();
      
      const palmMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a2e,
        side: THREE.DoubleSide,
        opacity: 0.3,
        transparent: true
      });
      
      const palmMesh = new THREE.Mesh(palmGeometry, palmMaterial);
      handMeshRef.current!.add(palmMesh);
    }

  }, [landmarks]);

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
        3D View
      </div>
    </div>
  );
};

export default ThreeJSHandVisualization;