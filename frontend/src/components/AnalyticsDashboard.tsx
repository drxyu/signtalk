import React, { useState, useEffect } from 'react'

interface AnalyticsData {
  totalTranslations: number
  modeUsage: {
    speech_to_sign: number
    sign_to_speech: number
    auto_detect: number
  }
  averageResponseTime: number
  popularSigns: Array<{ sign: string; count: number }>
  accuracyRate: number
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/analytics/demo')
        const data = await response.json()
        setAnalytics(data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
    // Refresh every 5 seconds
    const interval = setInterval(fetchAnalytics, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-purple-600/30 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-purple-600/20 rounded"></div>
            <div className="h-4 bg-purple-600/20 rounded"></div>
            <div className="h-4 bg-purple-600/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  const totalModeUsage = analytics.modeUsage.speech_to_sign + analytics.modeUsage.sign_to_speech + analytics.modeUsage.auto_detect
  
  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 space-y-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Live Analytics
      </h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-purple-600/20 rounded-xl p-4">
          <p className="text-sm text-purple-300">Total Translations</p>
          <p className="text-2xl font-bold">{analytics.totalTranslations.toLocaleString()}</p>
        </div>
        <div className="bg-blue-600/20 rounded-xl p-4">
          <p className="text-sm text-blue-300">Avg Response Time</p>
          <p className="text-2xl font-bold">{analytics.averageResponseTime}ms</p>
        </div>
        <div className="bg-green-600/20 rounded-xl p-4">
          <p className="text-sm text-green-300">Accuracy Rate</p>
          <p className="text-2xl font-bold">{(analytics.accuracyRate * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-pink-600/20 rounded-xl p-4">
          <p className="text-sm text-pink-300">Active Mode</p>
          <p className="text-2xl font-bold">Auto</p>
        </div>
      </div>

      {/* Mode Usage Chart */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Translation Mode Usage</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Speech to Sign</span>
              <span className="text-sm">{((analytics.modeUsage.speech_to_sign / totalModeUsage) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(analytics.modeUsage.speech_to_sign / totalModeUsage) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Sign to Speech</span>
              <span className="text-sm">{((analytics.modeUsage.sign_to_speech / totalModeUsage) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(analytics.modeUsage.sign_to_speech / totalModeUsage) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Auto Detect</span>
              <span className="text-sm">{((analytics.modeUsage.auto_detect / totalModeUsage) * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(analytics.modeUsage.auto_detect / totalModeUsage) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Popular Signs */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Popular Signs Today</h3>
        <div className="space-y-2">
          {analytics.popularSigns.map((item, index) => (
            <div key={item.sign} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-purple-400">#{index + 1}</span>
                <span className="capitalize">{item.sign.replace('_', ' ')}</span>
              </div>
              <span className="text-sm text-gray-400">{item.count} times</span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Activity Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live data updates every 5 seconds</span>
      </div>
    </div>
  )
}

export default AnalyticsDashboard