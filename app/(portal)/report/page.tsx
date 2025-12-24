"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { loadDailyRecords } from "@/lib/storage"
import type { DailyRecord } from "@/lib/types"
import { FileText, TrendingUp, Calendar, Activity } from "lucide-react"
import { useEffect, useState } from "react"

export default function ReportPage() {
  const { activeCat, activeCatId } = useActiveCat()
  const { riskStatus } = useOnboarding()
  const [records, setRecords] = useState<DailyRecord[]>([])

  useEffect(() => {
    const loaded = loadDailyRecords<DailyRecord>(activeCatId ?? undefined)
    setRecords(loaded)
  }, [activeCatId])

  // 최근 7일 통계
  const recentRecords = records.slice(0, 7)
  const avgUrineCount =
    recentRecords.length > 0
      ? (recentRecords.reduce((sum, r) => sum + r.urineCount, 0) / recentRecords.length).toFixed(1)
      : "0"
  const avgPoopCount =
    recentRecords.length > 0
      ? (recentRecords.reduce((sum, r) => sum + r.poopCount, 0) / recentRecords.length).toFixed(1)
      : "0"
  const vomitDays = recentRecords.filter((r) => r.vomiting).length

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top">
        <div className="py-6">
          <h1 className="text-xl font-bold text-foreground">리포트</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeCat?.name || "고양이"}의 건강 분석 리포트</p>
        </div>
      </header>

      {/* 메인 */}
      <main className="px-6 pb-6 space-y-4">
        {/* 요약 */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{riskStatus?.labelKorean || "분석 중"}</p>
                <p className="text-xs text-muted-foreground">
                  {riskStatus?.summary || "기록을 더 쌓으면 분석이 정확해져요"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 최근 7일 통계 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              최근 7일 평균
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-semibold">{avgUrineCount}</p>
                <p className="text-xs text-muted-foreground">평균 소변</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-semibold">{avgPoopCount}</p>
                <p className="text-xs text-muted-foreground">평균 대변</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-lg font-semibold">{vomitDays}</p>
                <p className="text-xs text-muted-foreground">구토 일수</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 기록 현황 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              기록 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 기록 수</span>
                <span className="text-sm font-medium">{records.length}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">최근 7일 기록</span>
                <span className="text-sm font-medium">{recentRecords.length}개</span>
              </div>
              {records.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">첫 기록일</span>
                  <span className="text-sm font-medium">
                    {new Date(records[records.length - 1].date).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 활동량 분포 */}
        {recentRecords.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                활동량 분포 (7일)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-lg font-semibold text-emerald-600">
                    {recentRecords.filter((r) => r.activityLevel === "high").length}
                  </p>
                  <p className="text-xs text-emerald-600">활발</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-lg font-semibold text-amber-600">
                    {recentRecords.filter((r) => r.activityLevel === "normal").length}
                  </p>
                  <p className="text-xs text-amber-600">보통</p>
                </div>
                <div className="bg-rose-50 rounded-lg p-3">
                  <p className="text-lg font-semibold text-rose-600">
                    {recentRecords.filter((r) => r.activityLevel === "low").length}
                  </p>
                  <p className="text-xs text-rose-600">낮음</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 안내 */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            기록이 쌓일수록 더 정확한 분석이 가능해요.
            <br />
            매일 기록을 남겨보세요!
          </p>
        </div>
      </main>
    </div>
  )
}
