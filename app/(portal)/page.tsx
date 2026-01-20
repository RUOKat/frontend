"use client"

import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckinPopup } from "@/components/app/checkin-popup"
import { CatSelector } from "@/components/app/cat-selector"
import { useActiveCat } from "@/contexts/active-cat-context"
import { fetchMonthlyCare } from "@/lib/backend-care"
import { Calendar, Gift, MessageCircle, ExternalLink, Bell, Trash2 } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { fetchNotifications, markNotificationAsRead, deleteNotification, type Notification } from "@/lib/backend-notifications"
import { getTokens } from "@/lib/backend"

type MonthlyCareRecord = {
  completedDays: string[]
  streak: number
  completionRate: number
}

const stampImages = [
  "/stamps/cat-stamp-1.png",
  "/stamps/cat-stamp-2.png",
  "/stamps/cat-stamp-3.png",
  "/stamps/cat-stamp-4.png",
  "/stamps/cat-stamp-5.png",
  "/stamps/cat-stamp-6.png",
]

const getStampIndex = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % stampImages.length
}

export default function HomePage() {
  const { activeCat, activeCatId } = useActiveCat()
  const [monthlyCare, setMonthlyCare] = useState<MonthlyCareRecord>({
    completedDays: [],
    streak: 0,
    completionRate: 0,
  })
  const [processedStamps, setProcessedStamps] = useState<Record<string, string>>({})
  const [tipOpen, setTipOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  // 월간 케어 기록 로드
  const loadMonthlyCare = useCallback(async () => {
    if (!activeCatId) return

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    try {
      const data = await fetchMonthlyCare(activeCatId, year, month)
      setMonthlyCare({
        completedDays: data.completedDays,
        streak: 0,
        completionRate: data.completedDays.length / now.getDate(),
      })
    } catch (error) {
      console.error('Failed to load monthly care:', error)
      setMonthlyCare({
        completedDays: [],
        streak: 0,
        completionRate: 0,
      })
    }
  }, [activeCatId])

  // 초기 로드 및 activeCatId 변경 시 로드
  useEffect(() => {
    loadMonthlyCare()
  }, [loadMonthlyCare])

  // 알림 목록 로드
  const loadNotifications = useCallback(async () => {
    const { accessToken } = getTokens()
    if (!accessToken) return

    setIsLoadingNotifications(true)
    try {
      const data = await fetchNotifications()
      setNotifications(data)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [])

  // 알림 다이얼로그 열릴 때 로드
  useEffect(() => {
    if (notificationsOpen) {
      loadNotifications()
    }
  }, [notificationsOpen, loadNotifications])

  // 초기 로드 (뱃지 카운트용)
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    let isActive = true
    const nextStamps: Record<string, string> = {}
    let remaining = stampImages.length

    const finalize = () => {
      if (isActive) {
        setProcessedStamps(nextStamps)
      }
    }

    stampImages.forEach((src) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          nextStamps[src] = src
          remaining -= 1
          if (remaining === 0) finalize()
          return
        }

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const { data } = imageData
        const samplePoints = [
          [0, 0],
          [canvas.width - 1, 0],
          [0, canvas.height - 1],
          [canvas.width - 1, canvas.height - 1],
          [Math.floor(canvas.width / 2), 0],
          [0, Math.floor(canvas.height / 2)],
          [canvas.width - 1, Math.floor(canvas.height / 2)],
        ]
        let sumR = 0
        let sumG = 0
        let sumB = 0
        samplePoints.forEach(([x, y]) => {
          const index = (y * canvas.width + x) * 4
          sumR += data[index]
          sumG += data[index + 1]
          sumB += data[index + 2]
        })
        const sampleCount = samplePoints.length
        const bgR = sumR / sampleCount
        const bgG = sumG / sampleCount
        const bgB = sumB / sampleCount
        const threshold = 22
        const softEdge = 16

        for (let i = 0; i < data.length; i += 4) {
          const dr = data[i] - bgR
          const dg = data[i + 1] - bgG
          const db = data[i + 2] - bgB
          const distance = Math.sqrt(dr * dr + dg * dg + db * db)
          if (distance <= threshold) {
            data[i + 3] = 0
          } else if (distance < threshold + softEdge) {
            const factor = (distance - threshold) / softEdge
            data[i + 3] = Math.round(data[i + 3] * factor)
          }
        }

        ctx.putImageData(imageData, 0, 0)
        nextStamps[src] = canvas.toDataURL("image/png")
        remaining -= 1
        if (remaining === 0) finalize()
      }
      img.onerror = () => {
        nextStamps[src] = src
        remaining -= 1
        if (remaining === 0) finalize()
      }
      img.src = src
    })

    return () => {
      isActive = false
    }
  }, [])

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

  const unreadCount = notifications.filter((notification) => !notification.isRead).length
  const unreadBadge = unreadCount > 9 ? "9+" : String(unreadCount)

  const handleNotificationClick = async (id: string) => {
    const notification = notifications.find((n) => n.id === id)
    if (notification?.isRead) return

    const updated = await markNotificationAsRead(id)
    if (updated) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      )
    }
  }

  const handleNotificationDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const success = await deleteNotification(id)
    if (success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }
  }

  const formatNotificationTime = (createdAt: string) => {
    const date = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "방금 전"
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
  }

  const monthLabel = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" })

  const formatISODate = (year: number, monthIndex: number, day: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  const now = new Date()
  const year = now.getFullYear()
  const monthIndex = now.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const weekDayIndexMap = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  } as const
  const scheduledDays = activeCat?.surveyDays ?? []
  const scheduledDayIndexes = scheduledDays.map((day) => weekDayIndexMap[day])
  const scheduledDaySet = new Set(scheduledDayIndexes)
  const surveyTargetDays = new Set<number>()

  if (scheduledDaySet.size > 0) {
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayIndex = new Date(year, monthIndex, day).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
      if (scheduledDaySet.has(dayIndex)) {
        surveyTargetDays.add(day)
      }
    }
  }

  const surveyCompletedDays = new Set<number>()
  if (scheduledDaySet.size > 0) {
    monthlyCare.completedDays.forEach((dateISO) => {
      const [dateYear, dateMonth, dateDay] = dateISO.split("-").map(Number)
      if (dateYear !== year || dateMonth !== monthIndex + 1) return
      const dayIndex = new Date(dateYear, dateMonth - 1, dateDay).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
      if (scheduledDaySet.has(dayIndex)) {
        surveyCompletedDays.add(dateDay)
      }
    })
  }

  const hasSchedule = scheduledDaySet.size > 0
  const targetDays = hasSchedule ? surveyTargetDays.size : Math.max(1, now.getDate())
  const completedSurveyDays = hasSchedule ? surveyCompletedDays.size : monthlyCare.completedDays.length
  const completionRatePercent = hasSchedule
    ? Math.round((completedSurveyDays / Math.max(1, targetDays)) * 100)
    : Math.round(monthlyCare.completionRate * 100)
  const todayISO = formatISODate(year, monthIndex, now.getDate())
  const needsSurveyToday =
    hasSchedule && scheduledDaySet.has(now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6) && !monthlyCare.completedDays.includes(todayISO)
  const firstDayIndex = new Date(year, monthIndex, 1).getDay()
  const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7
  const completedSet = new Set(monthlyCare.completedDays)
  const calendarCells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDayIndex + 1
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return <div key={`empty-${index}`} className="aspect-square min-h-[32px]" />
    }

    const dateISO = formatISODate(year, monthIndex, dayNumber)
    const isCompleted = completedSet.has(dateISO)
    const hasSurveyStamp = surveyCompletedDays.has(dayNumber)
    const stampSrc = hasSurveyStamp ? stampImages[getStampIndex(dateISO)] : null
    const resolvedStampSrc = stampSrc ? processedStamps[stampSrc] ?? stampSrc : null

    return (
      <div
        key={dateISO}
        className={`relative isolate flex aspect-square min-h-[32px] items-center justify-center rounded-md border p-0.5 text-[10px] ${
          isCompleted ? "border-primary/30 bg-primary/10 text-primary" : "border-border/40 bg-muted/40 text-muted-foreground"
        }`}
      >
        {resolvedStampSrc ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center stamp-sparkle" aria-hidden="true">
              <span className="stamp-image" style={{ backgroundImage: `url(${resolvedStampSrc})` }} />
            </span>
            <span className="absolute right-0.5 top-0.5 rounded bg-background/80 px-0.5 text-[8px] font-medium text-foreground">
              {dayNumber}
            </span>
          </>
        ) : (
          <span className="flex items-center gap-0.5 font-medium">
            {dayNumber}
            {isCompleted && <span className="ml-1">✓</span>}
          </span>
        )}
      </div>
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <CheckinPopup catId={activeCatId} catName={activeCat?.name} onCheckinSaved={loadMonthlyCare} />
      {/* 헤더 */}
      <header className="bg-primary text-primary-foreground px-6 pt-safe-top pb-8">
        <div className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm opacity-80">{today}</p>
              <h1 className="text-xl font-bold mt-1 leading-relaxed">
                안녕하세요, <span className="text-primary-foreground/90">{activeCat?.name || "고양이"}</span> 집사님!
              </h1>
              <button
                type="button"
                onClick={() => setTipOpen(true)}
                className="mt-1 text-sm font-semibold underline underline-offset-4 decoration-primary-foreground/60 hover:decoration-primary-foreground hover:text-primary-foreground/90 transition text-left"
                aria-haspopup="dialog"
                aria-expanded={tipOpen}
              >
                {todayCatTip.question}
              </button>
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
        {/* 고양이 정보 */}
        <Card className="py-3">
          <CardContent className="py-2">
            <CatSelector embedded primaryAction="edit" />
          </CardContent>
        </Card>

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
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">진단일</p>
                <p className="text-lg font-semibold">
                  {completedSurveyDays}/{targetDays}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">참여율</p>
                <p className="text-lg font-semibold">{completionRatePercent}%</p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 px-2">{calendarCells}</div>

            <Alert className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card/90 px-2 shadow-sm">
              <AlertTitle className="flex items-center gap-2">
                <Gift className="text-primary" />
                케어 참여 혜택
              </AlertTitle>
              <AlertDescription className="w-full">
                <div className="space-y-3">
                  <div className="w-full rounded-xl border border-primary/20 bg-background/70 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="rounded-full border border-border bg-background/80 px-3 py-1">
                        1월 혜택
                      </span>
                      <span className="rounded-full border border-border bg-secondary px-3 py-1">택 1</span>
                      <span className="text-sm font-medium text-foreground/70">월간 케어 참여 80% 이상 하시면!</span>
                    </div>
                    <div className="mt-3 grid grid-cols-7 gap-1">
                      <div className="col-span-7 rounded-lg border border-border/70 bg-card/80 p-4 shadow-sm sm:col-span-4">
                        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-sm">
                            A
                          </span>
                          <span>프리미엄 키튼 사료</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">로얄캐닌 캣 마더 앤 베이비캣 2kg 증정</p>
                        <p className="mt-1 text-xs text-muted-foreground">초기 성장 케어용 포뮬러</p>
                      </div>
                      <div className="col-span-7 rounded-lg border border-border/70 bg-card/80 p-4 shadow-sm sm:col-span-3">
                        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-sm">
                            B
                          </span>
                          <span>기능성 키튼 사료</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          힐스 사이언스 다이어트 고양이 치킨 레시피 기능성 사료 키튼 1.58kg 증정
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">균형 잡힌 성장 지원</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-foreground">참여 리워드</span>
                    <span>혜택은 케어 참여 기록에 대한 지원이며, 참여 조건 및 재고에 따라 변경될 수 있어요.</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

      </main>

      {needsSurveyToday && (
        <Button
          asChild
          className="fixed bottom-24 right-4 z-40 h-12 rounded-full px-5 shadow-lg cta-nudge"
          aria-label="진단 설문"
        >
          <Link href="/onboarding/questions">
            <span className="relative inline-flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              진단 설문
              <span className="cta-badge" aria-hidden="true">
                !
              </span>
            </span>
          </Link>
        </Button>
      )}

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
          <p className="text-xs text-muted-foreground -mt-2 mb-2">최근 7일간의 알림만 표시됩니다.</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isLoadingNotifications ? (
              <p className="text-sm text-muted-foreground text-center py-4">로딩 중...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">새 알림이 없어요</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition cursor-pointer ${
                    notification.isRead ? "border-border bg-background" : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.body}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleNotificationDelete(notification.id, e)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                        aria-label="알림 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
