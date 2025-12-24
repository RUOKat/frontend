"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { loadDailyRecords, saveDailyRecords } from "@/lib/storage"
import type { DailyRecord } from "@/lib/types"
import { useActiveCat } from "@/contexts/active-cat-context"
import { ArrowLeft, Droplets, Utensils, Activity, AlertCircle, Trash2, PenSquare } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { activeCatId } = useActiveCat()
  const [record, setRecord] = useState<DailyRecord | null>(null)

  useEffect(() => {
    const records = loadDailyRecords<DailyRecord>(activeCatId ?? undefined)
    const found = records.find((r) => r.id === params.id)
    if (found) {
      setRecord(found)
    }
  }, [activeCatId, params.id])

  const handleDelete = () => {
    const records = loadDailyRecords<DailyRecord>(activeCatId ?? undefined)
    const filtered = records.filter((r) => r.id !== params.id)
    saveDailyRecords(filtered, activeCatId ?? undefined)
    router.push("/history")
  }

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">기록을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const date = new Date(record.date)
  const dateStr = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  const intakeLabels = {
    none: "안 먹음/마심",
    little: "조금",
    normal: "보통",
    much: "많이",
  }

  const activityLabels = {
    low: "낮음",
    normal: "보통",
    high: "활발",
  }

  const poopLabels = {
    hard: "딱딱함",
    normal: "정상",
    soft: "무름",
    liquid: "설사",
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top border-b border-border">
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="flex-shrink-0">
              <Link href="/history">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">기록 상세</h1>
              <p className="text-xs text-muted-foreground">{dateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link href="/record/new">
                <PenSquare className="w-4 h-4" />
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>기록 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* 내용 */}
      <main className="px-6 py-4 pb-6 space-y-4">
        {/* 배변 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              배변
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">소변</p>
                <p className="text-lg font-semibold">{record.urineCount}회</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">대변</p>
                <p className="text-lg font-semibold">{record.poopCount}회</p>
              </div>
              {record.poopConsistency && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">대변 상태</p>
                  <p className="text-sm font-medium">{poopLabels[record.poopConsistency]}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 식사/음수 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-500" />
              식사 & 음수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">식사량</p>
                <p className="text-sm font-medium">{intakeLabels[record.foodIntake]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">음수량</p>
                <p className="text-sm font-medium">{intakeLabels[record.waterIntake]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 활동량 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              활동량
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{activityLabels[record.activityLevel]}</p>
          </CardContent>
        </Card>

        {/* 이상 증상 */}
        {record.vomiting && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                이상 증상
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">구토 {record.vomitCount || 1}회</p>
            </CardContent>
          </Card>
        )}

        {/* 메모 */}
        {record.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">메모</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.notes}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
