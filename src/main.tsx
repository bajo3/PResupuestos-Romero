import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyRemoteReset } from './utils/reset'
import './index.css'

// Antes de mostrar nada, se respeta un reinicio hecho desde otro dispositivo.
void applyRemoteReset().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
