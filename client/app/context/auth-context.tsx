import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, type AuthUser } from '../lib/auth-service'

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      const decoded = authService.verifyToken(token)
      if (decoded) {
        authService.getUserById(decoded.userId).then(user => {
          if (user) {
            setUser(user)
          } else {
            localStorage.removeItem('auth_token')
          }
          setLoading(false)
        })
      } else {
        localStorage.removeItem('auth_token')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { user, token } = await authService.login({ email, password })
    localStorage.setItem('auth_token', token)
    setUser(user)
  }

  const register = async (email: string, username: string, password: string, displayName?: string) => {
    const { user, token } = await authService.register({ email, username, password, displayName })
    localStorage.setItem('auth_token', token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}