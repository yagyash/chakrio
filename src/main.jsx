import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Global error capture (production only) ───────────────────────────────────
if (import.meta.env.PROD) {
  const _report = (payload) => {
    navigator.sendBeacon('/api/log-error', JSON.stringify(payload))
  }

  window.onerror = (message, source, lineno, colno, error) => {
    _report({
      type: 'onerror',
      message: String(message ?? '').slice(0, 500),
      source: String(source ?? '').slice(0, 200),
      lineno,
      colno,
      stack: (error?.stack ?? '').slice(0, 800),
      url: window.location.href,
      timestamp: new Date().toISOString(),
    })
    return false
  }

  window.onunhandledrejection = (event) => {
    const r = event.reason
    _report({
      type: 'unhandledrejection',
      message: (r instanceof Error ? r.message : String(r ?? 'Unhandled rejection')).slice(0, 500),
      stack: (r instanceof Error ? r.stack ?? '' : '').slice(0, 800),
      url: window.location.href,
      timestamp: new Date().toISOString(),
    })
  }
}
// ── End global error capture ─────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
