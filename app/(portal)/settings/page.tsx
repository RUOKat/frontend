"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useCatProfile } from "@/contexts/cat-profile-context"
import { Cat, User, LogOut, ChevronRight, FileText, Stethoscope, Camera } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const { catProfile } = useCatProfile()

  const menuItems = [
    {
      icon: Cat,
      label: "고양이 프로필",
      description: catProfile?.name || "프로필 설정",
      href: "/onboarding/cat",
    },
    {
      icon: Stethoscope,
      label: "진료 기록",
      description: "병원 방문 기록",
      href: "/vet-history",
    },
    {
      icon: Camera,
      label: "웹캠 모니터링",
      description: "실시간 관찰",
      href: "/webcam",
    },
    {
      icon: FileText,
      label: "리포트",
      description: "건강 분석 리포트",
      href: "/report",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top">
        <div className="py-6">
          <h1 className="text-xl font-bold text-foreground">설정</h1>
        </div>
      </header>

      {/* 메인 */}
      <main className="px-6 pb-6 space-y-6">
        {/* 사용자 정보 */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{user?.name || "집사님"}</p>
                <p className="text-sm text-muted-foreground">{user?.email || "demo@areyouokat.com"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 메뉴 */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 로그아웃 */}
        <Button asChild variant="outline" className="w-full bg-transparent" size="lg">
          <Link href="/auth/sign-out">
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Link>
        </Button>

        {/* 앱 정보 */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">Are You Okat? v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">고양이 건강 기록 앱</p>
        </div>
      </main>
    </div>
  )
}
