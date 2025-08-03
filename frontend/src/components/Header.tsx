import React, { useState } from 'react'
import Modal from './Modal'
import AnalyticsDashboard from './AnalyticsDashboard'

const Header: React.FC = () => {
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  return (
    <>
    <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl"></span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              SignSpeak AI
            </h1>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setShowAnalytics(true)}
              className="hover:text-purple-400 transition-colors"
            >
              Dashboard
            </button>
            <button className="hover:text-purple-400 transition-colors">History</button>
            <button 
              onClick={() => setShowSettings(true)}
              className="hover:text-purple-400 transition-colors"
            >
              Settings
            </button>
            <button 
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              <span className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-sm font-bold">
                JD
              </span>
              <span>John Doe</span>
            </button>
          </nav>
        </div>
      </div>
    </header>

    {/* Analytics Modal */}
    <Modal 
      isOpen={showAnalytics} 
      onClose={() => setShowAnalytics(false)}
      title="Analytics Dashboard"
    >
      <AnalyticsDashboard />
    </Modal>

    {/* Settings Modal */}
    <Modal 
      isOpen={showSettings} 
      onClose={() => setShowSettings(false)}
      title="Settings"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Voice Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Speech Rate</label>
              <input type="range" min="50" max="300" defaultValue="150" className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Voice Type</label>
              <select className="w-full bg-gray-800 rounded-lg px-4 py-2">
                <option>Default Voice</option>
                <option>Female Voice</option>
                <option>Male Voice</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Detection Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span>Auto-detect translation mode</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span>Show confidence indicators</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>

    {/* Profile Modal */}
    <Modal 
      isOpen={showProfile} 
      onClose={() => setShowProfile(false)}
      title="User Profile"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center text-4xl font-bold">
          JD
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold">John Doe</h3>
          <p className="text-gray-400">john.doe@example.com</p>
        </div>
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold">142</p>
            <p className="text-sm text-gray-400">Translations</p>
          </div>
          <div>
            <p className="text-3xl font-bold">15</p>
            <p className="text-sm text-gray-400">Languages</p>
          </div>
          <div>
            <p className="text-3xl font-bold">94%</p>
            <p className="text-sm text-gray-400">Accuracy</p>
          </div>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors">
          Edit Profile
        </button>
      </div>
    </Modal>
    </>
  )
}

export default Header