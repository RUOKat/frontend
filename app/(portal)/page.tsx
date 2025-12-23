"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RiskCard } from "@/components/app/risk-card"
import { useCatProfile } from "@/contexts/cat-profile-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { loadDailyRecords } from "@/lib/storage"
import type { DailyRecord } from "@/lib/types"
import { PenSquare, Calendar, TrendingUp, Droplets, Cat, Activity } from "lucide-react"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { catProfile } = useCatProfile()
  const { riskStatus } = useOnboarding()
  const [recentRecords, setRecentRecords] = useState<DailyRecord[]>([])

  useEffect(() => {
    const records = loadDailyRecords<DailyRecord>()
    setRecentRecords(records.slice(0, 3))
  }, [])

  const today = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  const todayRecord = recentRecords.find((r) => r.date === new Date().toISOString().split("T")[0])

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="bg-primary text-primary-foreground px-6 pt-safe-top pb-8">
        <div className="py-4">
          <p className="text-sm opacity-80">{today}</p>
          <h1 className="text-xl font-bold mt-1">
            안녕하세요, <span className="text-primary-foreground/90">{catProfile?.name || "고양이"}</span> 집사님!
          </h1>
        </div>
      </header>

      {/* 메인 */}
      <main className="px-6 -mt-4 pb-6 space-y-4">
        {/* 이상 신호 카드 */}
        {riskStatus && <RiskCard riskStatus={riskStatus} catName={catProfile?.name} />}

        {/* 오늘의 기록 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                오늘의 기록
              </CardTitle>
              {todayRecord && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">기록 완료</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {todayRecord ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/50 rounded-lg p-3">
                  <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-semibold">{todayRecord.urineCount}회</p>
                  <p className="text-xs text-muted-foreground">소변</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="w-5 h-5 mx-auto mb-1 text-amber-600">💩</div>
                  <p className="text-lg font-semibold">{todayRecord.poopCount}회</p>
                  <p className="text-xs text-muted-foreground">대변</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <Activity className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-semibold">
                    {todayRecord.activityLevel === "high"
                      ? "활발"
                      : todayRecord.activityLevel === "low"
                        ? "낮음"
                        : "보통"}
                  </p>
                  <p className="text-xs text-muted-foreground">활동량</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-3">아직 오늘의 기록이 없어요</p>
                <Button asChild size="sm">
                  <Link href="/record/new">
                    <PenSquare className="w-4 h-4 mr-2" />
                    기록하기
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 프로필 요약 */}
        {catProfile && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cat className="w-5 h-5 text-primary" />
                프로필
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {catProfile.profilePhoto ? (
                    <img
                      src={catProfile.profilePhoto}
                      alt={`${catProfile.name} 프로필`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Cat className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{catProfile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {catProfile.breed} · {catProfile.gender === "male" ? "수컷" : "암컷"} ·{" "}
                    {catProfile.neutered ? "중성화 완료" : "중성화 전"}
                  </p>
                  <p className="text-sm text-muted-foreground">{catProfile.weight}kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 빠른 액션 */}
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent">
            <Link href="/record/new">
              <PenSquare className="w-5 h-5" />
              <span className="text-sm">새 기록</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2 bg-transparent">
            <Link href="/history">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">기록 보기</span>
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
