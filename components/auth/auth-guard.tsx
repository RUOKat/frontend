"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
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
  const isLoading = authLoading || catLoading || onboardingLoading

  // 공개 경로
  const isPublicPath = pathname.startsWith("/auth")

  // 온보딩 경로
  const isOnboardingPath = pathname.startsWith("/onboarding")

  useEffect(() => {
    if (isLoading) return

    // 1. 인증 안 되어 있으면 로그인으로
    if (!isAuthenticated && !isPublicPath) {
      router.replace("/auth/sign-in")
      return
    }

    // 인증되어 있고 공개 페이지면 온보딩 상태에 따라 리디렉션
    if (isAuthenticated && isPublicPath && pathname !== "/auth/callback") {
        if (cats.length === 0) {
          router.replace("/onboarding/cat")
        } else if (!onboardingCompleted) {
          router.replace("/onboarding/consent")
        } else {
          router.replace("/")
      }
      return
    }

    // 인증되어 있지만 온보딩이 안 되어 있을 때
    if (isAuthenticated && !isOnboardingPath && !isPublicPath) {
      // 2. catProfile 없으면 /onboarding/cat
      if (cats.length === 0) {
        router.replace("/onboarding/cat")
        return
      }

      // 3. consent 완료 전이면 /onboarding/consent
      if (!onboardingCompleted) {
        router.replace("/onboarding/consent")
        return
      }
    }

    // 온보딩 페이지 접근 제어
    if (isAuthenticated && isOnboardingPath) {
      if (pathname === "/onboarding/consent" && cats.length === 0) {
        router.replace("/onboarding/cat")
        return
      }

      if (pathname === "/onboarding/questions" && cats.length === 0) {
        router.replace("/onboarding/cat")
        return
      }

      if (pathname === "/onboarding/follow-up") {
        if (cats.length === 0) {
          router.replace("/onboarding/cat")
          return
        }
        if (!onboardingCompleted) {
          router.replace("/onboarding/consent")
          return
        }
        if (!followUpPlan) {
          // followUpPlan이 없으면 홈으로
          router.replace("/")
          return
        }
      }

      if (pathname === "/onboarding/questions" && !onboardingCompleted) {
        router.replace("/onboarding/consent")
        return
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
