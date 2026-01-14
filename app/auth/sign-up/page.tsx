"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
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
import { isCognitoConfigured, signUp } from "@/lib/cognito"
import { Cat, Shield, UserPlus, Zap } from "lucide-react"

function getSignUpErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "회원가입에 실패했어요."
  if (error.message.includes("Cognito 환경 변수")) {
    return "현재는 회원가입을 사용할 수 없어요. 로그인으로 진행해주세요."
  }
  switch (error.name) {
    case "UsernameExistsException":
      return "이미 가입된 이메일이에요. 로그인해 주세요."
    case "InvalidPasswordException":
      return "비밀번호는 8자 이상이며 알파벳 소문자와 숫자를 포함해야 해요."
    case "InvalidParameterException":
      return "입력한 정보를 다시 확인해주세요."
    case "CodeDeliveryFailureException":
      return "인증 메일 전송에 실패했어요. 잠시 후 다시 시도해주세요."
    case "TooManyRequestsException":
    case "LimitExceededException":
      return "요청이 너무 많아요. 잠시 후 다시 시도해주세요."
    default:
      return error.message || "회원가입에 실패했어요."
  }
}

export default function SignUpPage() {
  const router = useRouter()
  const { mockLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const cognitoEnabled = isCognitoConfigured()
  const canContinue = agreeTerms && agreePrivacy
  const canSubmit = canContinue && email.trim().length > 0 && password.length > 0 && confirmPassword.length > 0

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canContinue) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError("이메일과 비밀번호를 입력해주세요.")
      return
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 서로 달라요.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await signUp(trimmedEmail, password)
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("pending_signup_email", trimmedEmail)
          sessionStorage.setItem("pending_signup_password", password)
          if (result.codeDeliveryDetails?.destination) {
            sessionStorage.setItem("pending_signup_destination", result.codeDeliveryDetails.destination)
          }
        } catch {}
      }
      router.push(`/auth/verify?email=${encodeURIComponent(trimmedEmail)}`)
    } catch (error) {
      setError(getSignUpErrorMessage(error))
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
            <CardTitle className="text-lg">회원가입</CardTitle>
            <CardDescription>이메일로 계정을 만들어보세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cognitoEnabled ? (
              <div className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-3">
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
                      autoComplete="new-password"
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="agreeTerms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 flex items-center justify-between gap-3">
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
                      <div className="flex-1 flex items-center justify-between gap-3">
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
                  <Button type="submit" disabled={!canSubmit || isLoading} className="w-full h-12" size="lg">
                    <UserPlus className="w-5 h-5 mr-2" />
                    {isLoading ? "처리 중..." : "인증 코드 받기"}
                  </Button>
                </form>

                <div className="text-center text-xs text-muted-foreground">
                  이미 계정이 있나요?{" "}
                  <Link href="/auth/sign-in" className="underline">
                    로그인
                  </Link>
                </div>
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

      <footer className="flex-shrink-0 px-6 py-4 text-center" />
    </div>
  )
}
