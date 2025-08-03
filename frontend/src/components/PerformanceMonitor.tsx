import React, { useState, useEffect } from 'react'

interface PerformanceStats {
  translation_latency?: {
    avg: number
    min: number
    max: number
    p95: number
  }
  video_latency?: {
    avg: number
    min: number
    max: number
    p95: number
  }
  audio_latency?: {
    avg: number
    min: number
    max: number
    p95: number
  }
  current_fps?: number
}

interface PerformanceMonitorProps {
  isVisible?: boolean
  latency?: number
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ isVisible = false, latency }) => {
  const [stats, setStats] = useState<PerformanceStats>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDevTools, setShowDevTools] = useState(false)

  useEffect(() => {
    // Check if dev mode (Shift + D pressed)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        setShowDevTools(!showDevTools)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showDevTools])

  useEffect(() => {
    if (!showDevTools) return

    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/performance/stats')
        const data = await response.json()
        setStats(data.stats || {})
      } catch (error) {
        console.error('Error fetching performance stats:', error)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 1000) // Update every second
    return () => clearInterval(interval)
  }, [showDevTools])

  if (!showDevTools && !isVisible) return null

  const getLatencyColor = (value: number) => {
    if (value < 50) return 'text-green-400'
    if (value < 100) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatLatency = (value: number) => {
    return value ? `${value.toFixed(0)}ms` : '-'
  }

  return (
    <div className={`fixed ${isExpanded ? 'bottom-20 right-4' : 'bottom-4 right-4'} bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg transition-all duration-300 z-40`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">Performance</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Compact View */}
      <div className="flex items-center gap-4 text-xs">
        <div>
          <span className="text-gray-400">Latency: </span>
          <span className={getLatencyColor(latency || stats.translation_latency?.avg || 0)}>
            {formatLatency(latency || stats.translation_latency?.avg || 0)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">FPS: </span>
          <span className={stats.current_fps && stats.current_fps > 10 ? 'text-green-400' : 'text-yellow-400'}>
            {stats.current_fps?.toFixed(0) || '-'}
          </span>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-gray-700 pt-3">
          {/* Translation Latency */}
          {stats.translation_latency && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Translation Latency</p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Avg: </span>
                  <span className={getLatencyColor(stats.translation_latency.avg)}>
                    {formatLatency(stats.translation_latency.avg)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Min: </span>
                  <span>{formatLatency(stats.translation_latency.min)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Max: </span>
                  <span>{formatLatency(stats.translation_latency.max)}</span>
                </div>
                <div>
                  <span className="text-gray-500">P95: </span>
                  <span>{formatLatency(stats.translation_latency.p95)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Video Processing */}
          {stats.video_latency && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Video Processing</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Avg: </span>
                  <span className={getLatencyColor(stats.video_latency.avg)}>
                    {formatLatency(stats.video_latency.avg)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">P95: </span>
                  <span>{formatLatency(stats.video_latency.p95)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Audio Processing */}
          {stats.audio_latency && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Audio Processing</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Avg: </span>
                  <span className={getLatencyColor(stats.audio_latency.avg)}>
                    {formatLatency(stats.audio_latency.avg)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">P95: </span>
                  <span>{formatLatency(stats.audio_latency.p95)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Performance Indicators */}
          <div className="flex items-center gap-2 text-xs pt-2 border-t border-gray-700">
            <div className={`w-2 h-2 rounded-full ${stats.current_fps && stats.current_fps > 10 ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-gray-400">
              {stats.current_fps && stats.current_fps > 10 ? 'Optimal Performance' : 'Performance Degraded'}
            </span>
          </div>
        </div>
      )}

      {/* Dev Tools Hint */}
      {!showDevTools && (
        <div className="mt-2 text-xs text-gray-500">
          Press Shift+D for dev tools
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor