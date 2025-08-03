import { useState, useEffect, useRef, useCallback } from 'react'

interface MediaStreamState {
  isMicActive: boolean
  isCameraActive: boolean
  startMedia: () => Promise<void>
  stopMedia: () => void
  audioStream: MediaStream | null
  videoStream: MediaStream | null
  audioProcessor: ScriptProcessorNode | null
}

export const useMediaStream = (): MediaStreamState => {
  const [isMicActive, setIsMicActive] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [audioProcessor, setAudioProcessor] = useState<ScriptProcessorNode | null>(null)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const startMedia = useCallback(async () => {
    try {
      // Request audio permission
      const audio = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      setAudioStream(audio)
      setIsMicActive(true)

      // Initialize audio processing
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      // Create audio processing pipeline
      const source = audioContextRef.current.createMediaStreamSource(audio)
      sourceRef.current = source
      
      // Create script processor for audio chunks (2048 samples, 1 input, 1 output)
      const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1)
      
      // Connect audio pipeline
      source.connect(processor)
      processor.connect(audioContextRef.current.destination)
      
      // Store processor for external access
      setAudioProcessor(processor)

      // Request video permission
      const video = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      setVideoStream(video)
      setIsCameraActive(true)

    } catch (error) {
      console.error('Error accessing media devices:', error)
      // Handle permission denied or other errors
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Please allow camera and microphone access to use SignSpeak AI')
        } else if (error.name === 'NotFoundError') {
          alert('No camera or microphone found on this device')
        }
      }
    }
  }, [])

  const stopMedia = useCallback(() => {
    // Stop audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
      setIsMicActive(false)
    }

    // Stop video stream
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
      setVideoStream(null)
      setIsCameraActive(false)
    }

    // Clean up audio processing
    if (audioProcessor) {
      audioProcessor.disconnect()
      setAudioProcessor(null)
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [audioStream, videoStream, audioProcessor])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMedia()
    }
  }, [stopMedia])

  return {
    isMicActive,
    isCameraActive,
    startMedia,
    stopMedia,
    audioStream,
    videoStream,
    audioProcessor
  }
}