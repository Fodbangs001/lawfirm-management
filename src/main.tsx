import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize theme on page load
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'system'
  const root = document.documentElement

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }

  if (savedTheme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(isDark)

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem('theme') === 'system') {
        applyTheme(e.matches)
      }
    })
  } else if (savedTheme === 'dark') {
    applyTheme(true)
  } else {
    applyTheme(false)
  }
}

initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

