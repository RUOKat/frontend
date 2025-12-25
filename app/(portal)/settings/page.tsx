"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { CatSelector } from "@/components/app/cat-selector"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import {
  Bell,
  Camera,
  Cat,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  PlusCircle,
  Share2,
  Settings,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react"

const shareLevelLabel = {
  signal: "상태 신호만",
  summary: "상태 요약",
  full: "원문 응답 포함",
} as const

function formatDate(timestamp?: number) {
  if (!timestamp) return ""
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}.${month}.${day}`
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { activeCat, cats } = useActiveCat()
  const { shelterShareOptIn, shareLevel } = useOnboarding()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [alertPriority, setAlertPriority] = useState("important")

  const catCount = cats.length
  const loginMethodLabel = user?.email ? "이메일" : "데모"

  const adoptionPathLabel = activeCat?.adoptionPath?.toLowerCase() ?? ""
  const adoptionSource = activeCat?.adoptionSource
  const hasAgencyCode = Boolean(activeCat?.agencyCode?.trim() || activeCat?.adoptionAgencyCode?.trim())
  const isAgencyAdoption =
    adoptionSource === "shelter" ||
    adoptionSource === "agency" ||
    (hasAgencyCode &&
      (adoptionPathLabel.includes("보호소") ||
        adoptionPathLabel.includes("입양기관") ||
        adoptionPathLabel.includes("agency") ||
        adoptionPathLabel.includes("shelter")))

  const careShareStartAt = activeCat?.careShareStartAt
  const careShareEndAt =
    activeCat?.dataSharing?.expiresAt ? new Date(activeCat.dataSharing.expiresAt).getTime() : activeCat?.careShareEndAt
  const now = Date.now()
  const isSharePeriodExpired = typeof careShareEndAt === "number" && careShareEndAt < now
  const shareActive =
    activeCat?.dataSharing?.enabled != null
      ? activeCat.dataSharing.enabled && !isSharePeriodExpired
      : (isAgencyAdoption && !isSharePeriodExpired) || shelterShareOptIn
  const shareStatusLabel = isSharePeriodExpired ? "종료됨" : shareActive ? "공유 중" : "선택 안 함"
  const shareRangeLabel = shareActive ? shareLevelLabel[shareLevel] : "미설정"
  const carePeriodLabel =
    isAgencyAdoption && careShareStartAt && careShareEndAt
      ? `${formatDate(careShareStartAt)} ~ ${formatDate(careShareEndAt)}`
      : isAgencyAdoption
        ? "1년 공동 케어"
        : "기본 제공"

  const catManagementItems = [
    {
      icon: Cat,
      label: "고양이 프로필 보기/수정",
      description: activeCat?.name ? `${activeCat.name} 프로필` : "프로필 설정",
      href: "/onboarding/cat",
    },
    {
      icon: PlusCircle,
      label: "고양이 추가/전환",
      description: "멀티캣 기능 준비 중",
      href: "/onboarding/cat?mode=new",
    },
  ]

  const careItems = [
    {
      icon: ClipboardList,
      label: "병원 방문 기록",
      description: "방문 기록 정리",
      href: "/vet-history",
    },
    {
      icon: FileText,
      label: "리포트",
      description: "상태 요약 리포트",
      href: "/report",
    },
    {
      icon: Camera,
      label: "웹캠 모니터링",
      description: "실시간 관찰",
      href: "/webcam",
    },
  ]

  const accountItems = [
    {
      icon: ShieldCheck,
      label: "개인정보 처리 안내",
      description: "수집·이용 및 보관 정책",
      href: "/settings#privacy",
    },
    {
      icon: Trash2,
      label: "계정 삭제 요청",
      description: "요청 접수 안내",
      href: "/settings#account-delete",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-safe-top">
        <div className="py-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">프로필</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full size-12" aria-label="앱 설정 열기">
                <Settings className="w-7 h-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card text-card-foreground">
              <SheetHeader>
                <SheetTitle>앱 설정</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6 space-y-4">
                <Card>
                  <CardContent className="py-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Bell className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">알림 받기</p>
                          <p className="text-xs text-muted-foreground">필요한 안내만 간단히 보내드려요.</p>
                        </div>
                      </div>
                      <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">이상 신호 알림 우선순위(선택)</p>
                        <p className="text-xs text-muted-foreground">중요한 변화부터 알려드릴 수 있어요.</p>
                      </div>
                      <Select value={alertPriority} onValueChange={setAlertPriority} disabled={!notificationsEnabled}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="important">중요 알림 우선</SelectItem>
                          <SelectItem value="standard">표준</SelectItem>
                          <SelectItem value="all">전체 알림</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="px-6 pb-6 space-y-8">
        <Card>
          <CardContent className="py-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{user?.name || "집사님"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "demo@areyouokat.com"}</p>
                </div>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">프로필 편집</Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-card text-card-foreground">
                  <SheetHeader>
                    <SheetTitle>집사님 프로필</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-6 space-y-2">
                    {accountItems.map((item) => (
                      <Link key={item.label} href={item.href}>
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
                </SheetContent>
              </Sheet>
            </div>

            <div className="grid gap-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>로그인 방식</span>
                <span className="text-foreground">{loginMethodLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>대표 고양이</span>
                <span className="text-foreground">{activeCat?.name || "미설정"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>연결된 고양이</span>
                <span className="text-foreground">{catCount}마리</span>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4 space-y-2">
              <Button asChild variant="outline" className="w-full bg-transparent" size="lg">
                <Link href="/auth/sign-out">
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">Are You Okat? v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">고양이 케어 기록 앱</p>
        </div>
      </main>
    </div>
  )
}
