import React from 'react'

interface TranslationDisplayProps {
  currentWord: string
  confidence: number
  mode: 'speech_to_sign' | 'sign_to_speech' | 'auto_detect'
}

const TranslationDisplay: React.FC<TranslationDisplayProps> = ({ currentWord, confidence, mode }) => {
  const getConfidenceColor = (conf: number) => {
    if (conf > 0.8) return 'text-green-400'
    if (conf > 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getModeIcon = () => {
    switch (mode) {
      case 'speech_to_sign':
        return '🎤 → 🤟'
      case 'sign_to_speech':
        return '🤟 → 🔊'
      default:
        return '🔄'
    }
  }

  return (
    <div className="text-center space-y-4">
      {/* Current Word Display */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl px-8 py-6 min-w-[400px]">
        <p className="text-sm text-purple-300 mb-2 flex items-center justify-center gap-2">
          <span>{getModeIcon()}</span>
          <span className="capitalize">{mode.replace(/_/g, ' ')}</span>
        </p>
        <h2 className="text-4xl font-bold">
          {currentWord || 'Listening and watching...'}
        </h2>
        {currentWord && (
          <p className={`text-sm mt-2 ${getConfidenceColor(confidence)}`}>
            Confidence: {(confidence * 100).toFixed(0)}%
          </p>
        )}
      </div>

      {/* Suggestion Pills (Dummy) */}
      <div className="flex gap-2 justify-center flex-wrap">
        {['Hello', 'Thank you', 'Help me'].map((suggestion) => (
          <button
            key={suggestion}
            className="bg-purple-600/30 hover:bg-purple-600/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Translation History (Last 3) */}
      <div className="flex gap-2 justify-center opacity-50">
        <span className="text-sm">Recent:</span>
        <span className="text-sm">Hello</span>
        <span className="text-sm">→</span>
        <span className="text-sm">Thank you</span>
        <span className="text-sm">→</span>
        <span className="text-sm">Yes</span>
      </div>
    </div>
  )
}

export default TranslationDisplay