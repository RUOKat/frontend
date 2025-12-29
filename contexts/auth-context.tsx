"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { AuthState, User } from "@/lib/types"
import { saveAuth, loadAuth, clearAuth, clearAllData } from "@/lib/storage"
import { mockUser } from "@/lib/mock"
import { clearCodeVerifier, clearOAuthState, getCognitoLogoutUrl, isCognitoConfigured } from "@/lib/cognito"

interface AuthContextType extends AuthState {
  login: (user: User, tokens?: { accessToken?: string; idToken?: string; refreshToken?: string }) => void
  logout: () => void
  mockLogin: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseJwtPayload(idToken: string): any | null {
  try {
    const base64Url = idToken.split(".")[1]
    if (!base64Url) return null

    // base64url -> base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "===".slice((base64.length + 3) % 4)

    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

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
    // 1) 저장된 인증 상태 로드 (localStorage 등)
    const savedAuth = loadAuth<AuthState>()
    if (savedAuth?.isAuthenticated && savedAuth?.user) {
      setAuthState(savedAuth)
      setIsLoading(false)
      return
    }

    // 2) Cognito 로그인 직후: sessionStorage 토큰으로 복원
    try {
      if (typeof window !== "undefined") {
        const idToken = sessionStorage.getItem("id_token")
        const accessToken = sessionStorage.getItem("access_token")
        const refreshToken = sessionStorage.getItem("refresh_token")

        // 토큰이 있으면 "로그인된 상태"로 만든다.
        if (idToken && accessToken) {
          const payload = parseJwtPayload(idToken)

          const email: string | undefined = payload?.email
          const sub: string | undefined = payload?.sub
          const nameFromToken: string | undefined = payload?.name

          const user: User = {
            ...mockUser,
            id: sub || mockUser.id,
            email: email || mockUser.email,
            name: nameFromToken || mockUser.name,
          }

          const newState: AuthState = {
            isAuthenticated: true,
            user,
            accessToken,
            idToken,
            refreshToken,
          }

          setAuthState(newState)
          // 저장소에도 반영해서 새로고침/라우팅에도 안 튕기게
          saveAuth(newState)
        }
      }
    } finally {
      setIsLoading(false)
    }
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
    clearAllData()

    if (typeof window === "undefined") return

    try {
      sessionStorage.removeItem("id_token")
      sessionStorage.removeItem("access_token")
      sessionStorage.removeItem("refresh_token")
      clearCodeVerifier()
      clearOAuthState()

      for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
        const key = sessionStorage.key(i)
        if (key?.startsWith("oauth_code_used:")) {
          sessionStorage.removeItem(key)
        }
      }
    } catch {}

    const logoutUrl = isCognitoConfigured() ? getCognitoLogoutUrl() : "/auth/sign-in"
    window.location.href = logoutUrl
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
