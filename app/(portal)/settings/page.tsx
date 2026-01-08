"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import {
  Bell,
  Cat,
  LogOut,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react"

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { activeCat, cats } = useActiveCat()
  const { shelterShareOptIn } = useOnboarding()
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

  const careShareEndAt =
    activeCat?.dataSharing?.expiresAt ? new Date(activeCat.dataSharing.expiresAt).getTime() : activeCat?.careShareEndAt
  const now = Date.now()
  const isSharePeriodExpired = typeof careShareEndAt === "number" && careShareEndAt < now
  const shareActive =
    activeCat?.dataSharing?.enabled != null
      ? activeCat.dataSharing.enabled && !isSharePeriodExpired
      : (isAgencyAdoption && !isSharePeriodExpired) || shelterShareOptIn
  const notificationsEnabled = user?.notificationsEnabled ?? true
  const alertStatusLabel = notificationsEnabled ? "켬" : "끔"
  const coCareActive = shareActive
  const coCareStatusLabel = coCareActive ? "참여 중" : "미참여"

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
                      <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={(enabled) => updateUser({ notificationsEnabled: enabled })}
                      />
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
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={`${user?.name || "집사님"} 프로필`} className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{user?.name || "집사님"}</p>
                  <p className="text-base text-muted-foreground">{user?.email || "demo@areyouokat.com"}</p>
                </div>
              </div>
              <Button asChild variant="outline" size="default" className="text-base">
                <Link href="/settings/profile">프로필 편집</Link>
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">로그인 방식</p>
                  </div>
                </div>
                <span className="rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  {loginMethodLabel}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Cat className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">연결된 고양이</p>
                  </div>
                </div>
                <span className="rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  {catCount}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">이상 신호 알림 받기</p>
                  </div>
                </div>
                <span className="rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  {alertStatusLabel}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">공동 케어 참여</p>
                    <p className="text-xs text-muted-foreground">입양 기관과 함께 관리</p>
                  </div>
                </div>
                <span className="rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  {coCareStatusLabel}
                </span>
              </div>

            </div>

            <div className="border-t border-border/60 pt-4 space-y-2">
              <Button asChild variant="outline" className="w-full bg-transparent text-base" size="lg">
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
        </div>
      </main>
    </div>
  )
}
