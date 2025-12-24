"use client"

import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckinPopup } from "@/components/app/checkin-popup"
import { RiskCard } from "@/components/app/risk-card"
import { CatSelector } from "@/components/app/cat-selector"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { getMonthlyCareForDate, type MonthlyCareRecord } from "@/lib/care-monthly"
import { Calendar, Gift, MessageCircle, ExternalLink, Bell } from "lucide-react"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { activeCat, activeCatId } = useActiveCat()
  const { riskStatus } = useOnboarding()
  const [monthlyCare, setMonthlyCare] = useState<MonthlyCareRecord>({
    completedDays: [],
    streak: 0,
    completionRate: 0,
  })
  const [tipOpen, setTipOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "체크인 기록이 쌓였어요",
      body: "이번 달 케어 참여 기록이 3일째 이어지고 있어요.",
      createdAt: "방금 전",
      read: false,
    },
    {
      id: "notif-2",
      title: "새로운 케어 팁이 도착했어요",
      body: "수분 섭취를 늘리는 간단한 팁을 확인해 보세요.",
      createdAt: "어제",
      read: true,
    },
  ])

  useEffect(() => {
    setMonthlyCare(getMonthlyCareForDate(new Date(), activeCatId ?? undefined))
  }, [activeCatId])

  const today = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })
  const todayCatTip = {
    id: "hydration-urinary",
    question: "고양이 수분 섭취량이 요로 건강에 얼마나 중요한지 알고 계시나요?",
    summary:
      "고양이는 원래 물을 많이 마시지 않는 편이라 요로 건강이 민감해질 수 있어요.\n습식 사료, 물그릇 위치, 급수기 환경을 조금만 바꿔도 도움이 됩니다.\n작은 습관이 꾸준한 기록과 함께 큰 변화를 만들어요.",
    sources: [
      {
        title: "고양이 수분 섭취를 늘리는 실천 팁",
        publisher: "반려묘 생활 가이드",
        url: "https://example.com/cat-hydration-tips",
      },
      {
        title: "요로 건강을 위한 생활 관리 체크리스트",
        publisher: "동물병원 칼럼",
        url: "https://example.com/cat-urinary-health",
      },
      {
        title: "수분 섭취와 배뇨 패턴의 관계",
        publisher: "반려동물 케어 아티클",
        url: "https://example.com/cat-water-intake",
      },
    ],
  }

  const handleSourceClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length
  const unreadBadge = unreadCount > 9 ? "9+" : String(unreadCount)

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const monthLabel = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" })
  const completionRatePercent = Math.round(monthlyCare.completionRate * 100)

  const formatISODate = (year: number, monthIndex: number, day: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  const now = new Date()
  const year = now.getFullYear()
  const monthIndex = now.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const firstDayIndex = new Date(year, monthIndex, 1).getDay()
  const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7
  const completedSet = new Set(monthlyCare.completedDays)
  const calendarCells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDayIndex + 1
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return <div key={`empty-${index}`} className="h-7" />
    }

    const dateISO = formatISODate(year, monthIndex, dayNumber)
    const isCompleted = completedSet.has(dateISO)

    return (
      <div
        key={dateISO}
        className={`h-7 rounded-md border flex items-center justify-center text-[10px] ${
          isCompleted ? "border-primary/30 bg-primary/10 text-primary" : "border-border/40 bg-muted/40 text-muted-foreground"
        }`}
      >
        {dayNumber}
        {isCompleted && <span className="ml-1">✓</span>}
      </div>
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <CheckinPopup catId={activeCatId} catName={activeCat?.name} onCheckinSaved={setMonthlyCare} />
      {/* 헤더 */}
      <header className="bg-primary text-primary-foreground px-6 pt-safe-top pb-8">
        <div className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm opacity-80">{today}</p>
              <h1 className="text-xl font-bold mt-1 leading-relaxed">
                안녕하세요, <span className="text-primary-foreground/90">{activeCat?.name || "고양이"}</span> 집사님!{" "}
                <button
                  type="button"
                  onClick={() => setTipOpen(true)}
                  className="inline font-semibold underline underline-offset-4 decoration-primary-foreground/60 hover:decoration-primary-foreground hover:text-primary-foreground/90 transition"
                  aria-haspopup="dialog"
                  aria-expanded={tipOpen}
                >
                  {todayCatTip.question}
                </button>
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground/90 hover:bg-primary-foreground/20 transition shrink-0"
              aria-label="알림 보기"
              aria-haspopup="dialog"
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                  {unreadBadge}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="px-6 -mt-4 pb-6 space-y-4">
        {/* 프로필 요약 */}
        <CatSelector />

        {/* 이상 신호 카드 */}
        {riskStatus && <RiskCard riskStatus={riskStatus} catName={activeCat?.name} />}

        {/* 월간 케어 참여 기록 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                월간 케어 참여 기록
              </CardTitle>
              <span className="text-xs text-muted-foreground">{monthLabel}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">완료일</p>
                <p className="text-lg font-semibold">{monthlyCare.completedDays.length}일</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">연속 기록</p>
                <p className="text-lg font-semibold">{monthlyCare.streak}일</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">참여율</p>
                <p className="text-lg font-semibold">{completionRatePercent}%</p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">{calendarCells}</div>

            <Alert>
              <Gift className="text-amber-600" />
              <AlertTitle>케어 참여 혜택 안내</AlertTitle>
              <AlertDescription>
                <p>
                  케어 프로그램에 꾸준히 참여하신 보호자분들께
                  <br />
                  입양기관 및 협력 병원과 함께
                  <br />
                  중성화 수술 할인, 간식 지원 등
                  <br />
                  실질적인 케어 혜택을 제공하고 있어요.
                  <br />
                  (혜택은 참여 조건에 따라 달라질 수 있어요.)
                </p>
                <p className="text-xs text-muted-foreground">
                  혜택은 ‘기관 공유 동의’의 대가가 아니라, 케어 참여(지속 체크인/기록)에 대한 지원입니다.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

      </main>

      <Button
        asChild
        className="fixed bottom-24 right-4 z-40 h-12 rounded-full px-5 shadow-lg"
        aria-label="진단 설문"
      >
        <Link href="/onboarding/questions">
          <MessageCircle className="w-4 h-4 mr-2" />
          진단 설문
        </Link>
      </Button>

      <Dialog open={tipOpen} onOpenChange={setTipOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <p className="text-xs text-muted-foreground">오늘의 고양이 토막상식</p>
            <DialogTitle>{todayCatTip.question}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{todayCatTip.summary}</p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">관련 읽을거리</p>
              <div className="space-y-2">
                {todayCatTip.sources.map((source) => (
                  <button
                    key={source.url}
                    type="button"
                    onClick={() => handleSourceClick(source.url)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-left transition hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">{source.title}</p>
                        <p className="text-xs text-muted-foreground">{source.publisher}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <ExternalLink className="w-3.5 h-3.5" />
                        외부에서 보기
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>알림</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">새 알림이 없어요</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    notification.read ? "border-border bg-background" : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.body}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {notification.createdAt}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
