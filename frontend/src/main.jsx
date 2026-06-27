import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ============================================
// APPLICATION ENTRY POINT
// ============================================

/**
 * Main entry point for the MediParse AI React application.
 * Mounts the App component to the DOM root element.
 */

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your index.html')
}

const root = ReactDOM.createRoot(rootElement)

root.render(
  <App />
)