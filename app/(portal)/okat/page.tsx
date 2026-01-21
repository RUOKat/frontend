"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { RiskCard } from "@/components/app/risk-card"
import { StatusBadge } from "@/components/app/status-badge"
import { CatSelector } from "@/components/app/cat-selector"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { getMockWeeklyReports, type OkatSummary, type WeeklyReport } from "@/lib/okat-data"
import { fetchMonthlyStats, type MonthlyStats } from "@/lib/backend-care"
import { Camera, ChevronRight, ClipboardList, Loader2 } from "lucide-react"
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
}

export default function OkatDashboardPage() {
  const { activeCat, activeCatId } = useActiveCat()
  const { riskStatus } = useOnboarding()
  const [summary, setSummary] = useState<OkatSummary | null>(null)
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const weeklyReportsKey = useMemo(() => ["weeklyReports", activeCatId], [activeCatId])

  // 월간 통계 로드
  const loadMonthlyStats = useCallback(async () => {
    if (!activeCatId) return
    
    setIsLoading(true)
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      
      const stats = await fetchMonthlyStats(activeCatId, year, month)
      setMonthlyStats(stats)
      
      // 통계 기반으로 summary 생성
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
          coverage: { daysWithData: totalRecords, totalDays: now.getDate() },
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
              label: "배변", 
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
      console.error('Failed to load monthly stats:', error)
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [activeCatId])

  useEffect(() => {
    loadMonthlyStats()
    setWeeklyReports(getMockWeeklyReports(activeCatId))
  }, [weeklyReportsKey, activeCatId, loadMonthlyStats])

  const coverageLabel = summary
    ? `최근 ${summary.coverage.totalDays}일 중 ${summary.coverage.daysWithData}일 기록`
    : "최근 기록이 없어요"
  const fallbackMetricTrendLabel = summary?.coverage?.daysWithData
    ? `최근 ${summary.coverage.daysWithData}일 기준`
    : "기록 데이터 부족"
  const displayMetrics = summary?.metrics?.length
    ? summary.metrics
    : [
        { id: "food", label: "식사량", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
        { id: "water", label: "음수량", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
        { id: "stool", label: "배변", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
        { id: "weight", label: "체중", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
      ]
  const chartColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"]
  
  // 실제 일별 데이터로 차트 데이터 생성
  const metricsWithChart = displayMetrics.map((metric, index) => {
    let chartData: MetricPoint[] = []
    
    if (monthlyStats?.dailyData && monthlyStats.dailyData.length > 0) {
      // 실제 데이터 사용
      chartData = monthlyStats.dailyData.map((d) => {
        let value = 50 // 기본값
        if (metric.id === 'food') value = d.food
        else if (metric.id === 'water') value = d.water
        else if (metric.id === 'stool') value = d.stool
        else if (metric.id === 'urine') value = d.urine
        else if (metric.id === 'weight' && d.weight !== null) value = d.weight * 10 // 체중은 스케일 조정
        return { day: d.day, value }
      })
    } else {
      // 데이터 없으면 빈 차트
      chartData = [{ day: 1, value: 50 }]
    }
    
    return {
      ...metric,
      chartData,
      color: chartColors[index % chartColors.length],
    }
  })

  const careItems = [
    {
      icon: ClipboardList,
      label: "병원 방문 기록",
      description: "방문 기록 정리",
      href: "/vet-history",
    },
  ]
  const webcamItem = {
    icon: Camera,
    label: "웹캠 모니터링",
    description: "실시간 관찰",
    href: "/webcam",
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-safe-top">
        <div className="py-6">
          <h1 className="text-xl font-bold text-foreground">누적 데이터 대시보드</h1>
          <p className="text-sm text-muted-foreground mt-1">기록 기반으로 현재 변화를 살펴봅니다.</p>
        </div>
      </header>

      <main className="px-6 pb-24 space-y-4">
        <Card className="py-3">
          <CardContent className="py-2">
            <CatSelector embedded primaryAction="edit" />
          </CardContent>
        </Card>

        {riskStatus && <RiskCard riskStatus={riskStatus} catName={activeCat?.name} />}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">현재 상태 요약</CardTitle>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">핵심 지표</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-3">
              {metricsWithChart.map((metric) => {
                const chartConfig = {
                  value: {
                    label: metric.label,
                    color: metric.color,
                  },
                }
                return (
                  <div key={metric.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <ChartContainer config={chartConfig} className="h-28 w-full">
                      <LineChart data={metric.chartData} margin={{ left: 0, right: 4, top: 6, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={6} />
                        <YAxis
                          hide
                          domain={["dataMin - 4", "dataMax + 4"]}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const data = payload[0].payload as MetricPoint
                            return (
                              <div className="rounded-md border bg-background px-2 py-1 shadow-sm">
                                <p className="text-xs font-medium">{metric.label}: {data.value}</p>
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
                    <span className="sr-only">{metric.changePercent}%</span>
                  </div>
                )
              })}
            </div>
            )}
          </CardContent>
        </Card>

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

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">주간 리포트</h2>
            {weeklyReports.length > 1 && (
              <Link
                href="/reports"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
              >
                이전 리포트 보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {weeklyReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                아직 주간 리포트가 없어요. 7일 이상 기록하면 자동 생성돼요.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* 최신 리포트 1개만 표시 */}
              {weeklyReports.slice(0, 1).map((report) => (
                <Link key={report.id} href={`/reports/${report.id}`}>
                  <Card className="hover:bg-muted/40 transition-colors">
                    <CardContent className="py-1 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">{report.rangeLabel}</p>
                          <p className="text-xs text-muted-foreground">{report.summary}</p>
                          {report.score != null && (
                            <p className="text-xs text-muted-foreground">데이터 충분도 {report.score}%</p>
                          )}
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

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">웹캠 모니터링</h2>
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
      </main>
    </div>
  )
}
