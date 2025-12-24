"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadDailyRecords } from "@/lib/storage"
import type { DailyRecord } from "@/lib/types"
import { useActiveCat } from "@/contexts/active-cat-context"
import { PenSquare, Calendar, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function RecordPage() {
  const { activeCatId } = useActiveCat()
  const [records, setRecords] = useState<DailyRecord[]>([])

  useEffect(() => {
    const loaded = loadDailyRecords<DailyRecord>(activeCatId ?? undefined)
    setRecords(loaded.slice(0, 7))
  }, [activeCatId])

  const today = new Date().toISOString().split("T")[0]
  const hasTodayRecord = records.some((r) => r.date === today)

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top">
        <div className="py-6">
          <h1 className="text-xl font-bold text-foreground">기록</h1>
          <p className="text-sm text-muted-foreground mt-1">매일의 건강 상태를 기록해요</p>
        </div>
      </header>

      {/* 메인 */}
      <main className="px-6 pb-6 space-y-4">
        {/* 새 기록 버튼 */}
        <Button asChild className="w-full h-14" size="lg">
          <Link href="/record/new">
            <PenSquare className="w-5 h-5 mr-2" />
            {hasTodayRecord ? "오늘 기록 수정하기" : "오늘 기록하기"}
          </Link>
        </Button>

        {/* 최근 기록 */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">최근 기록</h2>

          {records.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">아직 기록이 없어요</p>
                <p className="text-muted-foreground text-xs mt-1">첫 기록을 시작해보세요!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {records.map((record) => {
                const date = new Date(record.date)
                const dateStr = date.toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })
                const isToday = record.date === today

                return (
                  <Link key={record.id} href={`/history/${record.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${isToday ? "bg-primary/10" : "bg-muted"}`}
                            >
                              <Calendar className={`w-5 h-5 ${isToday ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {dateStr}
                                {isToday && (
                                  <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                    오늘
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                소변 {record.urineCount}회 · 대변 {record.poopCount}회
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
