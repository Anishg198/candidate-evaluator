import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './ThemeContext'
import './index.css'

// Apply theme before React renders to prevent flash
const stored = localStorage.getItem('plt_theme')
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
if (stored === 'dark' || (!stored && prefersDark)) {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
