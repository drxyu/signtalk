import React, { useState } from 'react';
import { SignDisplay } from '../components/SignDisplay';
import type { SignDisplayMode } from '../components/SignDisplay';

const SignDisplayDemo: React.FC = () => {
  const [currentSign, setCurrentSign] = useState('Hello');
  const [displayMode, setDisplayMode] = useState<SignDisplayMode>('animated');

  const availableSigns = [
    'Hello',
    'Goodbye',
    'Thank You',
    'You\'re Welcome',
    'Yes',
    'No',
    'Please',
    'Sorry',
    'Stop',
    'Good',
    'Bad',
    'Help',
    'What'
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Sign Display Demo
        </h1>
        
        <div className="mb-8">
          <h2 className="text-xl mb-4">Select a Sign:</h2>
          <div className="flex flex-wrap gap-2">
            {availableSigns.map((sign) => (
              <button
                key={sign}
                onClick={() => setCurrentSign(sign)}
                className={`px-4 py-2 rounded transition-colors ${
                  currentSign === sign
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {sign}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <SignDisplay
            signName={currentSign}
            mode={displayMode}
            onModeChange={setDisplayMode}
            className="w-full"
          />
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Implementation Notes:</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <span className="font-semibold text-white">Static Images:</span> Place ASL reference images in{' '}
              <code className="bg-gray-700 px-2 py-1 rounded">/frontend/public/images/asl-signs/</code>
            </p>
            <p>
              <span className="font-semibold text-white">2D Animations:</span> CSS-based animations, no additional assets needed
            </p>
            <p>
              <span className="font-semibold text-white">3D Hands:</span> Three.js rendered, customizable hand poses
            </p>
            <p>
              <span className="font-semibold text-white">Video Clips:</span> Place MP4/WebM videos in{' '}
              <code className="bg-gray-700 px-2 py-1 rounded">/frontend/public/videos/asl-signs/</code>
            </p>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Usage Example:</h3>
          <pre className="bg-gray-900 p-4 rounded overflow-x-auto">
            <code className="text-sm">{`import { SignDisplay } from './components/SignDisplay';

// Basic usage
<SignDisplay 
  signName="Hello" 
  mode="animated" 
/>

// With mode switcher
<SignDisplay 
  signName={currentSign} 
  mode={displayMode}
  onModeChange={setDisplayMode}
/>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SignDisplayDemo;