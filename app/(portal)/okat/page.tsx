"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { StatusBadge } from "@/components/app/status-badge"
import { CatSelector } from "@/components/app/cat-selector"
import { useActiveCat } from "@/contexts/active-cat-context"
import { type OkatSummary } from "@/lib/okat-data"
import { 
  fetchMonthlyStats, 
  fetchDailyReports, 
  fetchHealthContext,
  fetchHealthTrend,
  type MonthlyStats, 
  type DailyReport,
  type HealthContext,
  type HealthTrend
} from "@/lib/backend-care"
import { 
  Camera, 
  ChevronRight, 
  ClipboardList, 
  Loader2, 
  AlertTriangle, 
  TrendingUp, 
  Heart,
  Eye,
  Activity,
  HelpCircle
} from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from "recharts"

function formatDateTime(value?: string | null) {
  if (!value) return "업데이트 없음"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "업데이트 없음"
  return date.toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

type MetricPoint = {
  day: number
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
    default: return '알 수 없음'
  }
}

export default function OkatDashboardPage() {
  const { activeCat, activeCatId } = useActiveCat()
  const [summary, setSummary] = useState<OkatSummary | null>(null)
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [healthContext, setHealthContext] = useState<HealthContext | null>(null)
  const [healthTrend, setHealthTrend] = useState<HealthTrend | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const dailyReportsKey = useMemo(() => ["dailyReports", activeCatId], [activeCatId])

  // 모든 데이터 로드
  const loadAllData = useCallback(async () => {
    if (!activeCatId) return
    
    setIsLoading(true)
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      
      // 이전 달 계산
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year
      
      // 병렬로 모든 데이터 로드 (현재 월 + 이전 월 통계)
      const [currentStats, prevStats, reports, context, trend] = await Promise.all([
        fetchMonthlyStats(activeCatId, year, month),
        fetchMonthlyStats(activeCatId, prevYear, prevMonth),
        fetchDailyReports(activeCatId),
        fetchHealthContext(activeCatId),
        fetchHealthTrend(activeCatId),
      ])
      
      // 두 달의 통계 합치기
      let combinedStats: MonthlyStats | null = null
      if (currentStats || prevStats) {
        const currentDailyData = currentStats?.dailyData || []
        const prevDailyData = prevStats?.dailyData || []
        
        // 이전 달 데이터에 월 정보 추가 (day를 음수로 표시하여 구분)
        const prevDailyDataWithMonth = prevDailyData.map(d => ({
          ...d,
          day: d.day - 31, // 이전 달은 음수로 표시
        }))
        
        // 최근 30일 데이터만 필터링
        const today = now.getDate()
        const allDailyData = [...prevDailyDataWithMonth, ...currentDailyData]
        const last30DaysData = allDailyData.slice(-30)
        
        // 통계 합산
        const combineCategory = (curr: any, prev: any) => ({
          normal: (curr?.normal || 0) + (prev?.normal || 0),
          less: (curr?.less || 0) + (prev?.less || 0),
          more: (curr?.more || 0) + (prev?.more || 0),
          none: (curr?.none || 0) + (prev?.none || 0),
          ...(curr?.diarrhea !== undefined ? { diarrhea: (curr?.diarrhea || 0) + (prev?.diarrhea || 0) } : {}),
        })
        
        combinedStats = {
          totalDays: (currentStats?.totalDays || 0) + (prevStats?.totalDays || 0),
          food: combineCategory(currentStats?.food, prevStats?.food),
          water: combineCategory(currentStats?.water, prevStats?.water),
          stool: combineCategory(currentStats?.stool, prevStats?.stool) as any,
          urine: combineCategory(currentStats?.urine, prevStats?.urine),
          latestWeight: currentStats?.latestWeight ?? prevStats?.latestWeight ?? null,
          weightChange: currentStats?.weightChange ?? prevStats?.weightChange ?? null,
          avgWeight: currentStats?.avgWeight ?? prevStats?.avgWeight ?? null,
          dailyData: last30DaysData.map((d, idx) => ({
            ...d,
            day: idx + 1, // 1부터 시작하도록 재정렬
          })),
        }
      }
      
      setMonthlyStats(combinedStats)
      setDailyReports(reports)
      setHealthContext(context)
      setHealthTrend(trend)
      
      // 디버깅용 로그
      console.log('Health context:', context)
      console.log('Combined stats:', combinedStats)
      
      // 통계 기반으로 summary 생성
      const stats = combinedStats
      if (stats && stats.totalDays > 0) {
        const totalRecords = stats.totalDays
        const normalCount = stats.food.normal + stats.water.normal + stats.stool.normal + stats.urine.normal
        const totalCount = (stats.food.normal + stats.food.less + stats.food.more + stats.food.none) +
                          (stats.water.normal + stats.water.less + stats.water.more + stats.water.none) +
                          (stats.stool.normal + stats.stool.less + stats.stool.more + stats.stool.none + stats.stool.diarrhea) +
                          (stats.urine.normal + stats.urine.less + stats.urine.more + stats.urine.none)
        
        const normalRatio = totalCount > 0 ? normalCount / totalCount : 0
        const status = normalRatio >= 0.7 ? 'normal' : normalRatio >= 0.5 ? 'caution' : 'check'
        
        // 인사이트 생성
        const insights: string[] = []
        if (stats.food.less > stats.food.normal) insights.push("식사량이 평소보다 적은 날이 많았어요.")
        if (stats.water.less > stats.water.normal) insights.push("음수량이 평소보다 적은 날이 많았어요.")
        if (stats.stool.diarrhea > 0) insights.push(`설사가 ${stats.stool.diarrhea}회 있었어요.`)
        if (stats.weightChange !== null) {
          if (stats.weightChange > 0.2) insights.push(`체중이 ${stats.weightChange.toFixed(2)}kg 증가했어요.`)
          else if (stats.weightChange < -0.2) insights.push(`체중이 ${Math.abs(stats.weightChange).toFixed(2)}kg 감소했어요.`)
        }
        if (insights.length === 0) insights.push("전반적으로 안정적인 상태를 유지하고 있어요.")
        
        setSummary({
          status,
          coverage: { daysWithData: totalRecords, totalDays: 30 },
          updatedAt: new Date().toISOString(),
          metrics: [
            { 
              id: "food", 
              label: "식사량", 
              changePercent: Math.round((stats.food.normal / Math.max(1, totalRecords)) * 100 - 50),
              trendLabel: `정상 ${stats.food.normal}일 / 적음 ${stats.food.less}일`
            },
            { 
              id: "water", 
              label: "음수량", 
              changePercent: Math.round((stats.water.normal / Math.max(1, totalRecords)) * 100 - 50),
              trendLabel: `정상 ${stats.water.normal}일 / 적음 ${stats.water.less}일`
            },
            { 
              id: "stool", 
              label: "배변량", 
              changePercent: Math.round((stats.stool.normal / Math.max(1, totalRecords)) * 100 - 50),
              trendLabel: `정상 ${stats.stool.normal}일 / 설사 ${stats.stool.diarrhea}일`
            },
            { 
              id: "weight", 
              label: "체중", 
              changePercent: stats.weightChange ? Math.round(stats.weightChange * 10) : 0,
              trendLabel: stats.latestWeight ? `최근 ${stats.latestWeight}kg` : "기록 없음"
            },
          ],
          insights,
        })
      } else {
        setSummary(null)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [activeCatId])

  useEffect(() => {
    loadAllData()
  }, [dailyReportsKey, activeCatId, loadAllData])

  const coverageLabel = summary
    ? `최근 30일 중 ${summary.coverage.daysWithData}일 기록`
    : "최근 기록이 없어요"
  const fallbackMetricTrendLabel = summary?.coverage?.daysWithData
    ? `최근 ${summary.coverage.daysWithData}일 기준`
    : "기록 데이터 부족"
  const displayMetrics = summary?.metrics?.length
    ? summary.metrics
    : [
        { id: "food", label: "식사량", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
        { id: "water", label: "음수량", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
        { id: "stool", label: "배변량", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
        { id: "weight", label: "체중", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
      ]
  const chartColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"]

  // 실제 일별 데이터로 차트 데이터 생성
  const metricsWithChart = displayMetrics.map((metric, index) => {
    let chartData: MetricPoint[] = []
    
    if (monthlyStats?.dailyData && monthlyStats.dailyData.length > 0) {
      chartData = monthlyStats.dailyData.map((d) => {
        let value = 50
        let label = '기록 없음'
        
        if (metric.id === 'food') {
          value = d.food
          label = d.foodLabel
        } else if (metric.id === 'water') {
          value = d.water
          label = d.waterLabel
        } else if (metric.id === 'stool') {
          value = d.stool
          label = d.stoolLabel
        } else if (metric.id === 'urine') {
          value = d.urine
          label = d.urineLabel
        } else if (metric.id === 'weight' && d.weight !== null) {
          value = d.weight * 10
          label = `${d.weight}kg`
        }
        
        return { day: d.day, value, label }
      })
    } else {
      chartData = [{ day: 1, value: 50, label: '기록 없음' }]
    }
    
    return {
      ...metric,
      chartData,
      color: chartColors[index % chartColors.length],
    }
  })

  const careItems = [
    { icon: ClipboardList, label: "병원 방문 기록", description: "방문 기록 정리", href: "/vet-history" },
  ]
  const webcamItem = { icon: Camera, label: "펫캠 모니터링", description: "실시간 관찰", href: "/webcam" }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-safe-top">
        <div className="py-6">
          <h1 className="text-xl font-bold text-foreground">건강 대시보드</h1>
          <p className="text-sm text-muted-foreground mt-1">AI 분석 기반 종합 건강 현황</p>
        </div>
      </header>

      <main className="px-6 pb-24 space-y-4">
        <Card className="py-3">
          <CardContent className="py-2">
            <CatSelector embedded primaryAction="edit" />
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* 현재 상태 요약 (데일리 기록) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    데일리 기록 요약
                  </CardTitle>
                  {summary && <StatusBadge level={summary.status} size="sm" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">데이터 커버리지</span>
                  <span className="font-medium text-foreground">{coverageLabel}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">마지막 업데이트</span>
                  <span className="font-medium text-foreground">{formatDateTime(summary?.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* 핵심 지표 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">핵심 지표</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {metricsWithChart.map((metric) => {
                    const chartConfig = {
                      value: { label: metric.label, color: metric.color },
                    }
                    return (
                      <div key={metric.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <ChartContainer config={chartConfig} className="h-28 w-full">
                          <LineChart data={metric.chartData} margin={{ left: 0, right: 4, top: 6, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={6} />
                            <YAxis hide domain={["dataMin - 4", "dataMax + 4"]} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const data = payload[0].payload as MetricPoint
                                return (
                                  <div className="rounded-md border bg-background px-2 py-1 shadow-sm">
                                    <p className="text-xs font-medium">{metric.label}: {data.label || data.value}</p>
                                    <p className="text-xs text-muted-foreground">Day {data.day}</p>
                                  </div>
                                )
                              }}
                            />
                            <Line
                              dataKey="value"
                              type="monotone"
                              stroke="var(--color-value)"
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ChartContainer>
                        <p className="text-xs text-muted-foreground">{metric.trendLabel}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 종합 건강 점수 카드 */}
            {healthTrend && healthTrend.healthScore !== null && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                        <Heart className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-muted-foreground">종합 건강 점수</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground transition">
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 text-sm" side="top">
                              <div className="space-y-2">
                                <p className="font-semibold">건강 점수 산정 방법</p>
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                  최근 7일간의 진단 설문 결과를 기반으로 계산됩니다.
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  <li>• 정상 응답 비율이 높을수록 점수 상승</li>
                                  <li>• 이상 증상이 많을수록 점수 하락</li>
                                  <li>• 90점 이상: 매우 양호</li>
                                  <li>• 70-89점: 양호</li>
                                  <li>• 50-69점: 주의 필요</li>
                                  <li>• 50점 미만: 관리 필요</li>
                                </ul>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{healthTrend.healthScore}점</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">최근 7일 기준</p>
                      <p className="text-xs text-muted-foreground">진단 {healthTrend.totalDiagnoses}회 완료</p>
                    </div>
                  </div>
                  <Progress value={healthTrend.healthScore} className="mt-3 h-2" />
                </CardContent>
              </Card>
            )}

            {/* 위험도 카드 (UpdatedContextTable) */}
            {healthContext && (
              <Card className={healthContext.riskLevel?.toLowerCase() === 'high' ? 'border-red-500/50 bg-red-500/5' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      AI 프로필 분석
                    </CardTitle>
                    <Badge className={`${getRiskLevelColor(healthContext.riskLevel)} text-white`}>
                      위험도: {getRiskLevelText(healthContext.riskLevel)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {healthContext.summary}
                  </p>
                  {healthContext.riskTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {healthContext.riskTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 최근 이상 증상 */}
            {healthTrend && healthTrend.recentSymptoms.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    최근 관찰된 증상
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {healthTrend.recentSymptoms.map((symptom) => (
                      <Badge key={symptom} variant="secondary" className="text-xs">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 오늘의 관찰 포인트 */}
            {healthContext?.todayObservations && healthContext.todayObservations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    오늘의 관찰 포인트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {healthContext.todayObservations.map((observation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{observation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 인사이트 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">인사이트 / 권장 행동</CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.insights?.length ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {summary.insights.map((insight) => (
                      <li key={insight}>• {insight}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">기록이 더 필요해요. 꾸준히 체크인을 남겨 주세요.</p>
                )}
              </CardContent>
            </Card>

            {/* 일일 리포트 */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">일일 리포트</h2>
                {dailyReports.length > 0 && (
                  <Link
                    href="/reports"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition"
                  >
                    전체 보기 ({dailyReports.length})
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {dailyReports.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    아직 일일 리포트가 없어요. 진단 설문을 완료하면 자동 생성돼요.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {dailyReports.slice(0, 2).map((report) => (
                    <Link key={report.id} href={`/reports/${report.id}`}>
                      <Card className="hover:bg-muted/40 transition-colors">
                        <CardContent className="py-1 px-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium text-foreground">{report.dateLabel}</p>
                              <p className="text-xs text-muted-foreground">{report.summary}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge level={report.status} size="sm" />
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 기록/도움 */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">기록/도움</h2>
              <div className="space-y-2">
                {careItems.map((item) => (
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
            </section>

            {/* 웹캠 모니터링 */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">펫캠 모니터링</h2>
              <Link href={webcamItem.href}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <webcamItem.icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{webcamItem.label}</p>
                          <p className="text-xs text-muted-foreground">{webcamItem.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
