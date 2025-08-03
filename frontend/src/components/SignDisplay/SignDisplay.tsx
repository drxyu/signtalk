import React, { Suspense, lazy } from 'react';

// Lazy load components to optimize bundle size
const StaticSignDisplay = lazy(() => import('./StaticSignDisplay'));
const AnimatedHandDisplay = lazy(() => import('./AnimatedHandDisplay'));
const ThreeHandDisplay = lazy(() => import('./ThreeHandDisplay'));
const VideoSignDisplay = lazy(() => import('./VideoSignDisplay'));
const ImageBasedHandDisplay = lazy(() => import('./ImageBasedHandDisplay'));

export type SignDisplayMode = 'static' | 'animated' | '3d' | 'video' | 'images';

interface SignDisplayProps {
  signName: string;
  mode: SignDisplayMode;
  className?: string;
  onModeChange?: (mode: SignDisplayMode) => void;
}

const SignDisplay: React.FC<SignDisplayProps> = ({ 
  signName, 
  mode = 'animated', 
  className = '',
  onModeChange 
}) => {
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[400px] bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading sign display...</p>
      </div>
    </div>
  );

  const renderDisplay = () => {
    switch (mode) {
      case 'static':
        return <StaticSignDisplay signName={signName} className={className} />;
      case 'animated':
        return <AnimatedHandDisplay signName={signName} className={className} />;
      case '3d':
        return <ThreeHandDisplay signName={signName} className={className} />;
      case 'video':
        return <VideoSignDisplay signName={signName} className={className} />;
      case 'images':
        return <ImageBasedHandDisplay signName={signName} className={className} />;
      default:
        return <AnimatedHandDisplay signName={signName} className={className} />;
    }
  };

  return (
    <div className="sign-display-wrapper">
      {onModeChange && (
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={() => onModeChange('static')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              mode === 'static' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Static
          </button>
          <button
            onClick={() => onModeChange('animated')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              mode === 'animated' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            2D Animated
          </button>
          <button
            onClick={() => onModeChange('3d')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              mode === '3d' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            3D
          </button>
          <button
            onClick={() => onModeChange('video')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              mode === 'video' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Video
          </button>
          <button
            onClick={() => onModeChange('images')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              mode === 'images' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Real ASL
          </button>
        </div>
      )}
      
      <Suspense fallback={<LoadingFallback />}>
        {renderDisplay()}
      </Suspense>
    </div>
  );
};

export default SignDisplay;