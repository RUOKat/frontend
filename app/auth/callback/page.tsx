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
    if (ranRef.current) return
    ranRef.current = true

    if (error) {
      setStatus("error")
      setMessage(`로그인 오류: ${error}${errorDescription ? ` (${decodeURIComponent(errorDescription)})` : ""}`)
      return
    }

    if (!code) {
      setStatus("error")
      setMessage("로그인 코드가 없습니다. 다시 시도해주세요.")
      return
    }

    const usedKey = `oauth_code_used:${code}`
    if (typeof window !== "undefined" && sessionStorage.getItem(usedKey)) {
      setStatus("error")
      setMessage("이미 처리된 로그인 코드입니다. 다시 로그인해주세요.")
      return
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem(usedKey, "1")
    }

    const verifier = typeof window !== "undefined" ? sessionStorage.getItem("pkce_code_verifier") : null
    if (!verifier) {
      setStatus("error")
      setMessage("PKCE 검증 정보가 없습니다. 다시 로그인해주세요.")
      return
    }

    ;(async () => {
      setStatus("exchanging")
      setMessage("로그인 정보를 확인 중입니다...")

      const tokens = await exchangeCodeForTokens(code)
      if (!tokens) {
        setStatus("error")
        setMessage("로그인 토큰 교환에 실패했습니다. 다시 로그인해주세요.")
        return
      }

      try {
        sessionStorage.setItem("access_token", tokens.accessToken)
        sessionStorage.setItem("id_token", tokens.idToken)
        sessionStorage.setItem("refresh_token", tokens.refreshToken)
      } catch {}

      setStatus("success")
      setMessage("로그인 완료! 이동 중입니다...")

      router.replace("/onboarding/cat")
    })()
  }, [code, error, errorDescription, router])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white/70 p-6 shadow">
        <h1 className="text-lg font-semibold mb-2">로그인 처리</h1>

        {status === "exchanging" && <p>{message}</p>}
        {status === "success" && <p>{message}</p>}
        {status === "error" && (
          <>
            <p className="text-red-600">{message}</p>
            <button
              className="mt-4 w-full rounded-lg border px-4 py-2"
              onClick={() => router.replace("/auth/sign-in")}
            >
              다시 로그인하기
            </button>
          </>
        )}

        {status === "idle" && <p>처리 중...</p>}
      </div>
    </main>
  )
}
