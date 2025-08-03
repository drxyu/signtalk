import React, { useState, useEffect, useRef } from 'react'

interface ReplaySession {
  session_id: string
  duration: number
  start_time: string
  end_time: string
  translation_count: number
  mode_changes: number
  key_moments: Array<{
    type: string
    text?: string
    gesture?: string
    signs?: string[]
    timestamp: string
  }>
}

interface ReplayModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId?: string
}

const ReplayModal: React.FC<ReplayModalProps> = ({ isOpen, onClose, sessionId }) => {
  const [recentSessions, setRecentSessions] = useState<ReplaySession[]>([])
  const [selectedSession, setSelectedSession] = useState<ReplaySession | null>(null)
  const [isReplaying, setIsReplaying] = useState(false)
  const [replayProgress, setReplayProgress] = useState(0)
  const [replaySpeed, setReplaySpeed] = useState(1.0)
  const [highlights, setHighlights] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchRecentSessions()
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [isOpen])

  const fetchRecentSessions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/replay/recent')
      const data = await response.json()
      setRecentSessions(data.sessions)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/replay/${sessionId}`)
      const data = await response.json()
      setSelectedSession(data)
      
      // Load highlights
      const highlightsResponse = await fetch(`http://localhost:8000/api/v1/replay/${sessionId}/highlights`)
      const highlightsData = await highlightsResponse.json()
      setHighlights(highlightsData)
    } catch (error) {
      console.error('Error loading session:', error)
    }
  }

  const startReplay = (sessionId: string) => {
    setIsReplaying(true)
    setReplayProgress(0)
    
    // Connect to replay WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/replay/${sessionId}?speed=${replaySpeed}`)
    wsRef.current = ws
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'replay_frame') {
        setReplayProgress(data.progress * 100)
        
        // Handle frame data
        if (data.data.translation) {
          // Update UI with translation data
          console.log('Replay frame:', data.data)
        }
      } else if (data.type === 'replay_complete') {
        setIsReplaying(false)
        setReplayProgress(100)
      }
    }
    
    ws.onerror = (error) => {
      console.error('Replay WebSocket error:', error)
      setIsReplaying(false)
    }
  }

  const stopReplay = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsReplaying(false)
  }

  const exportSession = async (sessionId: string, format: string = 'json') => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/replay/${sessionId}/export?format=${format}`)
      const data = await response.json()
      
      // Create download link
      const blob = new Blob([atob(data.data)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting session:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Translation Replay</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Sessions List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => loadSession(session.session_id)}
                  className={`bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors ${
                    selectedSession?.session_id === session.session_id ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{new Date(session.start_time).toLocaleString()}</p>
                      <p className="text-sm text-gray-400">
                        {session.duration.toFixed(1)}s • {session.translation_count} translations
                      </p>
                    </div>
                    <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
                      {session.mode_changes} mode changes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Details */}
          {selectedSession && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Session Details</h3>
              
              {/* Replay Controls */}
              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => isReplaying ? stopReplay() : startReplay(selectedSession.session_id)}
                    disabled={isReplaying && replayProgress === 100}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    {isReplaying ? (replayProgress === 100 ? 'Complete' : 'Stop') : 'Play Replay'}
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Speed:</label>
                    <select
                      value={replaySpeed}
                      onChange={(e) => setReplaySpeed(parseFloat(e.target.value))}
                      disabled={isReplaying}
                      className="bg-gray-700 px-2 py-1 rounded text-sm"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="1.0">1x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2.0">2x</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => exportSession(selectedSession.session_id)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Export
                  </button>
                </div>
                
                {/* Progress Bar */}
                {isReplaying && (
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${replayProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Key Moments */}
              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-3">Key Moments</h4>
                <div className="space-y-2">
                  {selectedSession.key_moments.map((moment, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">
                        {new Date(moment.timestamp).toLocaleTimeString()}
                      </span>
                      {moment.type === 'speech' ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          <span>"{moment.text}" → {moment.signs?.join(', ')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                          </svg>
                          <span>{moment.gesture} → "{moment.text}"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              {highlights && highlights.highlights && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Top Translations</h4>
                  <div className="space-y-2">
                    {highlights.highlights.slice(0, 5).map((highlight: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{highlight.content}</span>
                        <span className="text-green-400">{(highlight.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReplayModal