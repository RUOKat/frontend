"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { useWebView } from "@/contexts/webview-context"
import { getMediaUrl } from "@/lib/backend"
import { updateCameraSettings } from "@/lib/backend-users"
import { useState, useEffect } from "react"
import {
  Bell,
  Camera,
  Cat,
  LogOut,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react"

export default function SettingsPage() {
  const { user, updateUser, accessToken, idToken } = useAuth()
  const { activeCat, cats } = useActiveCat()
  const { shelterShareOptIn } = useOnboarding()
  const { isWebView, appEnv, tokens } = useWebView()
  const isDev = process.env.NODE_ENV === "development"
  
  const [cameraEnabled, setCameraEnabled] = useState(user?.cameraEnabled ?? false)

  useEffect(() => {
    setCameraEnabled(user?.cameraEnabled ?? false)
  }, [user?.cameraEnabled])

  const handleCameraToggle = async (enabled: boolean) => {
    setCameraEnabled(enabled)
    const success = await updateCameraSettings(enabled)
    if (success) {
      // 사용자 정보 업데이트
      updateUser({ cameraEnabled: enabled })
    } else {
      // 실패 시 원래 상태로 되돌림
      setCameraEnabled(!enabled)
    }
  }

  const catCount = cats.length
  const loginMethodLabel = user?.email ? "이메일" : "데모"
  const truncatedName = user?.name && user.name.length > 15 ? `${user.name.slice(0, 15)}...` : user?.name || "집사님"

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

  const careShareEndAt = activeCat?.dataSharing?.expiresAt || activeCat?.careShareEndAt
  const careShareEndAtTime = careShareEndAt ? new Date(careShareEndAt).getTime() : null
  const now = Date.now()
  const isSharePeriodExpired = careShareEndAtTime !== null && careShareEndAtTime < now
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
                    
                    <div className="border-t border-border/60 pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Camera className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">펫캠 사용</p>
                            <p className="text-xs text-muted-foreground">영상 촬영 및 업로드 기능</p>
                          </div>
                        </div>
                        <Switch
                          checked={cameraEnabled}
                          onCheckedChange={handleCameraToggle}
                        />
                      </div>
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
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user?.profilePhoto ? (
                    <img src={getMediaUrl(user.profilePhoto)} alt={`${user?.name || "집사님"} 프로필`} className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-foreground">{truncatedName}</p>
                    <Button asChild variant="outline" size="sm" className="text-xs h-8 px-3">
                      <Link href="/settings/profile">프로필 편집</Link>
                    </Button>
                  </div>
                  <p className="text-base text-muted-foreground">{user?.email || "demo@areyouokat.com"}</p>
                </div>
              </div>
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

        {/* 개발환경 디버깅 섹션 */}
        {isDev && (
          <Card className="border-dashed border-yellow-500 bg-yellow-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-yellow-700 flex items-center gap-2">
                🛠️ 개발 디버깅 (Dev Only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-yellow-800">환경:</span>
                  <span className={`px-2 py-0.5 rounded text-white ${isWebView ? "bg-blue-500" : "bg-gray-500"}`}>
                    {isWebView ? "📱 WebView" : "🌐 Browser"}
                  </span>
                </div>

                {appEnv && (
                  <div className="bg-white/70 rounded p-2 space-y-1">
                    <p><span className="font-medium">Platform:</span> {appEnv.platform}</p>
                    <p><span className="font-medium">App Version:</span> {appEnv.appVersion}</p>
                    <p><span className="font-medium">Network:</span> {appEnv.networkState}</p>
                  </div>
                )}

                <div className="bg-white/70 rounded p-2 space-y-2">
                  <div>
                    <p className="font-medium text-yellow-800 mb-1">ACCESS_TOKEN:</p>
                    <code className="block text-[10px] bg-gray-100 p-1.5 rounded break-all max-h-16 overflow-auto">
                      {accessToken || "(없음)"}
                    </code>
                  </div>

                  <div>
                    <p className="font-medium text-yellow-800 mb-1">ID_TOKEN:</p>
                    <code className="block text-[10px] bg-gray-100 p-1.5 rounded break-all max-h-16 overflow-auto">
                      {idToken || "(없음)"}
                    </code>
                  </div>

                  <div>
                    <p className="font-medium text-yellow-800 mb-1">APP_TOKEN:</p>
                    <code className="block text-[10px] bg-gray-100 p-1.5 rounded break-all max-h-16 overflow-auto">
                      {tokens.appToken || "(없음)"}
                    </code>
                  </div>

                  <div>
                    <p className="font-medium text-yellow-800 mb-1">EXPO_PUSH_TOKEN:</p>
                    <code className="block text-[10px] bg-gray-100 p-1.5 rounded break-all max-h-16 overflow-auto">
                      {tokens.expoPushToken || "(없음)"}
                    </code>
                  </div>

                  <div>
                    <p className="font-medium text-yellow-800 mb-1">DEVICE_ID:</p>
                    <code className="block text-[10px] bg-gray-100 p-1.5 rounded break-all max-h-16 overflow-auto">
                      {tokens.deviceId || "(없음)"}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
