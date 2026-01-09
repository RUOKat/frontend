"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/app/status-badge"
import { useActiveCat } from "@/contexts/active-cat-context"
import { getMockWeeklyReportsWithPagination, type WeeklyReport } from "@/lib/okat-data"

export default function WeeklyReportsPage() {
  const { activeCat, activeCatId } = useActiveCat()
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const loadReports = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return
    
    setLoading(true)
    
    // 실제로는 API 호출이지만, 여기서는 더미 데이터 사용
    const newReports = getMockWeeklyReportsWithPagination(activeCatId, pageNum)
    
    if (newReports.length === 0) {
      setHasMore(false)
    } else {
      setReports(prev => reset ? newReports : [...prev, ...newReports])
    }
    
    setLoading(false)
  }, [activeCatId, loading])

  useEffect(() => {
    setReports([])
    setPage(1)
    setHasMore(true)
    loadReports(1, true)
  }, [activeCatId])

  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return
    
    const scrollTop = document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = document.documentElement.clientHeight
    
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      const nextPage = page + 1
      setPage(nextPage)
      loadReports(nextPage)
    }
  }, [loading, hasMore, page, loadReports])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-safe-top border-b border-border">
        <div className="py-4 flex items-center gap-3">
          <Link href="/okat" className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted/40">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">주간 리포트 기록</h1>
            <p className="text-xs text-muted-foreground">{activeCat?.name || "고양이"}의 모든 주간 리포트</p>
          </div>
        </div>
      </header>

      <main className="px-6 pb-24 space-y-4">
        {reports.length === 0 && !loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">아직 주간 리포트가 없어요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`}>
                <Card className="hover:bg-muted/40 transition-colors">
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{report.rangeLabel}</p>
                        <p className="text-xs text-muted-foreground">{report.summary}</p>
                        {report.score != null && (
                          <p className="text-xs text-muted-foreground">데이터 충분도 {report.score}%</p>
                        )}
                      </div>
                      <StatusBadge level={report.status} size="sm" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {loading && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">리포트를 불러오는 중...</p>
          </div>
        )}

        {!hasMore && reports.length > 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">모든 리포트를 확인했어요.</p>
          </div>
        )}
      </main>
    </div>
  )
}