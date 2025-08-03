import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SignDisplayDemo from './pages/SignDisplayDemo.tsx'
import TestPage from './pages/TestPage.tsx'
import MediaPipeComparison from './pages/MediaPipeComparison.tsx'
import SimpleTest from './pages/SimpleTest.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import SignLanguageTranslator from './components/SignDisplay/SignLanguageTranslator.tsx'
import MediaPipeDebug from './pages/MediaPipeDebug.tsx'
import MediaPipeComparisonSimple from './pages/MediaPipeComparisonSimple.tsx'
import TestCSS from './pages/TestCSS.tsx'
import PoseDetectionComparison from './pages/PoseDetectionComparison.tsx'
import NavigationPage from './pages/NavigationPage.tsx'

// Simple routing based on URL path
const getComponent = () => {
  const path = window.location.pathname
  
  console.log('Current path:', path) // Debug log
  console.log('Available routes: /, /test, /sign-demo, /mediapipe-compare, /simple-test, /translator, /debug, /test-css, /pose-compare, /nav')
  
  // Add error handling for component loading
  try {
  
  if (path === '/test') {
    return <TestPage />
  }
  
  if (path === '/sign-demo') {
    return <SignDisplayDemo />
  }
  
  if (path === '/mediapipe-compare') {
    return <MediaPipeComparison />
  }
  
  if (path === '/mediapipe-simple') {
    return <MediaPipeComparisonSimple />
  }
  
  if (path === '/simple-test') {
    return <SimpleTest />
  }
  
  if (path === '/translator') {
    return <SignLanguageTranslator />
  }
  
  if (path === '/debug') {
    return <MediaPipeDebug />
  }
  
  if (path === '/test-css') {
    return <TestCSS />
  }
  
  if (path === '/pose-compare') {
    return <PoseDetectionComparison />
  }
  
  if (path === '/nav') {
    return <NavigationPage />
  }
  
  return <App />
  } catch (error) {
    console.error('Error loading component:', error);
    return (
      <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
        <h1>Error Loading Page</h1>
        <p>Path: {path}</p>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        <a href="/debug" style={{ color: '#60a5fa' }}>Go to Debug Page</a>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {getComponent()}
    </ErrorBoundary>
  </StrictMode>,
)
