import { useState, useEffect, useRef, useCallback } from 'react'

interface WebSocketState {
  isConnected: boolean
  sendMessage: (message: any) => void
  lastMessage: string | null
  audioLevel: number
  motionLevel: number
}

export const useWebSocket = (url: string): WebSocketState => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [motionLevel, setMotionLevel] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
      }
      
      ws.onmessage = (event) => {
        setLastMessage(event.data)
        try {
          const data = JSON.parse(event.data)
          if (data.audio_level !== undefined) {
            setAudioLevel(data.audio_level)
          }
          if (data.motion_level !== undefined) {
            setMotionLevel(data.motion_level)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }
      
      wsRef.current = ws
    } catch (error) {
      console.error('Error creating WebSocket:', error)
    }
  }, [url])

  useEffect(() => {
    connect()
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  return {
    isConnected,
    sendMessage,
    lastMessage,
    audioLevel,
    motionLevel
  }
}