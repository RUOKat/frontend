"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/app/status-badge"
import { useActiveCat } from "@/contexts/active-cat-context"
import { fetchDailyReports, type DailyReport } from "@/lib/backend-care"
import { ArrowLeft, Loader2, Calendar } from "lucide-react"

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { activeCat, activeCatId } = useActiveCat()
  const [report, setReport] = useState<DailyReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reportId = params.id as string

  useEffect(() => {
    async function loadReport() {
      if (!activeCatId) return

      setIsLoading(true)
      try {
        const reports = await fetchDailyReports(activeCatId)
        const found = reports.find((r) => r.id === reportId)
        setReport(found || null)
      } catch (error) {
        console.error("Failed to load report:", error)
        setReport(null)
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
        </div>
      </header>

      <main className="px-6 py-6 pb-24 space-y-4">
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
                  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="text-sm text-foreground mb-2 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside text-sm mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-sm mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-3 my-2 text-sm text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                  ),
                  hr: () => <hr className="my-4 border-border" />,
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
