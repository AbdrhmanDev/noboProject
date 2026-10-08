import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registers the no-op service worker (see public/sw.js): this alone is what makes Chromium-based
// browsers offer the native "Install app" prompt, giving NOBO a real desktop icon/Start-Menu entry
// and its own standalone window -- no offline caching behavior is added by this.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
