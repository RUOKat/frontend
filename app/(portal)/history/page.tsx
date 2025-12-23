"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { loadDailyRecords } from "@/lib/storage"
import type { DailyRecord } from "@/lib/types"
import { Calendar, ChevronRight, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

export default function HistoryPage() {
  const [records, setRecords] = useState<DailyRecord[]>([])

  useEffect(() => {
    const loaded = loadDailyRecords<DailyRecord>()
    setRecords(loaded)
  }, [])

  const today = new Date().toISOString().split("T")[0]

  // 월별 그룹화
  const groupedRecords = records.reduce(
    (acc, record) => {
      const month = record.date.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = []
      }
      acc[month].push(record)
      return acc
    },
    {} as Record<string, DailyRecord[]>,
  )

  const months = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a))

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top">
        <div className="py-6">
          <h1 className="text-xl font-bold text-foreground">히스토리</h1>
          <p className="text-sm text-muted-foreground mt-1">모든 기록을 한눈에 확인해요</p>
        </div>
      </header>

      {/* 메인 */}
      <main className="px-6 pb-6 space-y-6">
        {/* 통계 요약 */}
        {records.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">총 {records.length}개의 기록</p>
                  <p className="text-xs text-muted-foreground">
                    첫 기록: {new Date(records[records.length - 1].date).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 기록 목록 */}
        {records.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">아직 기록이 없어요</p>
              <p className="text-muted-foreground text-sm mt-1">첫 기록을 시작해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {months.map((month) => {
              const monthDate = new Date(month + "-01")
              const monthLabel = monthDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })

              return (
                <div key={month}>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">{monthLabel}</h2>
                  <div className="space-y-2">
                    {groupedRecords[month].map((record) => {
                      const date = new Date(record.date)
                      const dateStr = date.toLocaleDateString("ko-KR", {
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
                                    <span
                                      className={`text-sm font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}
                                    >
                                      {date.getDate()}
                                    </span>
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
                                      {record.vomiting && " · 구토 있음"}
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
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
