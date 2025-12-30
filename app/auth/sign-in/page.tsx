"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { getCognitoLoginUrl, isCognitoConfigured } from "@/lib/cognito"
import { Cat, Chrome, Mail, Shield, Zap } from "lucide-react"

type LoginResponse = {
  idToken: string
  accessToken: string
  refreshToken?: string | null
  expiresIn?: number | null
  message?: string
}

function parseJwtPayload(idToken: string): { sub?: string; email?: string; name?: string } | null {
  try {
    const base64Url = idToken.split(".")[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "===".slice((base64.length + 3) % 4)

    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export default function SignInPage() {
  const router = useRouter()
  const { login, mockLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const cognitoEnabled = isCognitoConfigured()
  const canContinue = agreeTerms && agreePrivacy
  const canSubmit = canContinue && email.trim().length > 0 && password.length > 0

  const handleGoogleLogin = async () => {
    if (!canContinue) return
    setIsLoading(true)
    setError(null)
    try {
      const loginUrl = await getCognitoLoginUrl({ provider: "Google" })
      window.location.href = loginUrl
    } catch (error) {
      console.error("Cognito login error:", error)
      setIsLoading(false)
    }
  }

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canContinue) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError("이메일과 비밀번호를 입력해주세요.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail, password }),
      })

      const data = (await response.json()) as LoginResponse
      if (!response.ok) {
        setError(data.message || "로그인에 실패했어요.")
        setIsLoading(false)
        return
      }

      const payload = parseJwtPayload(data.idToken)
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
      } catch {}

      router.replace("/onboarding/cat")
    } catch (error) {
      const message = error instanceof Error ? error.message : "로그인에 실패했어요."
      setError(message)
      setIsLoading(false)
    }
  }

  const handleMockLogin = () => {
    if (!canContinue) return
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Are You Okat?</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            오늘도 괜찮은지,
            <br />
            기록으로 먼저 알아봐요.
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-safe-bottom">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">시작하기</CardTitle>
            <CardDescription>고양이 건강 기록을 시작해보세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="agreeTerms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
                    서비스 이용약관 동의(필수)
                  </Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs">
                        내용 보기
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>서비스 이용약관</DialogTitle>
                        <DialogDescription>
                          서비스 이용약관의 주요 내용을 안내합니다. 자세한 내용은 추후 업데이트됩니다.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button">확인</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="agreePrivacy"
                  checked={agreePrivacy}
                  onCheckedChange={(checked) => setAgreePrivacy(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="agreePrivacy" className="text-sm leading-relaxed">
                    개인정보 수집·이용 동의(필수)
                  </Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs">
                        내용 보기
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>개인정보 수집·이용 안내</DialogTitle>
                        <DialogDescription>
                          입력하신 정보는 기록 및 헬스 체크 경험 제공을 위해 사용됩니다.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button">확인</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {cognitoEnabled ? (
              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={!canContinue || isLoading}
                  className="w-full h-12"
                  size="lg"
                >
                  <Chrome className="w-5 h-5 mr-2" />
                  {isLoading ? "로그인 중..." : "Google로 계속하기"}
                </Button>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>또는</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={handlePasswordLogin} className="space-y-3">
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
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <Button type="submit" disabled={!canSubmit || isLoading} className="w-full h-12" size="lg">
                    <Mail className="w-5 h-5 mr-2" />
                    {isLoading ? "로그인 중..." : "이메일로 로그인"}
                  </Button>
                </form>
              </div>
            ) : (
              <Button onClick={handleMockLogin} disabled={!canContinue || isLoading} className="w-full h-12" size="lg">
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

      <footer className="flex-shrink-0 px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          로그인은 <span className="underline cursor-pointer">이용약관</span> 및{" "}
          <span className="underline cursor-pointer">개인정보 처리방침</span>에 동의하는 것으로 간주됩니다.
        </p>
      </footer>
    </div>
  )
}
