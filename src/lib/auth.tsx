import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { api } from './api'
import { User, AuthState } from './types'

// Get inactivity timeout from localStorage (default 15 minutes)
const getInactivityTimeout = () => {
  const stored = localStorage.getItem('inactivityTimeout')
  const minutes = stored ? parseInt(stored, 10) : 15
  return minutes * 60 * 1000 // Convert to milliseconds
}

// Warning before logout (1 minute before)
const WARNING_BEFORE_LOGOUT = 1 * 60 * 1000

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  showInactivityWarning: boolean
  remainingTime: number
  extendSession: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    isLoading: true,
  })
  
  // Inactivity tracking
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(60)
  const lastActivityRef = useRef<number>(Date.now())
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setShowInactivityWarning(false)
    setRemainingTime(60)
    
    // Clear existing timeouts
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
  }, [])

  // Extend session (called when user clicks "Stay Logged In")
  const extendSession = useCallback(() => {
    resetActivityTimer()
  }, [resetActivityTimer])

  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          const { user } = await api.getMe()
          setState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isLoading: false,
          }))
        } catch {
          api.logout()
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }
    checkAuth()
  }, [])

  // Auto-logout on inactivity
  useEffect(() => {
    if (!state.isAuthenticated) return

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      if (!showInactivityWarning) {
        resetActivityTimer()
      }
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Check for inactivity periodically
    const checkInactivity = setInterval(() => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivityRef.current
      const currentTimeout = getInactivityTimeout()
      
      // Show warning 1 minute before logout
      if (timeSinceActivity >= currentTimeout - WARNING_BEFORE_LOGOUT && !showInactivityWarning) {
        setShowInactivityWarning(true)
        setRemainingTime(60)
        
        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setRemainingTime(prev => {
            if (prev <= 1) {
              // Time's up - logout
              logout()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    }, 1000)

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      clearInterval(checkInactivity)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [state.isAuthenticated, showInactivityWarning, resetActivityTimer])

  const login = async (email: string, password: string) => {
    try {
      const { user, token } = await api.login(email, password)
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const { user, token } = await api.register(name, email, password, role)
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    api.logout()
    resetActivityTimer()
    setShowInactivityWarning(false)
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, showInactivityWarning, remainingTime, extendSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

