"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { exchangeCodeForTokens } from "@/lib/cognito"

export default function CallbackPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const code = useMemo(() => sp.get("code"), [sp])
  const error = useMemo(() => sp.get("error"), [sp])
  const errorDescription = useMemo(() => sp.get("error_description"), [sp])

  const ranRef = useRef(false)
  const [status, setStatus] = useState<"idle" | "exchanging" | "success" | "error">("idle")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    // dev(StrictMode)에서 useEffect 2번 실행 방지
    if (ranRef.current) return
    ranRef.current = true

    // Cognito가 error로 돌려준 경우
    if (error) {
      setStatus("error")
      setMessage(`인증 오류: ${error}${errorDescription ? ` (${decodeURIComponent(errorDescription)})` : ""}`)
      return
    }

    if (!code) {
      setStatus("error")
      setMessage("인증 코드(code)가 없습니다. 다시 로그인 해주세요.")
      return
    }

    // 같은 code로 중복 교환 방지 (code는 1회용)
    const usedKey = `oauth_code_used:${code}`
    if (typeof window !== "undefined" && sessionStorage.getItem(usedKey)) {
      setStatus("error")
      setMessage("이미 처리된 로그인 요청입니다. 다시 로그인 해주세요.")
      return
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(usedKey, "1")
    }

    // PKCE verifier 없으면 토큰 교환 불가
    const verifier = typeof window !== "undefined" ? sessionStorage.getItem("pkce_code_verifier") : null
    if (!verifier) {
      setStatus("error")
      setMessage("PKCE 코드가 없습니다(세션이 초기화됨). 로그인부터 다시 진행해주세요.")
      return
    }

    ;(async () => {
      setStatus("exchanging")
      setMessage("토큰 교환 중...")

      const tokens = await exchangeCodeForTokens(code)
      if (!tokens) {
        setStatus("error")
        setMessage("토큰 교환에 실패했습니다. (invalid_grant이면 보통 code 재사용/중복 실행 문제입니다)")
        return
      }

      // ✅ MVP 임시 저장 (추후 쿠키/BFF로 바꿀 수 있음)
      try {
        sessionStorage.setItem("access_token", tokens.accessToken)
        sessionStorage.setItem("id_token", tokens.idToken)
        sessionStorage.setItem("refresh_token", tokens.refreshToken)
      } catch {}

      setStatus("success")
      setMessage("로그인 성공! 이동 중...")

      // code 파라미터 제거하고 다음 단계로 이동
      router.replace("/onboarding/cat")
    })()
  }, [code, error, errorDescription, router])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white/70 p-6 shadow">
        <h1 className="text-lg font-semibold mb-2">로그인 처리</h1>

        {status === "exchanging" && <p>⏳ {message}</p>}
        {status === "success" && <p>✅ {message}</p>}
        {status === "error" && (
          <>
            <p className="text-red-600">❌ {message}</p>
            <button
              className="mt-4 w-full rounded-lg border px-4 py-2"
              onClick={() => router.replace("/auth/sign-in")}
            >
              다시 로그인하기
            </button>
          </>
        )}

        {status === "idle" && <p>대기 중...</p>}
      </div>
    </main>
  )
}