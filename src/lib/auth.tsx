import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from './api'
import { User, AuthState } from './types'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    isLoading: true,
  })

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
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
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

