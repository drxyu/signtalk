import React from 'react';

const LandingPage: React.FC = () => {
  const aiModels = [
    { name: 'MEDIAPIPE', icon: '🤖' },
    { name: 'THREEJS', icon: '🎨' },
    { name: 'ASL', icon: '🤟' },
    { name: 'VISION', icon: '👁️' },
    { name: 'GESTURE', icon: '✋' },
    { name: 'MOTION', icon: '🎯' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-900 text-white overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/3 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center">
              <span style={{ fontSize: '7.5rem', lineHeight: '1' }}>👋</span>
              <span style={{ fontSize: '6.75rem', lineHeight: '1', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', marginLeft: '0.1875em' }} className="font-bold text-white">SignTALK</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</a>
            <a href="#demo" className="text-gray-400 hover:text-white transition-colors text-sm">Demo</a>
            <a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm">About</a>
            <a href="/demo.html" className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all text-sm">
              Try Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-20">
        <div className="max-w-7xl mx-auto text-center">

          {/* Main Heading */}
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-gray-300">
            All-in-one SaaS Platform for ASL Content
          </h2>

          {/* Subheading */}
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Meet SignTALK. All-in-one platform to recognize ASL gestures and enable seamless communication in minutes.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-6 mt-16">
            <a 
              href="/demo.html" 
              className="relative inline-block font-bold transition-all transform hover:scale-105 metallic-button"
              style={{ 
                padding: '30px 70px',
                fontSize: '36px',
                borderRadius: '50px',
                minWidth: '35%',
                textAlign: 'center',
                lineHeight: '1',
                textShadow: '0 1px 0 rgba(255,255,255,0.8), 0 -1px 0 rgba(0,0,0,0.2)'
              }}
            >
              <span className="relative z-10" style={{ 
                background: 'linear-gradient(to bottom, #1a1a1a 0%, #2a2a2a 50%, #c0c0c0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent'
              }}>Hackathon-Day Demo</span>
              <div 
                className="absolute inset-0 rounded-[50px] opacity-40 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, transparent 45%, transparent 55%, rgba(0,0,0,0.1) 100%)',
                }}
              ></div>
            </a>
            <a href="#learn-more" className="text-gray-400 text-sm underline underline-offset-4 hover:text-white transition-colors">
              Learn more
            </a>
          </div>
        </div>
      </section>



      {/* AI Models Ticker */}
      <section className="relative z-10 py-6 border-y border-gray-700/50">
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll">
            {[...aiModels, ...aiModels].map((model, i) => (
              <div key={i} className="flex items-center gap-3 px-8 text-gray-600">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{model.icon}</span>
                </div>
                <span className="text-sm font-medium uppercase tracking-wider">{model.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need for ASL
            </h2>
            <p className="text-lg text-gray-400">
              Powerful features to recognize, translate, and learn sign language
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <a href="/translator" className="bg-gray-900/50 backdrop-blur rounded-xl p-8 border border-gray-700 hover:border-purple-600/50 transition-colors group block">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:from-purple-600/30 group-hover:to-blue-600/30 transition-colors">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Detection</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Instant recognition of ASL letters, numbers, and common phrases with high accuracy
              </p>
              <span className="text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">Try Translator →</span>
            </a>
            <a href="/pose-compare" className="bg-gray-900/50 backdrop-blur rounded-xl p-8 border border-gray-700 hover:border-purple-600/50 transition-colors group block">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:from-purple-600/30 group-hover:to-blue-600/30 transition-colors">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">3D Visualization</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Interactive 3D hand and pose tracking for better understanding of gestures
              </p>
              <span className="text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">Compare Poses →</span>
            </a>
            <a href="/mediapipe-compare" className="bg-gray-900/50 backdrop-blur rounded-xl p-8 border border-gray-700 hover:border-purple-600/50 transition-colors group block">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center mb-6 group-hover:from-purple-600/30 group-hover:to-blue-600/30 transition-colors">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Analytics Dashboard</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Track your progress, accuracy, and learning patterns over time
              </p>
              <span className="text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">Benchmark Tests →</span>
            </a>
          </div>
        </div>
      </section>

      {/* Demo Links Section */}
      <section className="relative z-10 px-6 py-16 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold mb-2">More Testing & Demo Pages</h3>
            <p className="text-gray-400">Explore our various benchmarking and testing tools</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <a href="/sign-demo" className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-4 text-center transition-colors border border-gray-700 hover:border-purple-600/50">
              <span className="text-lg mb-2 block">🖐️</span>
              <span className="text-sm font-medium">Sign Display Demo</span>
            </a>
            <a href="/mediapipe-simple" className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-4 text-center transition-colors border border-gray-700 hover:border-purple-600/50">
              <span className="text-lg mb-2 block">⚡</span>
              <span className="text-sm font-medium">MediaPipe Simple</span>
            </a>
            <a href="/test" className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-4 text-center transition-colors border border-gray-700 hover:border-purple-600/50">
              <span className="text-lg mb-2 block">🧪</span>
              <span className="text-sm font-medium">Test Page</span>
            </a>
            <a href="/debug" className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-4 text-center transition-colors border border-gray-700 hover:border-purple-600/50">
              <span className="text-lg mb-2 block">🐛</span>
              <span className="text-sm font-medium">Debug Tools</span>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-8 bg-gradient-to-r from-purple-600/10 to-blue-600/10 px-4 py-2 rounded-full border border-purple-600/20">
            <span className="text-sm text-purple-400">✨ Start for free</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to start signing?
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Join thousands using SignTALK to communicate through sign language
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/demo.html" 
              className="bg-white text-gray-900 px-8 py-3.5 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Try Demo Now
            </a>
            <a 
              href="#learn-more" 
              className="bg-gray-900 text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-gray-900 transition-all border border-gray-700"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-gray-700/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-8">
            <div>
              <h4 className="font-medium text-gray-200 mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#" className="text-gray-500 text-sm hover:text-gray-300 block transition-colors">Features</a>
                <a href="#" className="text-gray-500 text-sm hover:text-gray-300 block transition-colors">Demo</a>
                <a href="#" className="text-gray-500 text-sm hover:text-gray-300 block transition-colors">Pricing</a>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-200 mb-4">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="text-gray-500 text-sm hover:text-gray-300 block transition-colors">Documentation</a>
                <a href="#" className="text-gray-500 text-sm hover:text-gray-300 block transition-colors">ASL Guide</a>
                <a href="#" className="text-gray-500 text-sm hover:text-gray-300 block transition-colors">API</a>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-200 mb-4">Company</h4>
              <div className="space-y-2">
                <a href="#" className="text-gray-500 text-sm hover:text-gray-300 block transition-colors">About</a>
                <a href="#" className="text-gray-500 text-sm hover:text-gray-300 block transition-colors">Blog</a>
                <a href="#" className="text-gray-500 text-sm hover:text-gray-300 block transition-colors">Contact</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-700/50">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <span className="text-2xl">👋</span>
                <span className="font-semibold text-white" style={{ marginLeft: '0.125em' }}>SignTALK</span>
              </div>
              <p className="text-gray-500 text-sm">
                Making sign language accessible to everyone
              </p>
            </div>
            <div className="text-center text-gray-500 text-sm mt-4">
              © {new Date().getFullYear()} SignTALK. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
