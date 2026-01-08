"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/app/status-badge"
import { useActiveCat } from "@/contexts/active-cat-context"
import { getMockWeeklyReportDetail, type WeeklyReportDetail } from "@/lib/okat-data"

export default function WeeklyReportDetailPage() {
  const params = useParams()
  const weekId = Array.isArray(params.weekId) ? params.weekId[0] : params.weekId
  const { activeCat, activeCatId } = useActiveCat()
  const [detail, setDetail] = useState<WeeklyReportDetail | null>(null)

  const detailKey = useMemo(() => ["weeklyReportDetail", activeCatId, weekId], [activeCatId, weekId])

  useEffect(() => {
    if (!weekId) return
    setDetail(getMockWeeklyReportDetail(activeCatId, weekId))
  }, [detailKey, activeCatId, weekId])

  if (!detail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">주간 리포트를 불러오는 중이에요.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 pt-safe-top border-b border-border">
        <div className="py-4 flex items-center gap-3">
          <Link href="/okat" className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted/40">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">주간 리포트</h1>
            <p className="text-xs text-muted-foreground">{detail.rangeLabel}</p>
          </div>
        </div>
      </header>

      <main className="px-6 pb-24 space-y-4">
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {activeCat?.profilePhoto ? (
                  <img src={activeCat.profilePhoto} alt={`${activeCat.name} 프로필`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-primary">{activeCat?.name?.slice(0, 1) || "냥"}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">현재 선택된 고양이</p>
                <p className="text-base font-semibold text-foreground">{activeCat?.name || "고양이"}</p>
              </div>
              <StatusBadge level={detail.status} size="sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">주요 변화</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {detail.highlights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
