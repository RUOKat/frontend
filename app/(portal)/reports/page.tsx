"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/app/status-badge"
import { useActiveCat } from "@/contexts/active-cat-context"
import { fetchDailyReports, type DailyReport } from "@/lib/backend-care"
import { ArrowLeft, Loader2, Calendar, ChevronRight, FileText } from "lucide-react"

export default function ReportsListPage() {
  const router = useRouter()
  const { activeCat, activeCatId } = useActiveCat()
  const [reports, setReports] = useState<DailyReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      if (!activeCatId) return

      setIsLoading(true)
      try {
        const data = await fetchDailyReports(activeCatId)
        setReports(data)
      } catch (error) {
        console.error("Failed to load reports:", error)
        setReports([])
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [activeCatId])

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-safe-top border-b border-border">
        <div className="py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">일일 리포트 내역</h1>
            <p className="text-xs text-muted-foreground">{activeCat?.name}</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 pb-24 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                아직 일일 리포트가 없어요.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                진단 설문을 완료하면 자동으로 생성됩니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              총 {reports.length}개의 리포트
            </p>
            {reports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`}>
                <Card className="hover:bg-muted/40 transition-colors">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">{report.dateLabel}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{report.summary}</p>
                        </div>
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
      </main>
    </div>
  )
}
