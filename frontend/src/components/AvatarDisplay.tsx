import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment, Box } from '@react-three/drei'
import * as THREE from 'three'
import CameraFeed from './CameraFeed'

interface AvatarDisplayProps {
  currentAnimation: string
  isLoading: boolean
  videoStream?: MediaStream | null
  isCameraActive?: boolean
}

// Placeholder 3D component for demo
const Avatar: React.FC<{ animation: string }> = ({ animation }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })
  
  return (
    <group>
      {/* Placeholder avatar - in real implementation, load GLB model here */}
      <Box ref={meshRef} args={[2, 3, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#9333ea" />
      </Box>
      
      {/* Hands placeholder */}
      <Box args={[0.5, 0.5, 0.5]} position={[-1, 0, 1]}>
        <meshStandardMaterial color="#a855f7" />
      </Box>
      <Box args={[0.5, 0.5, 0.5]} position={[1, 0, 1]}>
        <meshStandardMaterial color="#a855f7" />
      </Box>
    </group>
  )
}

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ currentAnimation, isLoading, videoStream, isCameraActive = false }) => {
  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-black/30 backdrop-blur-sm">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading avatar...</p>
          </div>
        </div>
      ) : (
        <>
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
              <pointLight position={[-10, -10, -10]} />
              <Avatar animation={currentAnimation} />
              <OrbitControls 
                enablePan={false} 
                enableZoom={false}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 3}
              />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
          
          {/* Animation label */}
          {currentAnimation !== 'idle' && (
            <div className="absolute top-4 left-4 bg-purple-600/80 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">Gesture: {currentAnimation}</p>
            </div>
          )}
          
          {/* Mini camera feed */}
          <CameraFeed videoStream={videoStream} isActive={isCameraActive} />
        </>
      )}
    </div>
  )
}

export default AvatarDisplay