"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { AuthState, User } from "@/lib/types"
import { saveAuth, loadAuth, clearAuth } from "@/lib/storage"
import { mockUser } from "@/lib/mock"

interface AuthContextType extends AuthState {
  login: (user: User, tokens?: { accessToken?: string; idToken?: string; refreshToken?: string }) => void
  logout: () => void
  mockLogin: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    idToken: null,
    refreshToken: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 저장된 인증 상태 로드
    const savedAuth = loadAuth<AuthState>()
    if (savedAuth?.isAuthenticated && savedAuth?.user) {
      setAuthState(savedAuth)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((user: User, tokens?: { accessToken?: string; idToken?: string; refreshToken?: string }) => {
    const newState: AuthState = {
      isAuthenticated: true,
      user,
      accessToken: tokens?.accessToken || null,
      idToken: tokens?.idToken || null,
      refreshToken: tokens?.refreshToken || null,
    }
    setAuthState(newState)
    saveAuth(newState)
  }, [])

  const logout = useCallback(() => {
    const newState: AuthState = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      idToken: null,
      refreshToken: null,
    }
    setAuthState(newState)
    clearAuth()
  }, [])

  const mockLogin = useCallback(() => {
    login(mockUser)
  }, [login])

  const value = useMemo(
    () => ({
      ...authState,
      login,
      logout,
      mockLogin,
      isLoading,
    }),
    [authState, login, logout, mockLogin, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
