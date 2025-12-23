"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useCatProfile } from "@/contexts/cat-profile-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { exchangeCodeForTokens, parseIdToken } from "@/lib/cognito"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const { catProfile } = useCatProfile()
  const { onboardingAnswers, followUpPlan, followUpAnswers } = useOnboarding()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("code")
    const errorParam = searchParams.get("error")

    if (errorParam) {
      setError(`인증 오류: ${errorParam}`)
      return
    }

    if (!code) {
      setError("인증 코드가 없습니다.")
      return
    }

    const handleCallback = async () => {
      try {
        const tokens = await exchangeCodeForTokens(code)

        if (!tokens) {
          setError("토큰 교환에 실패했습니다.")
          return
        }

        const userInfo = parseIdToken(tokens.idToken)

        if (!userInfo) {
          setError("사용자 정보를 가져올 수 없습니다.")
          return
        }

        // 로그인 처리
        login(
          {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
          },
          tokens,
        )

        // 온보딩 상태에 따라 라우팅
        if (!catProfile) {
          router.replace("/onboarding/cat")
        } else if (!onboardingAnswers) {
          router.replace("/onboarding/consent")
        } else if (followUpPlan && !followUpAnswers) {
          router.replace("/onboarding/follow-up")
        } else {
          router.replace("/")
        }
      } catch (err) {
        console.error("Callback error:", err)
        setError("로그인 처리 중 오류가 발생했습니다.")
      }
    }

    handleCallback()
  }, [searchParams, login, router, catProfile, onboardingAnswers, followUpPlan, followUpAnswers])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">오류 발생</span>
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button asChild variant="outline">
          <Link href="/auth/sign-in">다시 로그인하기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">로그인 처리 중...</p>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">로딩 중...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
