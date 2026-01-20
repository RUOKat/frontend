"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { AuthState, User } from "@/lib/types"
import { saveAuth, loadAuth, clearAuth, clearAllData } from "@/lib/storage"
import { mockUser } from "@/lib/mock"
import { clearCodeVerifier, clearOAuthState, getCognitoLogoutUrl, isCognitoConfigured } from "@/lib/cognito"
import { getMe } from "@/lib/backend-auth"
import { getTokens } from "@/lib/backend"
import { updatePushToken } from "@/lib/backend-users"

interface AuthContextType extends AuthState {
  backendSync: BackendSyncStatus
  login: (user: User | null, tokens?: SessionTokens) => void
  updateUser: (updates: Partial<User>) => void
  clearLocalAuth: () => void
  logout: () => void
  mockLogin: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type SessionTokens = {
  accessToken?: string | null
  idToken?: string | null
  refreshToken?: string | null
}

type BackendSyncStatus = "idle" | "ok" | "error" | "unchanged"

function persistSessionTokens(tokens: SessionTokens): void {
  if (typeof window === "undefined") return
  try {
    if (tokens.accessToken) {
      sessionStorage.setItem("access_token", tokens.accessToken)
    }
    if (tokens.idToken) {
      sessionStorage.setItem("id_token", tokens.idToken)
    }
    if (tokens.refreshToken) {
      sessionStorage.setItem("refresh_token", tokens.refreshToken)
    }
  } catch {}
}

function clearSessionTokens(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem("id_token")
    sessionStorage.removeItem("access_token")
    sessionStorage.removeItem("refresh_token")
  } catch {}
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false
  const maybe = value as { id?: unknown; email?: unknown; name?: unknown; sub?: unknown }
  if (typeof maybe.id !== "string") return false
  if (maybe.email !== undefined && typeof maybe.email !== "string") return false
  if (maybe.name !== undefined && typeof maybe.name !== "string") return false
  if (maybe.sub !== undefined && typeof maybe.sub !== "string") return false
  return true
}

function extractUser(payload: unknown): User | null {
  if (payload && typeof payload === "object") {
    const maybePayload = payload as {
      success?: boolean
      data?: Record<string, unknown>
      user?: unknown
      // 직접 반환된 user 객체의 필드들
      id?: unknown
      sub?: unknown
      email?: unknown
      name?: unknown
    }

    // {success: true, data: {...}} 형식
    if (maybePayload.success === true && maybePayload.data && typeof maybePayload.data === "object") {
      const data = maybePayload.data
      const sub = typeof data.sub === "string" ? data.sub : (typeof data.cognitoSub === "string" ? data.cognitoSub : undefined)
      if (!sub) return null
      const id = typeof data.id === "string" ? data.id : sub
      const email = typeof data.email === "string" ? data.email : undefined
      const name = typeof data.name === "string" ? data.name : undefined
      const nickname = typeof data.nickname === "string" ? data.nickname : undefined
      const phone = typeof data.phone === "string" ? data.phone : (typeof data.phoneNumber === "string" ? data.phoneNumber : undefined)
      const address = typeof data.address === "string" ? data.address : undefined
      const profilePhoto = typeof data.profilePhoto === "string" ? data.profilePhoto : undefined
      const notificationsEnabled = typeof data.alarmsEnabled === "boolean" ? data.alarmsEnabled : true
      
      return { id, sub, email, name, nickname, phone, address, profilePhoto, notificationsEnabled }
    }

    // {user: {...}} 형식
    if ("user" in maybePayload && maybePayload.user) {
      return isUser(maybePayload.user) ? maybePayload.user : null
    }

    // 직접 반환된 user 객체 (백엔드 /auth/me 응답)
    const sub = typeof maybePayload.sub === "string" ? maybePayload.sub : undefined
    if (sub) {
      const data = maybePayload as Record<string, unknown>
      const id = typeof data.id === "string" ? data.id : sub
      const email = typeof data.email === "string" ? data.email : undefined
      const name = typeof data.name === "string" ? data.name : undefined
      const nickname = typeof data.nickname === "string" ? data.nickname : undefined
      const phone = typeof data.phone === "string" ? data.phone : (typeof data.phoneNumber === "string" ? data.phoneNumber : undefined)
      const address = typeof data.address === "string" ? data.address : undefined
      const profilePhoto = typeof data.profilePhoto === "string" ? data.profilePhoto : undefined
      const notificationsEnabled = typeof data.alarmsEnabled === "boolean" ? data.alarmsEnabled : true
      
      return { id, sub, email, name, nickname, phone, address, profilePhoto, notificationsEnabled }
    }
  }

  return isUser(payload) ? payload : null
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
  const [backendSync, setBackendSync] = useState<BackendSyncStatus>("idle")
  const syncErrorShownRef = useRef(false)

  const syncSession = useCallback(
    async (tokens?: SessionTokens) => {
      setIsLoading(true)
      try {
        const payload = await getMe()
        if (!payload) {
          setBackendSync("unchanged")
          return
        }
        const user = extractUser(payload)
        if (!user) {
          setBackendSync("error")
          return
        }

        const accessToken =
          tokens?.accessToken ?? (typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null)
        const idToken = tokens?.idToken ?? (typeof window !== "undefined" ? sessionStorage.getItem("id_token") : null)
        const refreshToken =
          tokens?.refreshToken ?? (typeof window !== "undefined" ? sessionStorage.getItem("refresh_token") : null)

        const storedAuth = loadAuth<AuthState>()
        const storedUser = storedAuth?.user
        // 백엔드 정보를 우선하고, 없는 필드만 로컬 정보로 채움
        const mergedUser = storedUser ? { ...storedUser, ...user } : user
        const newState: AuthState = {
          isAuthenticated: true,
          user: mergedUser,
          accessToken: accessToken ?? null,
          idToken: idToken ?? null,
          refreshToken: refreshToken ?? null,
        }

        setAuthState(newState)
        saveAuth(newState)
        setBackendSync("ok")

        // auth/me 성공 후 push token 전송 (WebView 환경에서만)
        try {
          const expoPushToken = sessionStorage.getItem("expo_push_token") || ""
          const deviceId = sessionStorage.getItem("device_id") || ""
          
          if (expoPushToken) {
            const deviceInfo = deviceId ? { deviceId } : undefined
            await updatePushToken(expoPushToken, deviceInfo)
          }
        } catch (pushError) {
          console.error("푸시 토큰 전송 실패:", pushError)
          // 푸시 토큰 전송 실패는 무시 (로그인은 성공)
        }
        
      } catch (error) {
        const status = typeof error === "object" && error ? (error as { status?: number }).status : undefined
        console.error("Backend sync failed", { status, error })
        
        // 401/403이어도 로컬 토큰이 있으면 일단 로그인 상태 유지
        // (백엔드 연결 문제일 수 있으므로 바로 로그아웃하지 않음)
        const accessToken = tokens?.accessToken ?? (typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null)
        const idToken = tokens?.idToken ?? (typeof window !== "undefined" ? sessionStorage.getItem("id_token") : null)
        
        if (accessToken && idToken) {
          // 토큰이 있으면 로컬 상태 유지
          const storedAuth = loadAuth<AuthState>()
          if (storedAuth?.isAuthenticated && storedAuth?.user) {
            setAuthState(storedAuth)
          }
          setBackendSync("error")
        } else if (status === 401 || status === 403) {
          // 토큰도 없고 인증 실패면 로그아웃
          const newState: AuthState = {
            isAuthenticated: false,
            user: null,
            accessToken: null,
            idToken: null,
            refreshToken: null,
          }
          setAuthState(newState)
          clearAuth()
          clearSessionTokens()

          if (typeof window !== "undefined") {
            window.location.href = "/auth/sign-in"
          }
          setBackendSync("error")
          return
        } else {
          setBackendSync("error")
        }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    const savedAuth = loadAuth<AuthState>()
    if (savedAuth?.isAuthenticated && savedAuth?.user) {
      setAuthState(savedAuth)
    }

    const { accessToken, idToken } = getTokens()
    if (accessToken && idToken) {
      const refreshToken = typeof window !== "undefined" ? sessionStorage.getItem("refresh_token") : null
      void syncSession({ accessToken, idToken, refreshToken })
      return
    }

    setIsLoading(false)
    return
    /*
    // ✅ /auth/sign-in에서는 "자동 로그인 복구"를 하지 않음 (Hosted UI 콜백/JWT 확인을 위해)
    // - sign-in 화면에서 저장된 세션으로 자동 리다이렉트되는 문제를 방지
    if (typeof window !== "undefined") {
      const path = window.location.pathname
      if (path === "/auth/sign-in") {
        setIsLoading(false)
        return
      }
    }

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
    */
  }, [syncSession])

  const login = useCallback(
    (user: User | null, tokens?: SessionTokens) => {
      const accessToken = tokens?.accessToken ?? null
      const idToken = tokens?.idToken ?? null
      const refreshToken = tokens?.refreshToken ?? null

      if (accessToken && idToken) {
        persistSessionTokens({ accessToken, idToken, refreshToken })
        void syncSession({ accessToken, idToken, refreshToken })
      }

      if (user) {
        const newState: AuthState = {
          isAuthenticated: true,
          user,
          accessToken,
          idToken,
          refreshToken,
        }
        setAuthState(newState)
        saveAuth(newState)
      }
    },
    [syncSession],
  )

  const updateUser = useCallback((updates: Partial<User>) => {
    setAuthState((prev) => {
      if (!prev.user) return prev
      const nextUser = { ...prev.user, ...updates }
      const nextState = { ...prev, user: nextUser }
      saveAuth(nextState)
      return nextState
    })
  }, [])

  const clearLocalAuth = useCallback(() => {
    const newState: AuthState = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      idToken: null,
      refreshToken: null,
    }
    setAuthState(newState)
    clearAuth()
    clearSessionTokens()
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("access_token")
        localStorage.removeItem("id_token")
        localStorage.removeItem("refresh_token")
      } catch {}
    }
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

    // WebView 환경에서는 앱으로 로그아웃 요청
    const isWebView = !!(window as any).ReactNativeWebView
    if (isWebView) {
      try {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOGOUT_REQUEST',
        }))
        // 로그인 페이지로 이동
        window.location.href = "/auth/sign-in"
        return
      } catch (e) {
        console.error('WebView 로그아웃 요청 실패:', e)
      }
    }

    // // 웹 브라우저 환경에서는 Cognito 로그아웃
    // const logoutUrl = isCognitoConfigured() ? getCognitoLogoutUrl() : "/auth/sign-in"
    window.location.href = "/auth/sign-in"
  }, [])

  const mockLogin = useCallback(() => {
    login(mockUser)
  }, [login])

  const value = useMemo(
    () => ({
      ...authState,
      backendSync,
      login,
      updateUser,
      clearLocalAuth,
      logout,
      mockLogin,
      isLoading,
    }),
    [authState, backendSync, login, updateUser, clearLocalAuth, logout, mockLogin, isLoading],
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
