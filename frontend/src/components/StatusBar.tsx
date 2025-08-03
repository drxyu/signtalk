import React from 'react'

interface StatusBarProps {
  isMicActive: boolean
  isCameraActive: boolean
  isConnected: boolean
  currentMode: string
  audioLevel: number
  motionLevel: number
}

const StatusBar: React.FC<StatusBarProps> = ({
  isMicActive,
  isCameraActive,
  isConnected,
  currentMode,
  audioLevel,
  motionLevel
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-lg border-t border-white/10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Status Indicators */}
          <div className="flex items-center gap-6">
            {/* Microphone Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isMicActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm">Microphone</span>
              {isMicActive && (
                <div className="flex items-center gap-1 ml-2">
                  <div className="w-1 h-4 bg-green-400 rounded-full" style={{ height: `${audioLevel * 100}%` }} />
                  <div className="w-1 h-4 bg-green-400 rounded-full" style={{ height: `${audioLevel * 80}%` }} />
                  <div className="w-1 h-4 bg-green-400 rounded-full" style={{ height: `${audioLevel * 60}%` }} />
                </div>
              )}
            </div>

            {/* Camera Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm">Camera</span>
              {isCameraActive && motionLevel > 0 && (
                <div className="flex items-center gap-1 ml-2">
                  <div className="w-1 h-4 bg-blue-400 rounded-full" style={{ height: `${motionLevel * 100}%` }} />
                  <div className="w-1 h-4 bg-blue-400 rounded-full" style={{ height: `${motionLevel * 80}%` }} />
                  <div className="w-1 h-4 bg-blue-400 rounded-full" style={{ height: `${motionLevel * 60}%` }} />
                </div>
              )}
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-sm">{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>

          {/* Mode Indicator */}
          <div className="flex items-center gap-2 bg-purple-600/30 backdrop-blur-sm px-4 py-2 rounded-lg">
            <span className="text-sm font-medium">Mode:</span>
            <span className="text-sm capitalize">{currentMode.replace(/_/g, ' ')}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span>Translations: 142</span>
            <span>Avg: 45ms</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatusBar