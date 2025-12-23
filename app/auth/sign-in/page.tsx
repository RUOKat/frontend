"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { isCognitoConfigured, getCognitoLoginUrl } from "@/lib/cognito"
import { Cat, LogIn, Zap, Shield } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const { mockLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const cognitoEnabled = isCognitoConfigured()
  const canContinue = agreeTerms && agreePrivacy

  const handleCognitoLogin = async () => {
    if (!canContinue) return
    setIsLoading(true)
    try {
      const loginUrl = await getCognitoLoginUrl()
      window.location.href = loginUrl
    } catch (error) {
      console.error("Cognito login error:", error)
      setIsLoading(false)
    }
  }

  const handleMockLogin = () => {
    if (!canContinue) return
    setIsLoading(true)
    mockLogin()
    // 온보딩 상태에 따라 AuthGuard가 리디렉션
    router.push("/onboarding/cat")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      {/* 헤더 */}
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

      {/* 메인 */}
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
                          서비스 이용을 위한 기본 약관입니다. 자세한 내용은 추후 업데이트될 예정입니다.
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
                          입력하신 정보는 기록과 체크 경험을 제공하기 위해 사용됩니다. 자세한 내용은 추후 업데이트될 예정입니다.
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
              <Button onClick={handleCognitoLogin} disabled={!canContinue || isLoading} className="w-full h-12" size="lg">
                <LogIn className="w-5 h-5 mr-2" />
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            ) : (
              <Button onClick={handleMockLogin} disabled={!canContinue || isLoading} className="w-full h-12" size="lg">
                <Zap className="w-5 h-5 mr-2" />
                {isLoading ? "로그인 중..." : "개발용 빠른 로그인"}
              </Button>
            )}

            {cognitoEnabled && (
              <Button
                onClick={handleMockLogin}
                disabled={!canContinue || isLoading}
                variant="outline"
                className="w-full h-12 bg-transparent"
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                개발용 빠른 로그인 (Mock)
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 개인정보 안내 */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>데이터는 기기에만 저장됩니다</span>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="flex-shrink-0 px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          로그인 시 <span className="underline cursor-pointer">이용약관</span> 및{" "}
          <span className="underline cursor-pointer">개인정보 처리방침</span>에 동의합니다.
        </p>
      </footer>
    </div>
  )
}
