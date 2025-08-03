import React, { useRef, useEffect } from 'react'

interface CameraFeedProps {
  videoStream: MediaStream | null
  isActive: boolean
}

const CameraFeed: React.FC<CameraFeedProps> = ({ videoStream, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream
    }
  }, [videoStream])

  if (!isActive || !videoStream) {
    return (
      <div className="absolute bottom-4 right-4 w-32 h-24 bg-black/50 rounded-lg border-2 border-purple-500/50 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
          Camera Off
        </div>
      </div>
    )
  }

  return (
    <div className="absolute bottom-4 right-4 w-32 h-24 bg-black rounded-lg border-2 border-purple-500 overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover mirror"
        style={{ transform: 'scaleX(-1)' }} // Mirror the video
      />
      <div className="absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    </div>
  )
}

export default CameraFeed