"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Calendar as CalendarIcon, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogAction 
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { updateMyProfile } from "@/lib/backend-users"

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const { user, updateUser } = useAuth()
  
  const [showDailyAlert, setShowDailyAlert] = useState(false)

  const dailyEnabled = user?.notificationsEnabled ?? true
  const calendarEnabled = user?.calendarNotificationsEnabled ?? true

  const handleDailyToggle = async (enabled: boolean) => {
    // 낙관적 업데이트
    updateUser({ notificationsEnabled: enabled })
    
    if (enabled) {
      setShowDailyAlert(true)
    }
    
    try {
      // updateMyProfile 활용 (calendarAlarmsEnabled는 백엔드 미지원으로 제외)
      await updateMyProfile({
        alarmsEnabled: enabled,
      })
    } catch (e) {
      // 롤백
      updateUser({ notificationsEnabled: !enabled })
      console.error('알림 설정 업데이트 실패:', e)
    }
  }

  const handleCalendarToggle = async (enabled: boolean) => {
    // 낙관적 업데이트
    updateUser({ calendarNotificationsEnabled: enabled })
    
    try {
      await updateMyProfile({
        alarmsEnabled: dailyEnabled,
      })
    } catch (e) {
      // 롤백
      updateUser({ calendarNotificationsEnabled: !enabled })
      console.error('캘린더 알림 설정 업데이트 실패:', e)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 pt-safe-top bg-background z-10">
        <div className="py-4 flex flex-col relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full w-10 h-10 -ml-2 text-muted-foreground hover:bg-muted/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <h1 className="text-base font-bold text-center w-full">알림 설정</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6">
        <Card className="border-border shadow-sm">
          <CardContent className="p-0 divide-y divide-border/50">
            {/* 오늘의 기록 알림 */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">오늘의 기록 알림 받기</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mr-2">
                    잊지 않고 기록할 수 있도록 매일 저녁 알림을 보내드려요.
                  </p>
                </div>
              </div>
              <Switch
                checked={dailyEnabled}
                onCheckedChange={handleDailyToggle}
                className="mt-1 shrink-0"
              />
            </div>

            {/* 캘린더 일정 알림 */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">캘린더 일정 알림 받기</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mr-2">
                    병원 방문 등 캘린더에 등록한 일정을 잊지 않도록, <strong>일정 전날</strong>과 <strong>당일</strong>에 알림을 보내드려요.
                  </p>
                </div>
              </div>
              <Switch
                checked={calendarEnabled}
                onCheckedChange={handleCalendarToggle}
                className="mt-1 shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-start gap-2 bg-muted/30 p-4 rounded-xl border border-border/50">
          <Bell className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            알림이 오지 않는 경우 기기 설정에서 Are You Okat 앱의 알림이 허용되어 있는지 확인해 주세요.
          </p>
        </div>
      </main>

      <AlertDialog open={showDailyAlert} onOpenChange={setShowDailyAlert}>
        <AlertDialogContent className="w-[90%] max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-lg">알림 설정 완료</AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-2">
              오늘의 기록 알림이 켜졌습니다.<br/>
              이제 하루에 한 번 푸시 알림을 통해 잊지 않고 고양이의 상태를 기록해 보세요!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-4 pt-2 border-t border-border/50">
            <AlertDialogAction className="w-full h-12 rounded-xl" onClick={() => setShowDailyAlert(false)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
