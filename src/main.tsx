import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthGate } from './auth/AuthGate'
import './index.css'

// El reinicio compartido y el login se resuelven dentro de AuthGate, antes de mostrar la app.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </React.StrictMode>,
)

// Modo sin conexión (solo en la versión publicada)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ })
  })
}
