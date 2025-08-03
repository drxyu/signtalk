import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ThreeHandDisplayProps {
  signName: string;
  className?: string;
}

const ThreeHandDisplay: React.FC<ThreeHandDisplayProps> = ({ signName, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const handMeshRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create simple hand geometry
    const handGroup = new THREE.Group();
    
    // Palm
    const palmGeometry = new THREE.BoxGeometry(2, 2.5, 0.5);
    const skinMaterial = new THREE.MeshPhongMaterial({ color: 0xf4c2a1 });
    const palm = new THREE.Mesh(palmGeometry, skinMaterial);
    handGroup.add(palm);

    // Fingers
    const fingerPositions = [
      { x: -0.75, y: 1.5, z: 0 },  // Index
      { x: -0.25, y: 1.7, z: 0 },  // Middle
      { x: 0.25, y: 1.7, z: 0 },   // Ring
      { x: 0.75, y: 1.5, z: 0 },   // Pinky
    ];

    fingerPositions.forEach((pos) => {
      const fingerGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
      const finger = new THREE.Mesh(fingerGeometry, skinMaterial);
      finger.position.set(pos.x, pos.y, pos.z);
      handGroup.add(finger);
    });

    // Thumb
    const thumbGeometry = new THREE.BoxGeometry(0.4, 1, 0.4);
    const thumb = new THREE.Mesh(thumbGeometry, skinMaterial);
    thumb.position.set(-1.2, 0, 0);
    thumb.rotation.z = Math.PI / 6;
    handGroup.add(thumb);

    scene.add(handGroup);
    handMeshRef.current = handGroup;

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      // Apply animations based on sign
      if (handMeshRef.current) {
        switch (signName.toLowerCase()) {
          case 'hello':
            handMeshRef.current.rotation.z = Math.sin(Date.now() * 0.003) * 0.3;
            break;
          case 'yes':
            handMeshRef.current.position.y = Math.sin(Date.now() * 0.005) * 0.5;
            break;
          case 'no':
            handMeshRef.current.position.x = Math.sin(Date.now() * 0.005) * 0.5;
            break;
          case 'stop':
            handMeshRef.current.rotation.x = -Math.PI / 6;
            break;
          case 'thank you':
            handMeshRef.current.position.z = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            break;
          default:
            handMeshRef.current.rotation.y += 0.01;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  // Update animation when sign changes
  useEffect(() => {
    if (handMeshRef.current) {
      // Reset position and rotation
      handMeshRef.current.position.set(0, 0, 0);
      handMeshRef.current.rotation.set(0, 0, 0);
    }
  }, [signName]);

  return (
    <div className={`three-hand-container ${className}`}>
      <div 
        ref={mountRef} 
        className="three-canvas-mount"
        style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden' }}
      />
      <div className="sign-label text-center mt-4">
        <h3 className="text-2xl font-bold text-white">{signName}</h3>
        <p className="text-gray-400 text-sm mt-1">3D Animated ASL Sign</p>
      </div>
    </div>
  );
};

export default ThreeHandDisplay;