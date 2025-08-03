import React from 'react';

const NavigationPage: React.FC = () => {
  const routes = [
    { path: '/', name: 'Main App', description: 'Main application with avatar display' },
    { path: '/translator', name: 'Sign Language Translator', description: 'Real-time ASL recognition with 3D visualization' },
    { path: '/pose-compare', name: 'Pose Detection Comparison', description: 'Compare MediaPipe Pose, PoseNet, and BlazePose', highlight: true },
    { path: '/mediapipe-compare', name: 'MediaPipe Hand Comparison', description: 'Compare Three.js vs Babylon.js hand visualization' },
    { path: '/sign-demo', name: 'Sign Display Demo', description: 'Sign display components showcase' },
    { path: '/test', name: 'Test Page', description: 'General testing page' },
    { path: '/simple-test', name: 'Simple Test', description: 'Simple testing page' },
    { path: '/debug', name: 'MediaPipe Debug', description: 'MediaPipe debugging tools' },
    { path: '/test-css', name: 'CSS Test', description: 'CSS testing page' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Sign Language Project Navigation
          </h1>
          <p className="text-gray-400">Choose a page to test different features</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route, index) => (
            <a
              key={index}
              href={route.path}
              className={`block p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                route.highlight 
                  ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500 hover:border-purple-400' 
                  : 'bg-gray-800 border-gray-700 hover:border-cyan-600'
              }`}
            >
              <h3 className={`text-xl font-semibold mb-2 ${
                route.highlight ? 'text-purple-300' : 'text-white'
              }`}>
                {route.name}
                {route.highlight && (
                  <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                    NEW
                  </span>
                )}
              </h3>
              <p className="text-gray-400 text-sm">{route.description}</p>
              <div className="mt-3 text-xs text-gray-500">
                Path: {route.path}
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">📋 Testing Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">🆕 Pose Detection Comparison</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Tests 3 pose detection libraries side by side</li>
                <li>• MediaPipe Pose (33 landmarks)</li>
                <li>• PoseNet (17 landmarks)</li>
                <li>• BlazePose (33 landmarks, high accuracy)</li>
                <li>• Real-time performance comparison</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">🤟 Sign Language Translator</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Full ASL alphabet recognition (A-Z)</li>
                <li>• 3D hand visualization with Three.js</li>
                <li>• Real-time gesture detection</li>
                <li>• AI-powered translation backend</li>
                <li>• Side-by-side camera and 3D view</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-400">
          <p className="text-sm">
            💡 Tip: Use your browser's back button to return to this navigation page
          </p>
        </div>
      </div>
    </div>
  );
};

export default NavigationPage;