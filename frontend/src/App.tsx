import { useState, useEffect, useRef } from 'react'
import './App.css'
import Header from './components/Header'
import AvatarDisplay from './components/AvatarDisplay'
import { SignDisplay } from './components/SignDisplay'
import TranslationDisplay from './components/TranslationDisplay'
import ControlBar from './components/ControlBar'
import StatusBar from './components/StatusBar'
import ReplayModal from './components/ReplayModal'
import PerformanceMonitor from './components/PerformanceMonitor'
import { useWebSocket } from './hooks/useWebSocket'
import { useMediaStream } from './hooks/useMediaStream'
import LandingPage from './pages/LandingPage'

function App() {
  // If we're on the root path, show the landing page
  if (window.location.pathname === '/') {
    return <LandingPage />;
  }
  const [currentWord, setCurrentWord] = useState<string>('')
  const [isReplaying, setIsReplaying] = useState(false)
  const [currentMode, setCurrentMode] = useState<'speech_to_sign' | 'sign_to_speech' | 'auto_detect'>('auto_detect')
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle')
  const [showReplayModal, setShowReplayModal] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [currentLatency, setCurrentLatency] = useState<number>(0)
  
  const { 
    isConnected, 
    sendMessage, 
    lastMessage,
    audioLevel,
    motionLevel 
  } = useWebSocket('ws://localhost:8000/ws')
  
  const { 
    isMicActive, 
    isCameraActive,
    startMedia,
    stopMedia,
    audioStream,
    videoStream,
    audioProcessor
  } = useMediaStream()

  // Handle incoming translation results
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage)
      if (data.type === 'translation_result' && data.translation) {
        if (data.translation.type === 'speech_to_sign') {
          setCurrentWord(data.translation.input_text)
          if (data.translation.signs && data.translation.signs.length > 0) {
            setCurrentAnimation(data.translation.signs[0])
          }
        } else if (data.translation.type === 'sign_to_speech') {
          setCurrentWord(data.translation.output_text)
          // Play audio if available
          if (data.translation.audio) {
            // Handle audio playback
          }
        }
        setCurrentMode(data.mode)
      }
      // Update latency if available
      if (data.performance && data.performance.latency_ms) {
        setCurrentLatency(data.performance.latency_ms)
      }
    }
  }, [lastMessage])

  // Start media streams and session on mount
  useEffect(() => {
    startMedia()
    startSession()
    return () => {
      stopMedia()
      if (currentSessionId) {
        stopSession(currentSessionId)
      }
    }
  }, [])

  // Stream audio and video data to WebSocket
  useEffect(() => {
    if (!isConnected || !audioStream || !videoStream || !audioProcessor) return

    let audioBuffer: Float32Array[] = []
    
    // Process audio data
    const handleAudioProcess = (e: AudioProcessingEvent) => {
      const inputData = e.inputBuffer.getChannelData(0)
      audioBuffer.push(new Float32Array(inputData))
      
      // Send audio chunks every 100ms (approximately)
      if (audioBuffer.length >= 5) {
        // Concatenate audio chunks
        const totalLength = audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0)
        const combinedBuffer = new Float32Array(totalLength)
        let offset = 0
        for (const chunk of audioBuffer) {
          combinedBuffer.set(chunk, offset)
          offset += chunk.length
        }
        
        // Convert to base64 for transmission
        const audioData = btoa(String.fromCharCode(...new Uint8Array(combinedBuffer.buffer)))
        audioBuffer = [] // Clear buffer
        
        // We'll send this with video frame
      }
    }
    
    audioProcessor.onaudioprocess = handleAudioProcess

    const streamInterval = setInterval(() => {
      // Capture video frame
      const video = document.createElement('video')
      video.srcObject = videoStream
      video.play()

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          const imageData = canvas.toDataURL('image/jpeg', 0.8)
          
          // Get current audio buffer as base64
          let audioData = ''
          if (audioBuffer.length > 0) {
            const totalLength = audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0)
            const combinedBuffer = new Float32Array(totalLength)
            let offset = 0
            for (const chunk of audioBuffer) {
              combinedBuffer.set(chunk, offset)
              offset += chunk.length
            }
            audioData = btoa(String.fromCharCode(...new Uint8Array(combinedBuffer.buffer)))
            audioBuffer = [] // Clear after sending
          }
          
          // Send combined audio/video message
          sendMessage({
            type: 'stream',
            video: imageData,
            audio: audioData || 'mock_audio_data',
            timestamp: Date.now()
          })
        }
      }
    }, 100) // Send frames at 10 FPS

    return () => {
      clearInterval(streamInterval)
      if (audioProcessor) {
        audioProcessor.onaudioprocess = null
      }
    }
  }, [isConnected, audioStream, videoStream, audioProcessor, sendMessage])

  const startSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/session/start', {
        method: 'POST'
      })
      const data = await response.json()
      setCurrentSessionId(data.session_id)
      console.log('Session started:', data.session_id)
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const stopSession = async (sessionId: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/session/${sessionId}/stop`, {
        method: 'POST'
      })
      console.log('Session stopped:', sessionId)
    } catch (error) {
      console.error('Error stopping session:', error)
    }
  }

  const handleReplay = () => {
    setShowReplayModal(true)
  }

  const handlePause = () => {
    // Toggle pause state
    console.log('Pause clicked')
  }

  // Add link to demo page for testing
  if (window.location.pathname === '/sign-demo-link') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <a href="/sign-demo" className="bg-purple-600 px-6 py-3 rounded hover:bg-purple-700">
          Go to Sign Display Demo
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 h-[calc(100vh-80px)]">
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {/* Sign Display - Choose between AvatarDisplay or SignDisplay */}
          <div className="w-full max-w-4xl h-[60%] relative">
            {/* Option 1: Use new SignDisplay component */}
            <SignDisplay 
              signName={currentAnimation || currentWord || 'Hello'}
              mode="animated" // Can be 'static', 'animated', '3d', or 'video'
              className="h-full"
            />
            
            {/* Option 2: Keep original AvatarDisplay (commented out) */}
            {/* <AvatarDisplay 
              currentAnimation={currentAnimation}
              isLoading={false}
              videoStream={videoStream}
              isCameraActive={isCameraActive}
            /> */}
          </div>

          {/* Current Word Display */}
          <TranslationDisplay 
            currentWord={currentWord}
            confidence={0.95}
            mode={currentMode}
          />

          {/* Control Buttons */}
          <ControlBar 
            onReplay={handleReplay}
            onPause={handlePause}
            isReplaying={isReplaying}
          />

          {/* Status Bar */}
          <StatusBar 
            isMicActive={isMicActive}
            isCameraActive={isCameraActive}
            isConnected={isConnected}
            currentMode={currentMode}
            audioLevel={audioLevel}
            motionLevel={motionLevel}
          />
        </div>
      </main>
      
      {/* Replay Modal */}
      <ReplayModal 
        isOpen={showReplayModal}
        onClose={() => setShowReplayModal(false)}
        sessionId={currentSessionId || undefined}
      />
      
      {/* Performance Monitor */}
      <PerformanceMonitor 
        isVisible={false}
        latency={currentLatency}
      />
    </div>
  )
}

export default App