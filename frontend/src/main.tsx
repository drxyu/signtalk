import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SignDisplayDemo from './pages/SignDisplayDemo.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import SignLanguageTranslator from './components/SignDisplay/SignLanguageTranslator.tsx'
import NavigationPage from './pages/NavigationPage.tsx'

// Simple routing based on URL path
const getComponent = () => {
  const path = window.location.pathname
  
  console.log('Current path:', path) // Debug log
  console.log('Available routes: /, /sign-demo, /translator, /nav')
  
  // Add error handling for component loading
  try {
  
  if (path === '/sign-demo') {
    return <SignDisplayDemo />
  }
  
  if (path === '/translator') {
    return <SignLanguageTranslator />
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
        <a href="/" style={{ color: '#60a5fa' }}>Go to Home Page</a>
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
