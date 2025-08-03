import React, { useRef, useEffect, useState } from 'react';

interface VideoSignDisplayProps {
  signName: string;
  className?: string;
}

// Mapping of sign names to video files
const signVideoMap: Record<string, string> = {
  'hello': '/videos/asl-signs/hello.mp4',
  'thank you': '/videos/asl-signs/thank-you.mp4',
  'yes': '/videos/asl-signs/yes.mp4',
  'no': '/videos/asl-signs/no.mp4',
  'please': '/videos/asl-signs/please.mp4',
  'stop': '/videos/asl-signs/stop.mp4',
  'good': '/videos/asl-signs/good.mp4',
  'bad': '/videos/asl-signs/bad.mp4',
  'help': '/videos/asl-signs/help.mp4',
  'what': '/videos/asl-signs/what.mp4',
};

const VideoSignDisplay: React.FC<VideoSignDisplayProps> = ({ signName, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const videoPath = signVideoMap[signName.toLowerCase()] || null;

  useEffect(() => {
    if (videoRef.current && videoPath) {
      setIsLoading(true);
      setHasError(false);
      
      // Reset and play video when sign changes
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        setHasError(true);
      });
    }
  }, [signName, videoPath]);

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (!videoPath || hasError) {
    // Fallback to placeholder
    return (
      <div className={`flex items-center justify-center bg-gray-800 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🎥</div>
          <p className="text-2xl font-bold text-white mb-2">Sign: {signName}</p>
          <p className="text-gray-400">Video not available</p>
          <p className="text-sm text-gray-500 mt-2">
            Record a video demonstrating this sign and save as:<br/>
            <code className="bg-gray-700 px-2 py-1 rounded text-xs">
              {signVideoMap[signName.toLowerCase()] || `/videos/asl-signs/${signName.toLowerCase().replace(' ', '-')}.mp4`}
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`video-sign-container ${className}`}>
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          loop
          muted
          playsInline
          onLoadedData={handleLoadedData}
          onError={handleError}
          style={{ maxHeight: '400px' }}
        >
          <source src={videoPath} type="video/mp4" />
          <source src={videoPath.replace('.mp4', '.webm')} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </div>
      
      <div className="sign-label text-center mt-4">
        <h3 className="text-2xl font-bold text-white">{signName}</h3>
        <p className="text-gray-400 text-sm mt-1">ASL Sign Video</p>
        <div className="mt-2 space-x-2">
          <button
            onClick={() => videoRef.current?.play()}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
          >
            Play
          </button>
          <button
            onClick={() => videoRef.current?.pause()}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
          >
            Pause
          </button>
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
              }
            }}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
          >
            Restart
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoSignDisplay;