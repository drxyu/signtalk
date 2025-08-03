import React from 'react'

interface ControlBarProps {
  onReplay: () => void
  onPause: () => void
  isReplaying: boolean
}

const ControlBar: React.FC<ControlBarProps> = ({ onReplay, onPause, isReplaying }) => {
  const handleShare = () => {
    const shareUrl = window.location.href
    if (navigator.share) {
      navigator.share({
        title: 'SignSpeak AI - Real-time Sign Language Translation',
        text: 'Check out this amazing sign language translation app!',
        url: shareUrl
      }).catch(console.error)
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard!')
      }).catch(console.error)
    }
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={onReplay}
        disabled={isReplaying}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 px-6 py-3 rounded-lg transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {isReplaying ? 'Replaying...' : 'Replay Last'}
      </button>
      
      <button
        onClick={onPause}
        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pause
      </button>
      
      <button 
        onClick={handleShare}
        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-2.796 0-5.29 1.278-6.932 3.284M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Share
      </button>
    </div>
  )
}

export default ControlBar