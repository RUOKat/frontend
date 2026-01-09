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
  
  // 항상 더미 데이터를 반환하도록 수정
  const today = new Date()
  const reports = Array.from({ length: 4 }).map((_, index) => {
    const end = new Date(today)
    end.setDate(end.getDate() - index * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    const weekId = `${end.getFullYear()}-W${String(getWeekNumber(end)).padStart(2, "0")}`
    const status = pickStatus(seed + index)
    
    // 다양한 샘플 리포트 내용
    const summaries = [
      "음수량 ↓ · 배뇨 패턴 변동",
      "식욕 안정 · 활동량 균형",
      "전반적으로 건강한 상태",
      "활동량 증가 · 식욕 왕성"
    ]
    
    return {
      id: weekId,
      rangeLabel: formatRangeLabel(start, end),
      status,
      summary: summaries[index] || "건강 상태 양호",
      score: Math.max(65, 85 - index * 5), // 65~85% 범위
    }
  })

  return reports
}

export function getMockWeeklyReportsWithPagination(activeCatId?: string | null, page: number = 1, pageSize: number = 10): WeeklyReport[] {
  if (!activeCatId) return []
  const seed = seedFromId(activeCatId)
  
  // 총 20주 정도의 더미 데이터 생성
  const totalWeeks = 20
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalWeeks)
  
  if (startIndex >= totalWeeks) return []
  
  const today = new Date()
  const reports = Array.from({ length: endIndex - startIndex }).map((_, index) => {
    const weekIndex = startIndex + index
    const end = new Date(today)
    end.setDate(end.getDate() - weekIndex * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    const weekId = `${end.getFullYear()}-W${String(getWeekNumber(end)).padStart(2, "0")}`
    const status = pickStatus(seed + weekIndex)
    
    // 다양한 샘플 리포트 내용
    const summaries = [
      "음수량 ↓ · 배뇨 패턴 변동",
      "식욕 안정 · 활동량 균형", 
      "전반적으로 건강한 상태",
      "활동량 증가 · 식욕 왕성",
      "수면 패턴 안정적",
      "놀이 활동 활발",
      "스트레스 지수 낮음",
      "건강 상태 우수",
      "식욕 왕성 · 활동적",
      "안정적인 일상 패턴"
    ]
    
    return {
      id: weekId,
      rangeLabel: formatRangeLabel(start, end),
      status,
      summary: summaries[weekIndex % summaries.length],
      score: Math.max(60, 90 - (weekIndex % 8) * 3), // 60~90% 범위
    }
  })

  return reports
}

export function getMockWeeklyReportDetail(activeCatId: string | null | undefined, weekId: string): WeeklyReportDetail | null {
  if (!activeCatId) return null
  const reports = getMockWeeklyReports(activeCatId)
  const report = reports.find((item) => item.id === weekId)
  if (!report) return null

  const seed = seedFromId(activeCatId + weekId)
  
  // 다양한 샘플 하이라이트
  const highlightOptions = [
    ["음수량 감소 패턴이 보였어요.", "배변 패턴이 하루 1회로 유지됐어요.", "활동량이 비교적 안정적이었어요."],
    ["식욕이 꾸준히 좋은 상태를 유지했어요.", "물을 충분히 마시고 있어요.", "놀이 활동에 적극적으로 참여해요."],
    ["전반적으로 건강한 패턴을 보여요.", "규칙적인 식사와 배변을 하고 있어요.", "적절한 휴식과 활동의 균형이 좋아요."],
    ["활동량이 이전보다 증가했어요.", "식욕이 왕성하고 건강해 보여요.", "새로운 환경에 잘 적응하고 있어요."]
  ]
  
  // 다양한 샘플 메트릭
  const metricsOptions = [
    {
      식욕: "최근 7일 평균 섭취량이 유지됐어요.",
      음수: "평균 음수량이 약 8% 감소했어요.",
      배변: "배변 횟수가 일정했고 큰 변화는 없었어요.",
      활동: "활동량 변동 폭이 크지 않았어요.",
    },
    {
      식욕: "식사량이 꾸준히 좋은 상태예요.",
      음수: "충분한 수분 섭취를 하고 있어요.",
      배변: "정상적인 배변 패턴을 보여요.",
      활동: "활발한 놀이 활동을 즐기고 있어요.",
    },
    {
      식욕: "안정적인 식사 패턴을 유지해요.",
      음수: "적절한 음수량을 섭취하고 있어요.",
      배변: "규칙적인 배변 습관이 좋아요.",
      활동: "균형 잡힌 활동량을 보여요.",
    },
    {
      식욕: "이전보다 식욕이 증가했어요.",
      음수: "물을 더 자주 마시는 경향이 있어요.",
      배변: "건강한 배변 상태를 유지해요.",
      활동: "에너지가 넘치고 활동적이에요.",
    }
  ]
  
  // 다양한 샘플 권장사항
  const recommendationsOptions = [
    ["음수량 모니터링을 계속해주세요.", "스트레스 요인이 있는지 확인해보세요.", "정기적인 건강검진을 받아보세요."],
    ["현재 상태를 잘 유지해주세요.", "충분한 놀이 시간을 제공해주세요.", "균형 잡힌 식단을 계속 유지해주세요."],
    ["꾸준한 관찰과 기록을 계속해주세요.", "환경 변화에 주의해주세요.", "정기적인 그루밍을 도와주세요."],
    ["높은 활동량에 맞는 영양 공급을 해주세요.", "충분한 휴식 공간을 마련해주세요.", "새로운 장난감으로 자극을 주세요."]
  ]
  
  const optionIndex = seed % 4
  
  return {
    id: report.id,
    rangeLabel: report.rangeLabel,
    status: report.status,
    highlights: highlightOptions[optionIndex],
    metrics: metricsOptions[optionIndex],
    recommendations: recommendationsOptions[optionIndex],
    sources: [
      { title: "고양이 건강 관리 가이드", publisher: "펫케어 연구소", url: "https://example.com/cat-health" },
      { title: "반려동물 행동 분석", publisher: "동물병원 협회", url: "https://example.com/pet-behavior" }
    ]
  }
}