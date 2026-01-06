"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { confirmSignUp, isCognitoConfigured, parseIdToken } from "@/lib/cognito"
import { Cat, Shield, Zap } from "lucide-react"

type LoginResponse = {
  idToken: string
  accessToken: string
  refreshToken?: string | null
  expiresIn?: number | null
  message?: string
}

function getConfirmErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "인증에 실패했어요."
  if (error.message.includes("Cognito 환경 변수")) {
    return "현재는 인증을 진행할 수 없어요. 로그인으로 진행해주세요."
  }
  switch (error.name) {
    case "CodeMismatchException":
      return "인증 코드가 올바르지 않아요."
    case "ExpiredCodeException":
      return "인증 코드가 만료됐어요. 다시 요청해주세요."
    case "UserNotFoundException":
      return "가입 정보를 찾을 수 없어요. 다시 회원가입해주세요."
    case "NotAuthorizedException":
      return "이미 인증이 완료된 계정이에요. 로그인해주세요."
    case "TooManyRequestsException":
    case "LimitExceededException":
      return "요청이 너무 많아요. 잠시 후 다시 시도해주세요."
    default:
      return error.message || "인증에 실패했어요."
  }
}

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, mockLogin } = useAuth()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [destination, setDestination] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cognitoEnabled = isCognitoConfigured()

  const defaultEmail = useMemo(() => searchParams.get("email") || "", [searchParams])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const storedEmail = sessionStorage.getItem("pending_signup_email") || ""
      const storedDestination = sessionStorage.getItem("pending_signup_destination")
      setEmail(defaultEmail || storedEmail)
      setDestination(storedDestination)
    } catch {
      setEmail(defaultEmail)
    }
  }, [defaultEmail])

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const trimmedCode = code.trim()
    if (!trimmedEmail) {
      setError("이메일 정보를 입력해주세요.")
      return
    }
    if (!trimmedCode) {
      setError("인증 코드를 입력해주세요.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await confirmSignUp(trimmedEmail, trimmedCode)
      let storedPassword: string | null = null
      if (typeof window !== "undefined") {
        try {
          storedPassword = sessionStorage.getItem("pending_signup_password")
        } catch {
          storedPassword = null
        }
      }

      if (!storedPassword) {
        setError("인증은 완료됐지만 자동 로그인을 위해 비밀번호가 필요해요. 로그인해주세요.")
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail, password: storedPassword }),
      })

      const data = (await response.json()) as LoginResponse
      if (!response.ok) {
        setError(data.message || "자동 로그인에 실패했어요. 다시 로그인해주세요.")
        setIsLoading(false)
        return
      }

      const payload = parseIdToken(data.idToken)
      const user = {
        id: payload?.sub || trimmedEmail,
        email: payload?.email || trimmedEmail,
        name: payload?.name,
      }

      login(user, {
        accessToken: data.accessToken,
        idToken: data.idToken,
        refreshToken: data.refreshToken || undefined,
      })

      try {
        sessionStorage.setItem("access_token", data.accessToken)
        sessionStorage.setItem("id_token", data.idToken)
        if (data.refreshToken) {
          sessionStorage.setItem("refresh_token", data.refreshToken)
        }
        sessionStorage.removeItem("pending_signup_email")
        sessionStorage.removeItem("pending_signup_password")
        sessionStorage.removeItem("pending_signup_destination")
      } catch {}

      router.replace("/onboarding/cat")
    } catch (error) {
      setError(getConfirmErrorMessage(error))
      setIsLoading(false)
    }
  }

  const handleMockLogin = () => {
    setIsLoading(true)
    setError(null)
    mockLogin()
    router.push("/onboarding/cat")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <header className="flex-shrink-0 pt-safe-top">
        <div className="px-6 pt-12 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Cat className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">이메일 인증</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {destination ? `${destination}로 인증 코드를 보냈어요.` : "이메일로 받은 인증 코드를 입력해주세요."}
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-safe-bottom">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">인증 코드 입력</CardTitle>
            <CardDescription>인증이 완료되면 자동 로그인됩니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cognitoEnabled ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">인증 코드</Label>
                  <InputOTP id="code" maxLength={6} value={code} onChange={setCode} disabled={isLoading}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <Button type="submit" disabled={isLoading || code.trim().length < 6} className="w-full h-12" size="lg">
                  {isLoading ? "확인 중..." : "인증하고 로그인"}
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  계정이 이미 있나요?{" "}
                  <Link href="/auth/sign-in" className="underline">
                    로그인
                  </Link>
                </div>
              </form>
            ) : (
              <Button onClick={handleMockLogin} disabled={isLoading} className="w-full h-12" size="lg">
                <Zap className="w-5 h-5 mr-2" />
                {isLoading ? "로그인 중..." : "개발용 빠른 로그인"}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>개인정보는 기기에서만 저장됩니다</span>
          </div>
        </div>
      </main>
    </div>
  )
}
