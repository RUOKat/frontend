export type OkatStatus = "normal" | "caution" | "check"

export type OkatMetric = {
  id: string
  label: string
  changePercent: number
  trendLabel: string
}

export type OkatSummary = {
  status: OkatStatus
  coverage: {
    daysWithData: number
    totalDays: number
  }
  updatedAt: string | null
  metrics: OkatMetric[]
  insights: string[]
}

export type WeeklyReport = {
  id: string
  rangeLabel: string
  status: OkatStatus
  summary: string
  score?: number
}

export type WeeklyReportDetail = {
  id: string
  rangeLabel: string
  status: OkatStatus
  highlights: string[]
  metrics: Record<string, string>
  recommendations: string[]
  sources?: { title: string; publisher: string; url: string }[]
}

function seedFromId(id?: string | null): number {
  if (!id) return 0
  return id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

function pickStatus(seed: number): OkatStatus {
  const bucket = seed % 3
  if (bucket === 0) return "normal"
  if (bucket === 1) return "caution"
  return "check"
}

function changePercent(baseline: number, current: number): number {
  if (baseline === 0) return 0
  return Math.round(((current - baseline) / baseline) * 100)
}

function formatRangeLabel(start: Date, end: Date): string {
  const format = (date: Date) =>
    date.toLocaleDateString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
    })
  return `${format(start)} ~ ${format(end)}`
}

function getWeekNumber(date: Date): number {
  const tempDate = new Date(date.getTime())
  tempDate.setHours(0, 0, 0, 0)
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7))
  const week1 = new Date(tempDate.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  )
}

export function getMockOkatSummary(activeCatId?: string | null): OkatSummary | null {
  if (!activeCatId) return null
  const seed = seedFromId(activeCatId)
  const hasData = seed % 5 !== 0
  const totalDays = 7
  const daysWithData = hasData ? (seed % totalDays) + 1 : 0
  const updatedAt = hasData ? new Date(Date.now() - (seed % 6) * 3600 * 1000).toISOString() : null
  const status = pickStatus(seed + daysWithData)

  if (!hasData) {
    return {
      status,
      coverage: { daysWithData, totalDays },
      updatedAt,
      metrics: [],
      insights: [],
    }
  }

  const appetite = changePercent(100, 95 + (seed % 6))
  const water = changePercent(100, 88 + (seed % 8))
  const litter = changePercent(100, 92 + (seed % 5))
  const activity = changePercent(100, 90 + (seed % 7))

  return {
    status,
    coverage: { daysWithData, totalDays },
    updatedAt,
    metrics: [
      { id: "appetite", label: "식욕", changePercent: appetite, trendLabel: "최근 7일 추세" },
      { id: "water", label: "음수", changePercent: water, trendLabel: "최근 7일 추세" },
      { id: "litter", label: "배변", changePercent: litter, trendLabel: "최근 7일 추세" },
      { id: "activity", label: "활동량", changePercent: activity, trendLabel: "최근 7일 추세" },
    ],
    insights: [
      "최근 3일 음수량이 조금 감소했어요.",
      "배변 패턴이 일정하게 유지되고 있어요.",
      "활동량 변화가 크지 않아 안정적이에요.",
    ],
  }
}

export function getMockWeeklyReports(activeCatId?: string | null): WeeklyReport[] {
  if (!activeCatId) return []
  const seed = seedFromId(activeCatId)
  const summary = getMockOkatSummary(activeCatId)
  if (!summary || summary.coverage.daysWithData < 5) return []

  const today = new Date()
  const reports = Array.from({ length: 3 }).map((_, index) => {
    const end = new Date(today)
    end.setDate(end.getDate() - index * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    const weekId = `${end.getFullYear()}-W${String(getWeekNumber(end)).padStart(2, "0")}`
    const status = pickStatus(seed + index)
    return {
      id: weekId,
      rangeLabel: formatRangeLabel(start, end),
      status,
      summary: index === 0 ? "음수량 ↓ · 배뇨 패턴 변동" : "식욕 안정 · 활동량 균형",
      score: 82 - index * 6,
    }
  })

  return reports
}

export function getMockWeeklyReportDetail(activeCatId: string | null | undefined, weekId: string): WeeklyReportDetail | null {
  if (!activeCatId) return null
  const reports = getMockWeeklyReports(activeCatId)
  const report = reports.find((item) => item.id === weekId)
  if (!report) return null

  return {
    id: report.id,
    rangeLabel: report.rangeLabel,
    status: report.status,
    highlights: ["음수량 감소 패턴이 보였어요.", "배변 패턴이 하루 1회로 유지됐어요.", "활동량이 비교적 안정적이었어요."],
    metrics: {
      식욕: "최근 7일 평균 섭취량이 유지됐어요.",
      음수: "평균 음수량이 약 8% 감소했어요.",
      배변: "배변 횟수가 일정했고 큰 변화는 없었어요.",
      활동: "활동량 변동 폭이 크지 않았어요.",
    },
    recommendations: ["물그릇 위치를 1~2곳 추가해 보세요.", "습식 비중을 조금 늘려 수분 섭취를 도울 수 있어요."],
    sources: [
      {
        title: "고양이 수분 섭취를 늘리는 방법",
        publisher: "반려묘 케어 가이드",
        url: "https://example.com/cat-hydration-tips",
      },
      {
        title: "일상 기록으로 변화 감지하기",
        publisher: "케어 노트",
        url: "https://example.com/care-note",
      },
    ],
  }
}
