"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { RiskCard } from "@/components/app/risk-card"
import { StatusBadge } from "@/components/app/status-badge"
import { CatSelector } from "@/components/app/cat-selector"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { getMockOkatSummary, getMockWeeklyReports, type OkatMetric, type OkatSummary, type WeeklyReport } from "@/lib/okat-data"
import { Camera, ChevronDown, ChevronRight, ChevronUp, ClipboardList, Share2, ShieldCheck } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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

function seedFromText(value: string): number {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

function buildMetricSeries(metric: OkatMetric, days: number, seed: number, withVariation: boolean): MetricPoint[] {
  const totalDays = Math.max(2, days || 7)
  const baseValue = 100
  return Array.from({ length: totalDays }, (_, index) => {
    const progress = totalDays === 1 ? 1 : index / (totalDays - 1)
    const wobble = withVariation ? Math.sin((seed + index) * 1.4) * 2.5 : 0
    const value = baseValue + metric.changePercent * progress + wobble
    return { day: index + 1, value: Math.round(value * 10) / 10 }
  })
}

export default function OkatDashboardPage() {
  const { activeCat, activeCatId } = useActiveCat()
  const { riskStatus } = useOnboarding()
  const [summary, setSummary] = useState<OkatSummary | null>(null)
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [showAllWeeklyReports, setShowAllWeeklyReports] = useState(false)

  const summaryKey = useMemo(() => ["okatSummary", activeCatId], [activeCatId])
  const weeklyReportsKey = useMemo(() => ["weeklyReports", activeCatId], [activeCatId])

  useEffect(() => {
    setSummary(getMockOkatSummary(activeCatId))
    setWeeklyReports(getMockWeeklyReports(activeCatId))
  }, [summaryKey, weeklyReportsKey, activeCatId])

  const coverageLabel = summary
    ? `최근 ${summary.coverage.totalDays}일 중 ${summary.coverage.daysWithData}일 기록`
    : "최근 기록이 없어요"
  const fallbackMetricTrendLabel = summary?.coverage?.daysWithData
    ? `최근 ${summary.coverage.daysWithData}일 기준`
    : "기록 데이터 부족"
  const displayMetrics = summary?.metrics?.length
    ? summary.metrics
    : [
        { id: "appetite", label: "식욕", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
        { id: "water", label: "음수", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
        { id: "litter", label: "배변", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
        { id: "activity", label: "활동량", changePercent: 0, trendLabel: fallbackMetricTrendLabel },
      ]
  const chartDays = summary?.coverage?.totalDays ?? 7
  const hasMetricData = Boolean(summary?.metrics?.length)
  const chartColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"]
  const metricsWithChart = displayMetrics.map((metric, index) => {
    const seed = seedFromText(`${activeCatId ?? "cat"}-${metric.id}`)
    return {
      ...metric,
      chartData: buildMetricSeries(metric, chartDays, seed, hasMetricData),
      color: chartColors[index % chartColors.length],
    }
  })
  const visibleWeeklyReports = showAllWeeklyReports ? weeklyReports : weeklyReports.slice(0, 1)

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

  const careShareStartAt = activeCat?.careShareStartAt
  const careShareEndAt =
    activeCat?.dataSharing?.expiresAt ? new Date(activeCat.dataSharing.expiresAt).getTime() : activeCat?.careShareEndAt
  const now = Date.now()
  const isSharePeriodExpired = typeof careShareEndAt === "number" && careShareEndAt < now
  const shareActive =
    activeCat?.dataSharing?.enabled != null
      ? activeCat.dataSharing.enabled && !isSharePeriodExpired
      : (isAgencyAdoption && !isSharePeriodExpired)
  const shareStatusLabel = isSharePeriodExpired ? "종료됨" : shareActive ? "공유 중" : "선택 안 함"
  const shareRangeLabel = activeCat?.dataSharing?.required
    ? "상태 신호만"
    : activeCat?.dataSharing?.enabled
      ? "상태 요약"
      : "미설정"
  const carePeriodLabel =
    isAgencyAdoption && careShareStartAt && careShareEndAt
      ? `${formatDateTime(String(careShareStartAt))} ~ ${formatDateTime(String(careShareEndAt))}`
      : isAgencyAdoption
        ? "1년 공동 케어"
        : "기본 제공"

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
                        <Line
                          dataKey="value"
                          type="monotone"
                          stroke="var(--color-value)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                    <p className="text-xs text-muted-foreground">{metric.trendLabel}</p>
                    <span className="sr-only">{metric.changePercent}%</span>
                  </div>
                )
              })}
            </div>
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
              <button
                type="button"
                onClick={() => setShowAllWeeklyReports((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                aria-expanded={showAllWeeklyReports}
              >
                {showAllWeeklyReports ? "접기" : "이전 리포트 보기"}
                {showAllWeeklyReports ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
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
              {visibleWeeklyReports.map((report) => (
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

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">케어 프로그램/기관 공유</h2>
          <Card>
            <CardContent className="py-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isAgencyAdoption ? "입양 초기 공동 케어" : "기본 케어 흐름"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAgencyAdoption
                        ? "입양 초기 1년간 함께 케어하는 기간입니다."
                        : "지속적인 체크인과 기록을 기본으로 제공합니다."}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{carePeriodLabel}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">기관 공유 상태</p>
                    <p className="text-xs text-muted-foreground">원하시면 공유 범위를 조절할 수 있어요.</p>
                  </div>
                </div>
                <span className="text-sm text-foreground">{shareStatusLabel}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>공유 범위</span>
                <span className="text-foreground">{shareRangeLabel}</span>
              </div>

              <Link
                href="/onboarding/consent"
                className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted/50"
              >
                공유 설정 보기
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
