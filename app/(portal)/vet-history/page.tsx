"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { loadVetVisits } from "@/lib/storage"
import type { VetVisit } from "@/lib/types"
import { useActiveCat } from "@/contexts/active-cat-context"
import { Stethoscope, Plus, ChevronRight, Calendar } from "lucide-react"

export default function VetHistoryPage() {
  const { activeCatId } = useActiveCat()
  const [visits, setVisits] = useState<VetVisit[]>([])

  useEffect(() => {
    const loaded = loadVetVisits<VetVisit>(activeCatId ?? undefined)
    setVisits(loaded)
  }, [activeCatId])

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top">
        <div className="py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">진료 기록</h1>
            <p className="text-sm text-muted-foreground mt-1">병원 방문 기록을 관리해요</p>
          </div>
          <Button size="icon" className="rounded-full">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* 메인 */}
      <main className="px-6 pb-6">
        {visits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">아직 진료 기록이 없어요</p>
              <p className="text-muted-foreground text-sm mt-1">병원 방문 후 기록을 추가해보세요</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {visits.map((visit) => {
              const date = new Date(visit.date)
              const dateStr = date.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })

              return (
                <Card key={visit.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{dateStr}</p>
                          <p className="text-xs text-muted-foreground">
                            {visit.clinic} · {visit.reason}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
