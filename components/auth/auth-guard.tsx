"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { loadCats } from "@/lib/storage"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { cats, activeCatId, isLoading: catLoading } = useActiveCat()
  const { followUpPlan, onboardingCompleted, isLoading: onboardingLoading } = useOnboarding()
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const isLoading = authLoading || catLoading || onboardingLoading

  // 공개 경로
  const isPublicPath = pathname.startsWith("/auth")

  // 온보딩 경로
  const isOnboardingPath = pathname.startsWith("/onboarding")

  // 초기 로드 시 로컬 스토리지 직접 확인
  useEffect(() => {
    if (typeof window === "undefined") return
    
    // 로컬 스토리지에서 직접 cats 확인
    const storedCats = loadCats<any>()
    if (storedCats.length > 0) {
      setInitialCheckDone(true)
    }
  }, [])

  // cats가 로드되면 초기 체크 완료
  useEffect(() => {
    if (cats.length > 0) {
      setInitialCheckDone(true)
    }
  }, [cats])

  useEffect(() => {
    if (isLoading) return

    // 1. 인증 안 되어 있으면 로그인으로
    if (!isAuthenticated && !isPublicPath) {
      router.replace("/auth/sign-in")
      return
    }

    // 로컬 스토리지에서 직접 cats 확인 (컨텍스트보다 먼저 확인)
    const storedCats = typeof window !== "undefined" ? loadCats<any>() : []
    const hasCats = cats.length > 0 || storedCats.length > 0

    // 인증되어 있고 공개 페이지면 (callback 제외) 리디렉션
    if (isAuthenticated && isPublicPath && pathname !== "/auth/callback") {
      if (!hasCats) {
        router.replace("/onboarding/cat")
      } else {
        // 펫이 있으면 무조건 홈으로
        router.replace("/")
      }
      return
    }

    // 인증되어 있지만 온보딩이 안 되어 있을 때
    if (isAuthenticated && !isOnboardingPath && !isPublicPath) {
      // catProfile 없으면 /onboarding/cat
      if (!hasCats) {
        router.replace("/onboarding/cat")
        return
      }
      // 펫이 있으면 홈 접근 허용 (onboardingCompleted 체크 제거)
    }

    // 온보딩 페이지 접근 제어
    if (isAuthenticated && isOnboardingPath) {
      // /onboarding/cat은 펫이 있어도 접근 허용 (새 펫 추가 가능)
      if (pathname === "/onboarding/cat") {
        // 펫이 있고 새 펫 추가 모드가 아니면 홈으로 (선택적)
        // 현재는 항상 접근 허용
        return
      }

      if (pathname === "/onboarding/consent" && !hasCats) {
        router.replace("/onboarding/cat")
        return
      }

      if (pathname === "/onboarding/questions" && !hasCats) {
        router.replace("/onboarding/cat")
        return
      }

      if (pathname === "/onboarding/follow-up") {
        if (!hasCats) {
          router.replace("/onboarding/cat")
          return
        }
        if (!followUpPlan) {
          // followUpPlan이 없으면 홈으로
          router.replace("/")
          return
        }
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    cats,
    activeCatId,
    followUpPlan,
    onboardingCompleted,
    pathname,
    router,
    isPublicPath,
    isOnboardingPath,
  ])

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 인증 안 되어 있고 비공개 페이지면 아무것도 렌더링하지 않음
  if (!isAuthenticated && !isPublicPath) {
    return null
  }

  return <>{children}</>
}
