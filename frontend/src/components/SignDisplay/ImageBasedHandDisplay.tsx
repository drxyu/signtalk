import React, { useState, useEffect } from 'react';

interface ImageBasedHandDisplayProps {
  signName: string;
  className?: string;
}

// Map signs to their image sequences
// In production, these would be actual downloaded ASL images
const signImageSequences: Record<string, string[]> = {
  'hello': [
    '/images/asl-signs/hello/position1.png',
    '/images/asl-signs/hello/position2.png',
    '/images/asl-signs/hello/position3.png',
    '/images/asl-signs/hello/position4.png',
  ],
  'yes': [
    '/images/asl-signs/yes/fist-neutral.png',
    '/images/asl-signs/yes/fist-down.png',
    '/images/asl-signs/yes/fist-neutral.png',
  ],
  'no': [
    '/images/asl-signs/no/fingers-together.png',
    '/images/asl-signs/no/fingers-tap1.png',
    '/images/asl-signs/no/fingers-tap2.png',
  ],
  'thank you': [
    '/images/asl-signs/thankyou/chin-touch.png',
    '/images/asl-signs/thankyou/move-forward.png',
    '/images/asl-signs/thankyou/extended.png',
  ],
  'please': [
    '/images/asl-signs/please/chest1.png',
    '/images/asl-signs/please/chest2.png',
    '/images/asl-signs/please/chest3.png',
    '/images/asl-signs/please/chest4.png',
  ],
  'stop': [
    '/images/asl-signs/stop/palm-forward.png',
  ],
  'good': [
    '/images/asl-signs/good/thumbs-up.png',
  ],
  'bad': [
    '/images/asl-signs/bad/thumbs-down.png',
  ],
  'help': [
    '/images/asl-signs/help/base-hand.png',
    '/images/asl-signs/help/fist-tap.png',
    '/images/asl-signs/help/base-hand.png',
  ],
  'what': [
    '/images/asl-signs/what/palms-up.png',
    '/images/asl-signs/what/palms-shrug.png',
  ],
};

// Timing for each sign animation (in milliseconds)
const animationTimings: Record<string, number> = {
  'hello': 1000,
  'yes': 800,
  'no': 600,
  'thank you': 1200,
  'please': 2000,
  'stop': 100,
  'good': 100,
  'bad': 100,
  'help': 600,
  'what': 1500,
};

const ImageBasedHandDisplay: React.FC<ImageBasedHandDisplayProps> = ({ signName, className = '' }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [imageError, setImageError] = useState(false);

  const sign = signName.toLowerCase();
  const frames = signImageSequences[sign] || signImageSequences['hello'];
  const animationDuration = animationTimings[sign] || 1000;
  const frameDelay = animationDuration / frames.length;

  useEffect(() => {
    setCurrentFrame(0);
    setIsAnimating(true);
    setImageError(false);
  }, [signName]);

  useEffect(() => {
    if (!isAnimating || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, frameDelay);

    return () => clearInterval(interval);
  }, [isAnimating, frames.length, frameDelay]);

  const handleImageError = () => {
    setImageError(true);
  };

  // Placeholder content when images are not available
  const renderPlaceholder = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 rounded-lg p-8">
      <div className="text-6xl mb-4">✋</div>
      <h3 className="text-xl font-semibold text-white mb-2">{signName}</h3>
      <p className="text-gray-400 text-sm text-center max-w-md">
        To use real ASL images:
      </p>
      <ol className="text-gray-500 text-xs mt-4 text-left">
        <li>1. Download ASL images from datasets listed in ASL_RESOURCES.md</li>
        <li>2. Place images in: <code className="bg-gray-700 px-1 rounded">{frames[currentFrame]}</code></li>
        <li>3. Images will automatically display here</li>
      </ol>
    </div>
  );

  return (
    <div className={`flex flex-col items-center justify-center bg-gray-900 rounded-lg p-8 min-h-[400px] ${className}`}>
      <div className="relative w-80 h-80 mb-4">
        {imageError ? (
          renderPlaceholder()
        ) : (
          <>
            <img
              src={frames[currentFrame]}
              alt={`ASL sign for ${signName} - frame ${currentFrame + 1}`}
              className="w-full h-full object-contain rounded-lg"
              onError={handleImageError}
            />
            {frames.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {frames.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentFrame ? 'bg-purple-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{signName}</h3>
        <p className="text-gray-400 text-sm">ASL Sign</p>
        
        {frames.length > 1 && (
          <div className="mt-4 space-x-2">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
            >
              {isAnimating ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setCurrentFrame(0)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-800 rounded-lg max-w-md">
        <h4 className="text-sm font-semibold text-white mb-2">Implementation Notes:</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• This component uses real ASL images when available</li>
          <li>• Supports multi-frame animations for dynamic signs</li>
          <li>• Falls back to placeholder when images not found</li>
          <li>• See ASL_RESOURCES.md for image sources</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageBasedHandDisplay;