"use client"

// import Link from "next/link"
import { useRouter } from "next/navigation"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckinPopup } from "@/components/app/checkin-popup"
import { CatSelector } from "@/components/app/cat-selector"
import { ScheduleDialog } from "@/components/app/schedule-dialog"

import { CareBenefitPromo } from "@/components/app/care-benefit-promo"
import { useActiveCat } from "@/contexts/active-cat-context"
import { type OkatSummary } from "@/lib/okat-data"
import { 
  fetchMonthlyCare, fetchCareLogByDate, type CareLog
} from "@/lib/backend-care"
import { 
  fetchDashboardSummary, type DashboardSummary 
} from "@/lib/backend-dashboard"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip 
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Calendar, MessageCircle, ExternalLink, Bell, Trash2, Loader2, ChevronLeft, ChevronRight, Gift, AlertTriangle, Activity, Sparkles } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { fetchNotifications, markNotificationAsRead, deleteNotification, markNotificationAsUnread, type Notification } from "@/lib/backend-notifications"
import { getTokens } from "@/lib/backend"
import { useOnboarding } from "@/contexts/onboarding-context"
import { getMediaUrl } from "@/lib/backend"
import { getMyProfile, type UserProfile } from "@/lib/backend-users"
import { useMemo } from "react"
import { fetchSchedules, fetchSchedulesByDate } from "@/lib/backend-schedules"
import { type CalendarEvent } from "@/lib/types"

import { startOfDay, differenceInDays } from "date-fns"



type MonthlyCareRecord = {
  completedDays: string[]
  streak: number
  completionRate: number
}
type SymptomEntry = {
  date: string
  label: string
}
const abnormalSignLabelMap: Record<string, string> = {
  diarrhea: "설사",
  vomit: "구토",
  lethargy: "기력 저하",
  urination_mistake: "배뇨 실수",
  drooling: "침 흘림",
  both: "설사 및 구토",
}
const formatSymptomDate = (date: string) => date.replace(/-/g, "/")
const getAbnormalSignLabel = (value?: string) => {
  if (!value || value === "none" || value === "normal") return null
  if (value.startsWith("other:")) {
    const customLabel = value.slice("other:".length).trim()
    return customLabel || "기타 이상 징후"
  }
  return abnormalSignLabelMap[value] ?? value
}
const isSymptomMetric = (metric: { id: string; label: string }) =>
  metric.id.toLowerCase().includes("abnormal") ||
  metric.id.toLowerCase().includes("symptom") ||
  metric.label.includes("이상 징후")

const stampImages = [
  "/stamps/cat-stamp-1.png",
  "/stamps/cat-stamp-2.png",
  "/stamps/cat-stamp-3.png",
  "/stamps/cat-stamp-4.png",
  "/stamps/cat-stamp-5.png",
  "/stamps/cat-stamp-6.png",
  "/stamps/cat-stamp-7.png",
  "/stamps/cat-stamp-8.png",
  "/stamps/cat-stamp-9.png",
  "/stamps/cat-stamp-10.png",
  "/stamps/cat-stamp-11.png",
  "/stamps/cat-stamp-12.png",
  "/stamps/cat-stamp-13.png",
  "/stamps/cat-stamp-14.png",
  "/stamps/cat-stamp-15.png",
  "/stamps/cat-stamp-16.png",
  "/stamps/cat-stamp-17.png",
  "/stamps/cat-stamp-18.png",
  "/stamps/cat-stamp-19.png",
  "/stamps/cat-stamp-20.png",
  "/stamps/cat-stamp-21.png",
  "/stamps/cat-stamp-22.png",
  "/stamps/cat-stamp-23.png",
  "/stamps/cat-stamp-24.png",
  "/stamps/cat-stamp-25.png",
  "/stamps/cat-stamp-26.png",
  "/stamps/cat-stamp-27.png",
  "/stamps/cat-stamp-28.png",
  "/stamps/cat-stamp-29.png",
  "/stamps/cat-stamp-30.png",
  "/stamps/cat-stamp-31.png",
]

const hashString = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const deterministicShuffle = (array: number[], seed: number) => {
  const result = [...array]
  let currentSeed = seed
  for (let i = result.length - 1; i > 0; i -= 1) {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff
    const j = currentSeed % (i + 1)
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

type MetricPoint = {
  day: number
  date: string
  value: number
  label?: string
}

// 위험도 레벨에 따른 색상
function getRiskLevelColor(level: string) {
  switch (level?.toLowerCase()) {
    case 'high': return 'bg-red-500'
    case 'medium':
    case 'caution': return 'bg-yellow-500'
    case 'low':
    case 'normal': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

function getRiskLevelText(level: string) {
  switch (level?.toLowerCase()) {
    case 'high': return '높음'
    case 'medium':
    case 'caution': return '주의'
    case 'low':
    case 'normal': return '양호'
    default: return '정보 없음'
  }
}

const METRIC_COLORS: Record<string, string> = {
  "식사량": "#f43f5e", // Rose
  "음수량": "#0ea5e9", // Sky Blue
  "소변량": "#f59e0b", // Amber
  "소변": "#f59e0b",
  "배뇨량": "#f59e0b",
  "대변량": "#10b981", // Emerald
  "대변": "#10b981",
  "배변": "#10b981",
  "체중": "#8b5cf6", // Violet
}

function calculateMetricTrend(chartData?: { x: string; y: number }[]) {
  if (!chartData || chartData.length < 1) {
    return { changePercent: 0, trendLabel: "데이터 분석 중" }
  }

  const values = chartData.map(d => d.y);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const last = values[values.length - 1];
  
  // 최근 상태가 평균 대비 어떤지 계산
  let changePercent = 0;
  if (avg === 0) {
    changePercent = last > 0 ? 100 : 0;
  } else {
    changePercent = Math.round(((last - avg) / avg) * 100);
  }

  let trendLabel = "평균 수준 유지";
  // 5% 이상의 변화가 있을 때만 증가/감소로 표시
  if (changePercent >= 5) trendLabel = "평균 대비 증가";
  else if (changePercent <= -5) trendLabel = "평균 대비 감소";
  else trendLabel = "변화 없음";

  return { changePercent, trendLabel }
}

function formatMetricValue(label: string, value: number) {
  if (label?.includes("체중")) return `${value}kg`;
  
  if (label?.includes("식사")) {
    return ["전혀 안 먹음", "평소보다 적게", "평소만큼", "평소보다 많이"][value] || value;
  }
  if (label?.includes("음수")) {
    return ["전혀 안 마심", "평소보다 적게", "평소만큼", "평소보다 많이"][value] || value;
  }
  if (label?.includes("소변") || label?.includes("배뇨")) {
    return ["소변을 안 봄", "평소보다 적게", "평소만큼", "평소보다 많이"][value] || value;
  }
  if (label?.includes("대변") || label?.includes("배변")) {
    return ["대변을 안 봄", "평소보다 적게", "평소만큼", "평소보다 많이"][value] || value;
  }
  
  return value;
}

export default function HomePage() {
  const router = useRouter()
  const { activeCat, activeCatId } = useActiveCat()
  const { setFollowUpPlan } = useOnboarding()
  const [monthlyCare, setMonthlyCare] = useState<MonthlyCareRecord>({
    completedDays: [],
    streak: 0,
    completionRate: 0,
  })
  const [processedStamps, setProcessedStamps] = useState<Record<string, string>>({})
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  // Okat Dashboard States
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false)
  const [recentSymptomEntries, setRecentSymptomEntries] = useState<SymptomEntry[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // 케어 로그 다이얼로그 상태
  const [careLogDialogOpen, setCareLogDialogOpen] = useState(false)
  const [selectedCareLog, setSelectedCareLog] = useState<CareLog | null>(null)
  const [isLoadingCareLog, setIsLoadingCareLog] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const selectedDayEvents = useMemo(() => {
    return calendarEvents.filter(e => e.date === selectedDate)
  }, [calendarEvents, selectedDate])



  // 오늘의 케어 로그
  const [todayCareLog, setTodayCareLog] = useState<CareLog | null>(null)

  // 캘린더 선택 상태
  const [calendarDate, setCalendarDate] = useState(() => new Date())
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    if (monthPickerOpen) {
      setPickerYear(calendarDate.getFullYear())
    }
  }, [monthPickerOpen, calendarDate])
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false)
  const [calendarCareData, setCalendarCareData] = useState<string[]>([])
  const [benefitDialogOpen, setBenefitDialogOpen] = useState(false)
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)

  // 생일 체크 효과
  useEffect(() => {
    if (activeCat?.birthDate) {
      const today = new Date()
      const tMonth = today.getMonth() + 1
      const tDay = today.getDate()
      
      // 시간 정보를 무시하고 YYYY-MM-DD 만 추출
      const dateString = activeCat.birthDate.includes("T") 
        ? activeCat.birthDate.split("T")[0] 
        : activeCat.birthDate.substring(0, 10)
        
      const parts = dateString.split("-")
      if (parts.length >= 3) {
        const bMonth = parseInt(parts[1], 10)
        const bDay = parseInt(parts[2], 10)
        
        console.log("Birthday check:", { target: `${bMonth}월 ${bDay}일`, today: `${tMonth}월 ${tDay}일` })
        
        if (tMonth === bMonth && tDay === bDay) {
          const storageKey = `birthday_shown_${activeCat.id}_${today.getFullYear()}_${tMonth}_${tDay}`
          if (!sessionStorage.getItem(storageKey)) {
            // 팝업이 바로 뜨면 못 볼 수 있으므로 아주 약간의 딜레이
            setTimeout(() => {
              setShowBirthdayPopup(true)
              sessionStorage.setItem(storageKey, "true")
            }, 300)
          }
        }
      }
    }
  }, [activeCat?.id, activeCat?.birthDate])
  
  // 선택된 월과 고양이 조합에 따른 결정론적 스탬프 배치 (새로고침 시 유지, 중복 없음)
  const calYear = calendarDate.getFullYear()
  const calMonthIndex = calendarDate.getMonth()
  const monthlyStampIndices = useCallback(() => {
    const indices = Array.from({ length: stampImages.length }, (_, i) => i)
    const seed = hashString(`${activeCatId}-${calYear}-${calMonthIndex}`)
    return deterministicShuffle(indices, seed)
  }, [activeCatId, calYear, calMonthIndex])()

  // 캘린더 월 변경
  const handlePrevMonth = () => {
    setCalendarDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    const now = new Date()
    setCalendarDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      // 미래 월로는 이동 불가
      if (newDate > now) return prev
      return newDate
    })
  }

  // 선택된 월의 케어 데이터 로드
  const loadCalendarData = useCallback(async () => {
    if (!activeCatId) return

    setIsLoadingCalendar(true)
    try {
      const year = calendarDate.getFullYear()
      const month = calendarDate.getMonth() + 1
      const data = await fetchMonthlyCare(activeCatId, year, month)
      setCalendarCareData(data.completedDays)
      
      // 일정 데이터 로드
      if (activeCatId) {
        const events = await fetchSchedules(activeCatId)
        setCalendarEvents(events)
      }
    } catch (error) {

      console.error('Failed to load calendar data:', error)
      setCalendarCareData([])
    } finally {
      setIsLoadingCalendar(false)
    }
  }, [activeCatId, calendarDate])

  // 캘린더 월 변경 시 데이터 로드
  useEffect(() => {
    loadCalendarData()
  }, [loadCalendarData])

  // 월간 케어 기록 로드 (현재 월 + 이전 월)
  const loadMonthlyCare = useCallback(async () => {
    if (!activeCatId) return

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // 이전 월 계산
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    try {
      // 현재 월과 이전 월 데이터를 동시 조회
      const [currentData, prevData] = await Promise.all([
        fetchMonthlyCare(activeCatId, year, month),
        fetchMonthlyCare(activeCatId, prevYear, prevMonth),
      ])

      // 두 월의 데이터 합치기
      const allCompletedDays = [
        ...prevData.completedDays,
        ...currentData.completedDays,
      ]

      setMonthlyCare({
        completedDays: allCompletedDays,
        streak: 0,
        completionRate: currentData.completedDays.length / now.getDate(),
      })

      // 오늘의 케어 로그 로드
      const todayISO = `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
      if (currentData.completedDays.includes(todayISO)) {
        try {
          const careLog = await fetchCareLogByDate(activeCatId, todayISO)
          setTodayCareLog(careLog)
        } catch (error) {
          console.error('Failed to load today care log:', error)
          setTodayCareLog(null)
        }
      } else {
        setTodayCareLog(null)
      }
    } catch (error) {
      console.error('Failed to load monthly care:', error)
      setMonthlyCare({
        completedDays: [],
        streak: 0,
        completionRate: 0,
      })
      setTodayCareLog(null)
    }
  }, [activeCatId])
  
  // 초기 로드 및 activeCatId 변경 시 로드
  useEffect(() => {
    loadMonthlyCare()
  }, [loadMonthlyCare])

  // Okat Dashboard Data Load
  const loadDashboardData = useCallback(async () => {
    if (!activeCatId) return

    setIsLoadingDashboard(true)
    try {
      const summary = await fetchDashboardSummary(activeCatId)
      setDashboardSummary(summary)
    } catch (error) {
      console.error('Failed to load dashboard summary:', error)
    } finally {
      setIsLoadingDashboard(false)
    }
  }, [activeCatId])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  useEffect(() => {
    if (!activeCatId || monthlyCare.completedDays.length === 0) {
      setRecentSymptomEntries([])
      return
    }
    let cancelled = false
    const loadRecentSymptoms = async () => {
      try {
        const recentDates = [...monthlyCare.completedDays]
          .sort((a, b) => b.localeCompare(a))
          .slice(0, 14)
        const logs = await Promise.all(
          recentDates.map(async (date) => {
            try {
              return await fetchCareLogByDate(activeCatId, date)
            } catch {
              return null
            }
          }),
        )
        const entries = logs
          .flatMap((log) => {
            const label = getAbnormalSignLabel(log?.answers?.q6_abnormal_signs)
            if (!log || !label) return []
            return [{ date: log.date, label }]
          })
          .slice(0, 6)
        if (!cancelled) {
          setRecentSymptomEntries(entries)
        }
      } catch (error) {
        console.error("Failed to load recent symptoms:", error)
        if (!cancelled) {
          setRecentSymptomEntries([])
        }
      }
    }
    loadRecentSymptoms()
    return () => {
      cancelled = true
    }
  }, [activeCatId, monthlyCare.completedDays])

  // 알림 목록 로드
  const loadNotifications = useCallback(async () => {
    const { accessToken } = getTokens()
    if (!accessToken) return

    setIsLoadingNotifications(true)
    try {
      const backendData = await fetchNotifications()
      
      const readList: string[] = JSON.parse(localStorage.getItem("mock_read_notifications") || "[]")
      const delList: string[] = JSON.parse(localStorage.getItem("mock_deleted_notifications") || "[]")
      
      // 일정 리마인더 생성 추가
      const reminders: Notification[] = []
      const today = startOfDay(new Date())
      
      // 생일 알림 추가
      if (activeCat?.birthDate) {
        const tMonth = today.getMonth() + 1
        const tDay = today.getDate()
        
        const dateString = activeCat.birthDate.includes("T") 
          ? activeCat.birthDate.split("T")[0] 
          : activeCat.birthDate.substring(0, 10)
          
        const parts = dateString.split("-")
        if (parts.length >= 3) {
          const bMonth = parseInt(parts[1], 10)
          const bDay = parseInt(parts[2], 10)
          
          if (tMonth === bMonth && tDay === bDay) {
            const id = `rem-birthday-${activeCat.id}-${today.getFullYear()}`
            reminders.push({
              id,
              userId: "local",
              title: `🎉 오늘 생일이에요! 🎂`,
              body: `오늘은 사랑스러운 ${activeCat.name}의 생일입니다! 특별한 간식으로 축하해 주세요!`,
              type: "system",
              isRead: readList.includes(id),
              createdAt: new Date().toISOString()
            })
          }
        }
      }
      
      calendarEvents.forEach(event => {
        if (!event.isNotificationEnabled) return
        
        const eventDate = startOfDay(new Date(event.date))
        const diffDays = differenceInDays(eventDate, today)
        
        if (diffDays === 0) {
          const id = `rem-today-${event.id}`
          reminders.push({
            id,
            userId: "local",
            title: `[오늘] ${event.title}`,
            body: `${event.title} 일정이 오늘 있습니다. 잊지 마세요! 🐱`,
            type: "schedule",
            isRead: readList.includes(id),
            createdAt: new Date().toISOString()
          })
        } else if (diffDays === 1) {
          const id = `rem-tomorrow-${event.id}`
          reminders.push({
            id,
            userId: "local",
            title: `[내일] ${event.title}`,
            body: `${event.title} 일정이 내일 있습니다. 미리 준비해 주세요! 🏥`,
            type: "schedule",
            isRead: readList.includes(id),
            createdAt: new Date().toISOString()
          })
        } else if (diffDays < 0 && !event.isCompleted) {
          const id = `rem-past-${event.id}`
          reminders.push({
            id,
            userId: "local",
            title: `[미완료] ${event.title}`,
            body: `지나간 일정(${event.date})이 아직 완료되지 않았어요. 📝`,
            type: "schedule",
            isRead: readList.includes(id),
            createdAt: new Date().toISOString()
          })
        }
      })

      const filteredReminders = reminders.filter(r => !delList.includes(r.id))
      setNotifications([...filteredReminders, ...backendData])
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [calendarEvents, activeCat])


  // 알림 다이얼로그 열릴 때 로드
  useEffect(() => {
    if (notificationsOpen) {
      loadNotifications()
    }
  }, [notificationsOpen, loadNotifications])

  // 완료된 날짜 클릭 시 케어 로그 조회
  // 선택된 월의 완료된 날짜 (캘린더용)
  const calCompletedSet = useMemo(() => new Set(calendarCareData), [calendarCareData])

  const handleDayClick = useCallback(async (dateISO: string) => {
    if (!activeCatId) return

    setSelectedDate(dateISO)
    setScheduleDialogOpen(true)
  }, [activeCatId])


  // 초기 로드 (뱃지 카운트용)
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // 사용자 프로필 로드
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getMyProfile()
        setUserProfile(profile)
      } catch (error) {
        console.error("Failed to load user profile:", error)
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    let isActive = true
    const nextStamps: Record<string, string> = {}
    const imagesToProcess = [...stampImages, "/stamps/long-cat-sticker.png"]
    let remaining = imagesToProcess.length

    const finalize = () => {
      if (isActive) {
        setProcessedStamps(nextStamps)
      }
    }

    imagesToProcess.forEach((src) => {
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

  const handleSourceClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length
  const unreadBadge = unreadCount > 9 ? "9+" : String(unreadCount)

  const handleNotificationClick = async (id: string) => {
    const notification = notifications.find((n) => n.id === id)
    if (!notification) return
    
    if (notification.isRead) {
      // 읽음 -> 안읽음 토글
      const updated = await markNotificationAsUnread(id)
      if (updated) {
        if (id.startsWith("rem-")) {
          const readList = JSON.parse(localStorage.getItem("mock_read_notifications") || "[]")
          const idx = readList.indexOf(id)
          if (idx !== -1) {
            readList.splice(idx, 1)
            localStorage.setItem("mock_read_notifications", JSON.stringify(readList))
          }
        }
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        )
      }
      return
    }

    // 안읽음 -> 읽음 처리
    const updated = await markNotificationAsRead(id)
    if (updated) {
      if (id.startsWith("rem-")) {
        const readList = JSON.parse(localStorage.getItem("mock_read_notifications") || "[]")
        if (!readList.includes(id)) {
          readList.push(id)
          localStorage.setItem("mock_read_notifications", JSON.stringify(readList))
        }
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      )
    }
  }

  const handleNotificationDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const success = await deleteNotification(id)
    if (success) {
      if (id.startsWith("rem-")) {
        const delList = JSON.parse(localStorage.getItem("mock_deleted_notifications") || "[]")
        if (!delList.includes(id)) {
          delList.push(id)
          localStorage.setItem("mock_deleted_notifications", JSON.stringify(delList))
        }
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }
  }

  // 오늘 checkIn 기록(answers)이 있는지 확인
  const hasCheckInAnswers = todayCareLog?.answers && Object.keys(todayCareLog.answers).length > 0

  // 진단 설문 버튼 클릭 핸들러
  const handleDiagSurveyClick = async () => {
    if (!activeCatId) return

    if (!hasCheckInAnswers) {
      // 오늘의 기록이 아직 안되었다면 기록 페이지로 이동
      router.push('/onboarding/questions')
    } else {
      // 이미 완료된 경우 수정 여부 묻기
      setEditConfirmOpen(true)
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

  const monthLabel = calendarDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })

  const formatISODate = (year: number, monthIndex: number, day: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  const now = new Date()

  // 캘린더에 표시할 일수 (선택된 월)
  const calDaysInMonth = new Date(calYear, calMonthIndex + 1, 0).getDate()

  // 현재 월인지 확인
  const isCurrentMonth = calYear === now.getFullYear() && calMonthIndex === now.getMonth()
  // 미래 월로 이동 불가 체크
  const canGoNext = !(calYear === now.getFullYear() && calMonthIndex >= now.getMonth())

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
    for (let day = 1; day <= calDaysInMonth; day += 1) {
      const dayIndex = new Date(calYear, calMonthIndex, day).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
      if (scheduledDaySet.has(dayIndex)) {
        surveyTargetDays.add(day)
      }
    }
  }

  // 선택된 월의 완료된 날짜 (캘린더용)
  const surveyCompletedDays = new Set<number>()
  if (scheduledDaySet.size > 0) {
    calendarCareData.forEach((dateISO) => {
      const [dateYear, dateMonth, dateDay] = dateISO.split("-").map(Number)
      if (dateYear !== calYear || dateMonth !== calMonthIndex + 1) return
      const dayIndex = new Date(dateYear, dateMonth - 1, dateDay).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
      if (scheduledDaySet.has(dayIndex)) {
        surveyCompletedDays.add(dateDay)
      }
    })
  }

  const hasSchedule = scheduledDaySet.size > 0

  // 선택된 월의 기준일로 통계 계산
  // 현재 월이면 오늘까지, 과거 월이면 해당 월 전체
  const calMaxDay = isCurrentMonth ? now.getDate() : calDaysInMonth

  // 선택된 월의 스케줄된 날짜 수
  let calScheduledCount = 0
  if (hasSchedule) {
    for (let day = 1; day <= calMaxDay; day++) {
      const dayIndex = new Date(calYear, calMonthIndex, day).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
      if (scheduledDaySet.has(dayIndex)) {
        calScheduledCount++
      }
    }
  }

  // 선택된 월의 완료된 날짜 수
  const calCompletedCount = calendarCareData.filter(dateISO => {
    const [y, m, d] = dateISO.split("-").map(Number)
    return y === calYear && m === calMonthIndex + 1 && d <= calMaxDay
  }).length

  // 선택된 월의 스케줄된 날짜 중 완료된 날짜 수
  let calScheduledCompletedCount = 0
  if (hasSchedule) {
    calendarCareData.forEach(dateISO => {
      const [y, m, d] = dateISO.split("-").map(Number)
      if (y !== calYear || m !== calMonthIndex + 1 || d > calMaxDay) return
      const dayIndex = new Date(y, m - 1, d).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
      if (scheduledDaySet.has(dayIndex)) {
        calScheduledCompletedCount++
      }
    })
  }

  const targetDays = hasSchedule ? calScheduledCount : calMaxDay
  const completedSurveyDays = hasSchedule ? calScheduledCompletedCount : calCompletedCount
  const completionRatePercent = Math.round((completedSurveyDays / Math.max(1, targetDays)) * 100)

  const year = now.getFullYear()
  const monthIndex = now.getMonth()
  const todayISO = formatISODate(year, monthIndex, now.getDate())
  
  const hasTodayRecord = monthlyCare.completedDays.includes(todayISO)
  const hasDiagAnswers = todayCareLog?.diagAnswers && Object.keys(todayCareLog.diagAnswers).length > 0
  
  const firstDayIndex = new Date(calYear, calMonthIndex, 1).getDay()
  const totalCells = Math.ceil((firstDayIndex + calDaysInMonth) / 7) * 7

  // Calculate current week boundaries (Mon-Sun) to highlight the active level-up period
  const currentActualDate = new Date()
  const currentDayOfWeek = currentActualDate.getDay()
  const diffToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
  const currentWeekMonday = new Date(currentActualDate)
  currentWeekMonday.setDate(currentActualDate.getDate() - diffToMonday)
  currentWeekMonday.setHours(0, 0, 0, 0)
  
  const currentWeekSunday = new Date(currentWeekMonday)
  currentWeekSunday.setDate(currentWeekMonday.getDate() + 6)
  currentWeekSunday.setHours(23, 59, 59, 999)
  const calendarCells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDayIndex + 1
    if (dayNumber < 1 || dayNumber > calDaysInMonth) {
      const cellDate = new Date(calYear, calMonthIndex, dayNumber)
      const isCurrentWeek = cellDate.getTime() >= currentWeekMonday.getTime() && cellDate.getTime() <= currentWeekSunday.getTime()
      
      return (
        <div 
          key={`empty-${index}`} 
          className={`relative isolate flex aspect-square min-h-[32px] items-center justify-center rounded-md p-0.5 text-[10px] overflow-hidden transition ${
            isCurrentWeek ? "border-[1.5px] border-amber-200 bg-amber-50/30 shadow-[0px_0px_6px_rgba(253,230,138,0.2)] z-10 scale-[1.01]" : "opacity-40 border border-transparent"
          }`}
        >
          <span className={`font-medium ${isCurrentWeek ? "text-muted-foreground opacity-40" : "text-muted-foreground"}`}>{cellDate.getDate()}</span>
        </div>
      )
    }

    const dateISO = formatISODate(calYear, calMonthIndex, dayNumber)
    const cellDate = new Date(calYear, calMonthIndex, dayNumber)
    const isCompleted = calCompletedSet.has(dateISO)
    const isToday = isCurrentMonth && dateISO === todayISO
    const isCurrentWeek = cellDate.getTime() >= currentWeekMonday.getTime() && cellDate.getTime() <= currentWeekSunday.getTime()
    // 스케줄이 있으면 surveyCompletedDays 확인, 없으면 completedSet 확인
    const hasSurveyStamp = hasSchedule ? surveyCompletedDays.has(dayNumber) : isCompleted
    
    // 월별 셔플된 인덱스에서 오늘 날짜에 해당하는 스탬프 선택 (중복 방지)
    const stampIdx = monthlyStampIndices[dayNumber - 1] ?? 0
    const stampSrc = hasSurveyStamp ? stampImages[stampIdx] : null
    const resolvedStampSrc = stampSrc ? processedStamps[stampSrc] ?? stampSrc : null
    const isClickable = isCompleted

    const dayEvents = calendarEvents.filter(e => e.date === dateISO)
    const hasEvents = dayEvents.length > 0
    const allEventsCompleted = hasEvents && dayEvents.every(e => e.isCompleted)
    
    // 생일 여부 확인 (연도는 무시하고 월/일만 비교)
    let isBirthday = false
    if (activeCat?.birthDate) {
      const parts = activeCat.birthDate.split('-')
      if (parts.length === 3) {
        const bMonth = parseInt(parts[1], 10)
        const bDay = parseInt(parts[2], 10)
        if (bMonth === calMonthIndex + 1 && bDay === dayNumber) {
          isBirthday = true
        }
      }
    }

    return (
      <button
        key={dateISO}
        type="button"
        onClick={() => handleDayClick(dateISO)}
        className={`relative isolate flex aspect-square min-h-[32px] items-center justify-center rounded-md p-0.5 text-[10px] overflow-hidden transition cursor-pointer ${
          isCurrentWeek
            ? "border-[1.5px] border-amber-200 bg-amber-50/30 shadow-[0px_0px_6px_rgba(253,230,138,0.2)] z-10 scale-[1.01]"
            : isCompleted
              ? "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
              : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted/60"
        }`}
      >
        {resolvedStampSrc ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center stamp-sparkle" aria-hidden="true">
              <span className="stamp-image" style={{ backgroundImage: `url(${resolvedStampSrc})` }} />
            </span>
            <span className="absolute right-0.5 top-0.5 rounded px-0.5 text-[8px] font-medium bg-background/80 text-foreground z-20">
              {dayNumber}
            </span>
            {isBirthday && (
              <span className="absolute left-0.5 top-0.5 text-[10px] drop-shadow-sm z-30 animate-pulse" title={`${activeCat?.name} 생일 축하해요!`}>
                🎂
              </span>
            )}
            {hasEvents && (
              <div className={`absolute top-1 left-4 w-1.5 h-1.5 rounded-full border border-white shadow-sm z-30 ${allEventsCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            )}

          </>
        ) : (
          <span className="flex flex-col items-center justify-center font-medium">
            {dayNumber}
            {isBirthday && (
              <span className="absolute left-0.5 top-0.5 text-[10px] drop-shadow-sm z-20 animate-pulse" title={`${activeCat?.name} 생일 축하해요!`}>
                🎂
              </span>
            )}
            {hasEvents && (
              <div className={`absolute top-1 left-4 w-1 h-1 rounded-full z-20 ${allEventsCompleted ? 'bg-emerald-500 shadow-[0_0_2px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_2px_rgba(245,158,11,0.5)]'}`} />
            )}
          </span>
        )}
      </button>
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <CheckinPopup catId={activeCatId} catName={activeCat?.name} onCheckinSaved={loadMonthlyCare} />
      
      {/* 헤더 */}
      <header className="bg-primary text-primary-foreground px-6 pt-safe-top pb-8">
        <div className="py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-jua mt-1 leading-relaxed">
                안녕하세요 <span className="text-primary-foreground/90">{userProfile?.nickname || userProfile?.name || "집사"}</span>님!
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
        {/* 고양이 정보 */}
        <Card className="py-1">
          <CardContent className="py-1">
            <CatSelector embedded primaryAction="edit" />
          </CardContent>
        </Card>

        {/* 월간 케어 참여 기록 */}
        <Card className="overflow-visible">
          <CardHeader className="p-0 overflow-visible relative">
            <div className="flex items-center justify-center overflow-visible h-10 md:h-14 px-4 w-full relative">
              <CardTitle className="text-base font-semibold flex items-center justify-center overflow-visible">
                {(hasCheckInAnswers || !hasTodayRecord) && (
                  <div className="flex-1 flex justify-center items-center overflow-visible h-full">
                    <Button
                      onClick={handleDiagSurveyClick}
                      className="relative overflow-visible p-0 h-auto w-auto bg-transparent hover:bg-transparent border-none shadow-none active:scale-95 transition-all group"
                      title={hasCheckInAnswers ? "기록 완료" : "오늘의 기록 작성하기"}
                    >
                      <div className={!hasTodayRecord ? "animate-light-bounce" : ""}>
                        <div className="relative transition-all duration-300 group-hover:scale-110 drop-shadow-md group-hover:drop-shadow-xl">
                          {hasTodayRecord && (
                            <span className="absolute -inset-1 stamp-sparkle pointer-events-none z-10 opacity-40" aria-hidden="true" />
                          )}
                          <img 
                            src={processedStamps["/stamps/long-cat-sticker.png"] || "/stamps/long-cat-sticker.png"} 
                            alt="오늘의 기록" 
                            className="w-auto h-19 md:h-26 object-contain select-none transition-all duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-[25%] flex items-center justify-center pointer-events-none">
                            <span 
                              className="text-2xl md:text-[57px] text-amber-950 font-bold leading-none drop-shadow-[0_2px_4px_rgba(255,255,255,1)] tracking-tight scale-y-[1.15] origin-bottom"
                              style={{ fontFamily: 'var(--font-gaegu)' }}
                            >
                                {hasTodayRecord ? "기록 완료" : "오늘의 기록"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Button>
                  </div>
                )}
              </CardTitle>
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Button
                  variant="ghost"
                  className="h-8 px-2.5 text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-50/50 flex flex-col items-center gap-0.5 mt-2"
                  onClick={() => setBenefitDialogOpen(true)}
                >
                  <Gift className="w-5 h-5" />
                  <span>혜택 보기</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-1 mb-2 mt-4 w-full">
              <div className="flex items-center justify-between w-full px-2 max-w-[360px]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative flex items-center justify-center cursor-pointer group flex-1 select-none">
                      <span className="text-[22px] font-black text-foreground text-center tracking-[0.05em] group-hover:text-amber-600 transition-colors">
                        {monthLabel}
                      </span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4 rounded-2xl border-amber-100 shadow-xl bg-white/95 backdrop-blur-md" align="center" sideOffset={8}>
                    <div className="flex items-center justify-between mb-4 px-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-amber-50 hover:text-amber-600" onClick={() => setPickerYear(y => y - 1)}>
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div className="text-lg font-bold text-amber-950">{pickerYear}년</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-amber-50 hover:text-amber-600" onClick={() => setPickerYear(y => y + 1)}>
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                       {Array.from({ length: 12 }).map((_, i) => {
                         const isSelected = calendarDate.getFullYear() === pickerYear && calendarDate.getMonth() === i;
                         return (
                           <Button
                             key={i}
                             variant={isSelected ? "default" : "ghost"}
                             onClick={() => {
                               const newDate = new Date(calendarDate);
                               newDate.setFullYear(pickerYear);
                               newDate.setMonth(i);
                               setCalendarDate(newDate);
                               setMonthPickerOpen(false);
                             }}
                             className={`h-10 text-sm font-semibold rounded-xl transition-all ${isSelected ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm" : "text-amber-800 hover:bg-amber-100 hover:text-amber-700"}`}
                           >
                             {i + 1}월
                           </Button>
                         );
                       })}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={handleNextMonth}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {isLoadingCalendar ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="grid grid-cols-7 gap-1 px-2 mb-1">
                  {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                    <div key={day} className={`text-center text-[13px] font-bold ${idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-blue-400' : 'text-muted-foreground/70'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 px-2">{calendarCells}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 대시보드 그래프 열고 닫기 버튼 */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowDashboard(!showDashboard)}
            className={`w-full h-12 flex items-center justify-between px-5 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 text-primary-foreground transition-all duration-300 shadow-sm ${showDashboard ? 'ring-2 ring-primary/20 bg-primary/10' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${showDashboard ? 'bg-primary text-white' : 'bg-primary/5 text-primary-foreground/70'}`}>
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">
                {showDashboard ? "지표 그래프 숨기기" : "지표 그래프 보기"}
              </span>
            </div>
            {showDashboard ? (
              <ChevronRight className="w-5 h-5 rotate-90 opacity-70" />
            ) : (
              <ChevronRight className="w-5 h-5 opacity-70" />
            )}
          </Button>
        </div>

        {/* 대시보드 그래프 */}
        {showDashboard && dashboardSummary && dashboardSummary.metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {dashboardSummary.metrics.map((metric) => (
              metric.type === 'text' ? (
                <Card key={metric.id} className="overflow-hidden border-rose-100 bg-rose-50/20 py-0 gap-0">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-2xl font-bold text-muted-foreground flex items-center justify-between">
                      {metric.label}
                      <AlertTriangle className={`w-6 h-6 ${metric.value === '이상 없음' ? 'text-muted-foreground/30' : 'text-rose-500'}`} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 pb-4">
                    {isSymptomMetric(metric) && recentSymptomEntries.length > 0 ? (
                      <div className="space-y-3 pt-1">
                        <div className="max-h-[150px] overflow-y-auto pr-2">
                          {recentSymptomEntries.map((entry) => (
                            <p
                              key={`${entry.date}-${entry.label}`}
                              className="border-b border-rose-100 py-2.5 text-xs font-bold text-rose-600 last:border-b-0"
                            >
                              {formatSymptomDate(entry.date)} {entry.label}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="h-[80px] w-full flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-rose-100/50 flex items-center justify-center">
                            <Activity className={`w-6 h-6 ${metric.value === '이상 없음' ? 'text-rose-300' : 'text-rose-500'}`} />
                          </div>
                        </div>
                        <p className={`text-xl mt-2 text-center font-black ${metric.value === '이상 없음' ? 'text-muted-foreground' : 'text-rose-600'}`}>
                          {metric.value}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                (() => {
                  const trend = calculateMetricTrend(metric.chartData);
                  const strokeColor = METRIC_COLORS[metric.label] || "#f43f5e";
                  return (
                    <Card key={metric.id} className="overflow-hidden py-0 gap-0">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-2xl font-bold text-muted-foreground flex items-center justify-between">
                          {metric.label}
                          <Badge 
                            variant={trend.changePercent > 0 ? "secondary" : trend.changePercent < 0 ? "destructive" : "outline"} 
                            className={`text-lg h-7 px-2.5 font-bold ${trend.changePercent < 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}`}
                          >
                            {trend.changePercent > 0 ? "+" : ""}{trend.changePercent}%
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 pb-4">
                        <div className="h-[80px] w-full">
                          <ChartContainer 
                            config={{
                              y: {
                                label: metric.label,
                                color: strokeColor,
                              },
                            }} 
                            className="aspect-auto h-full w-full"
                          >
                            <LineChart data={metric.chartData?.map((p, i) => ({ ...p, index: i }))}>
                              <XAxis dataKey="index" hide />
                              <YAxis domain={[0, 'auto']} hide />
                              <Line
                                type="monotone"
                                dataKey="y"
                                stroke={strokeColor}
                                strokeWidth={3}
                                dot={false}
                                connectNulls={true}
                              />
                               <ChartTooltip 
                                content={
                                  <ChartTooltipContent 
                                    formatter={(value) => formatMetricValue(metric.label, value as number)} 
                                  />
                                }
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.x}
                              />
                            </LineChart>
                          </ChartContainer>
                        </div>
                        <p 
                          className={`text-lg mt-2 text-center font-bold ${
                            trend.trendLabel === "최근 증가함" ? "text-emerald-600" : 
                            trend.trendLabel === "최근 감소함" ? "text-rose-600" : 
                            "text-muted-foreground"
                          }`}
                        >
                          {trend.trendLabel}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })()
              )
            ))}
          </div>
        )}
      </main>

      {/* 기록 수정 확인 팝업 */}
      <AlertDialog open={editConfirmOpen} onOpenChange={setEditConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>오늘의 기록을 수정할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              이미 기록을 완료했습니다. 내용을 수정하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => router.push('/onboarding/questions')}
              className="bg-primary hover:bg-primary/90"
            >
              수정하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* 알림 다이얼로그 */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>알림</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto mt-2">
            {isLoadingNotifications ? (
              <p className="text-sm text-muted-foreground text-center py-4">로딩 중...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">알림이 없어요</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition cursor-pointer ${notification.isRead ? "border-border bg-background opacity-60" : "border-primary/30 bg-primary/5"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${notification.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                          {notification.title}
                        </p>
                        {notification.isRead && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">읽음</span>
                        )}
                      </div>
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

      {/* 케어 로그 상세 다이얼로그 */}
      <Dialog open={careLogDialogOpen} onOpenChange={setCareLogDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })} 케어 기록
            </DialogTitle>
          </DialogHeader>
          {isLoadingCareLog ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : selectedCareLog ? (
            <div className="space-y-4">
              {/* 해당 날짜 일정 표시 */}
              {selectedDayEvents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-amber-500" />
                      예정된 일정
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setCareLogDialogOpen(false)
                        setScheduleDialogOpen(true)
                      }}
                      className="h-7 text-xs text-primary"
                    >
                      관리하기
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedDayEvents.map(event => (
                      <div key={event.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50 border border-amber-100 text-sm">
                        <span className="font-medium text-amber-900">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 이미지/영상 */}

              {selectedCareLog.imageUrl && (
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted">
                   {selectedCareLog.imageUrl.toLowerCase().match(/\.(mp4|mov|webm|quicktime)$/) ? (
                     <video 
                        src={getMediaUrl(selectedCareLog.imageUrl)} 
                        className="w-full h-full object-cover" 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                      />
                   ) : (
                     <img 
                        src={getMediaUrl(selectedCareLog.imageUrl)} 
                        alt="오늘의 기록" 
                        className="w-full h-full object-cover" 
                      />
                   )}
                </div>
              )}
              {/* 체크업 질문/응답 */}
              {selectedCareLog.questions && selectedCareLog.answers && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">진단 설문 응답</h3>
                  {Array.isArray(selectedCareLog.questions) && selectedCareLog.questions.map((q: any, idx: number) => {
                    const answer = selectedCareLog.answers?.[q.id]
                    const selectedOption = q.options?.find((opt: any) => opt.value === answer)
                    return (
                      <div key={q.id || idx} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                        <p className="text-sm font-medium text-foreground">{q.text}</p>
                        <p className="text-sm text-primary">
                          {selectedOption?.label || answer || "응답 없음"}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 추가 진단 질문/응답 */}
              {selectedCareLog.diagQuestions && selectedCareLog.diagAnswers && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">추가 진단 응답</h3>
                  {Array.isArray(selectedCareLog.diagQuestions) && selectedCareLog.diagQuestions.map((q: any, idx: number) => {
                    const answer = selectedCareLog.diagAnswers?.[q.id]
                    const selectedOption = q.options?.find((opt: any) => opt.value === answer)
                    return (
                      <div key={q.id || idx} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                        <p className="text-sm font-medium text-foreground">{q.text}</p>
                        <p className="text-sm text-primary">
                          {selectedOption?.label || answer || "응답 없음"}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 데이터가 없는 경우 */}
              {!selectedCareLog.questions && !selectedCareLog.diagQuestions && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  저장된 응답이 없습니다.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              케어 기록을 불러올 수 없습니다.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* 케어 참여 혜택 다이얼로그 */}
      <Dialog open={benefitDialogOpen} onOpenChange={setBenefitDialogOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-none bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>케어 참여 혜택</DialogTitle>
          </DialogHeader>
          <CareBenefitPromo />
        </DialogContent>
      </Dialog>
      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        date={selectedDate}
        catId={activeCatId || ""}
        events={selectedDayEvents}
        onUpdate={loadCalendarData}
      />
    </div>
  )
}

