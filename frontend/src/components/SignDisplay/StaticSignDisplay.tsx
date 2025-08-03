import React from 'react';

interface StaticSignDisplayProps {
  signName: string;
  className?: string;
}

// Mapping of sign names to image files
const signImageMap: Record<string, string> = {
  'hello': '/images/asl-signs/hello.png',
  'thank you': '/images/asl-signs/thank-you.png',
  'yes': '/images/asl-signs/yes.png',
  'no': '/images/asl-signs/no.png',
  'please': '/images/asl-signs/please.png',
  'stop': '/images/asl-signs/stop.png',
  'good': '/images/asl-signs/good.png',
  'bad': '/images/asl-signs/bad.png',
  'help': '/images/asl-signs/help.png',
  'what': '/images/asl-signs/what.png',
};

const StaticSignDisplay: React.FC<StaticSignDisplayProps> = ({ signName, className = '' }) => {
  const imagePath = signImageMap[signName.toLowerCase()] || null;

  if (!imagePath) {
    // Fallback to text description if no image available
    return (
      <div className={`flex items-center justify-center bg-gray-800 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-2">Sign: {signName}</p>
          <p className="text-gray-400">Visual representation not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img 
        src={imagePath} 
        alt={`ASL sign for ${signName}`}
        className="w-full h-full object-contain rounded-lg bg-gray-900"
        onError={(e) => {
          // If image fails to load, show placeholder
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement?.classList.add('image-error');
        }}
      />
      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 rounded px-4 py-2">
        <p className="text-white text-lg font-semibold text-center">{signName}</p>
      </div>
      <style>{`
        .image-error::after {
          content: 'Image not found';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 1.5rem;
        }
      `}</style>
    </div>
  );
};

export default StaticSignDisplay;