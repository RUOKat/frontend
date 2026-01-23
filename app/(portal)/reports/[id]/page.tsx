"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/app/status-badge"
import { useActiveCat } from "@/contexts/active-cat-context"
import { fetchDailyReports, type DailyReport } from "@/lib/backend-care"
import { ArrowLeft, Loader2, Calendar, ChevronRight, FileText } from "lucide-react"

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { activeCat, activeCatId } = useActiveCat()
  const [report, setReport] = useState<DailyReport | null>(null)
  const [allReports, setAllReports] = useState<DailyReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const reportId = params.id as string

  useEffect(() => {
    async function loadReport() {
      if (!activeCatId) return

      setIsLoading(true)
      try {
        const reports = await fetchDailyReports(activeCatId)
        setAllReports(reports)
        const found = reports.find((r) => r.id === reportId)
        setReport(found || null)
      } catch (error) {
        console.error("Failed to load report:", error)
        setReport(null)
        setAllReports([])
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [activeCatId, reportId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <header className="px-6 pt-safe-top">
          <div className="py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">리포트를 찾을 수 없어요</h1>
          </div>
        </header>
        <main className="px-6 pb-24">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              요청한 리포트를 찾을 수 없습니다.
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-safe-top border-b border-border">
        <div className="py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">일일 리포트</h1>
            <p className="text-xs text-muted-foreground">{activeCat?.name}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs"
          >
            <FileText className="w-4 h-4 mr-1" />
            과거 내역
          </Button>
        </div>
      </header>

      <main className="px-6 py-6 pb-24 space-y-4">
        {/* 과거 리포트 목록 */}
        {showHistory && allReports.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                과거 리포트 목록
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {allReports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      router.push(`/reports/${r.id}`)
                      setShowHistory(false)
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition ${
                      r.id === reportId
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{r.dateLabel}</span>
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge level={r.status} size="sm" />
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">{report.dateLabel}</CardTitle>
              </div>
              <StatusBadge level={report.status} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{report.date}</p>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mt-6 mb-3 text-primary border-b border-primary/20 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold mt-5 mb-2 text-foreground flex items-center gap-2">
                      <span className="w-1 h-5 bg-primary rounded-full" />
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mt-4 mb-2 text-foreground/90">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-none text-sm mb-3 space-y-2 pl-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal text-sm mb-3 space-y-2 pl-5 marker:text-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-foreground/80 pl-1">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-amber-600 dark:text-amber-400">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="not-italic font-semibold text-rose-400 dark:text-rose-400">{children}</em>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 pl-4 pr-3 py-2 my-3 rounded-r-lg">
                      <div className="text-sm text-amber-800 dark:text-amber-200">{children}</div>
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-semibold">
                      {children}
                    </code>
                  ),
                  hr: () => <hr className="my-5 border-border/50" />,
                }}
              >
                {report.fullReport}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
