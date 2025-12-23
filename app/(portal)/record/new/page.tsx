"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { loadDailyRecords, saveDailyRecords } from "@/lib/storage"
import type { DailyRecord } from "@/lib/types"
import { ArrowLeft, Droplets, Activity, Utensils, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function NewRecordPage() {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [urineCount, setUrineCount] = useState(2)
  const [poopCount, setPoopCount] = useState(1)
  const [poopConsistency, setPoopConsistency] = useState<"hard" | "normal" | "soft" | "liquid">("normal")
  const [foodIntake, setFoodIntake] = useState<"none" | "little" | "normal" | "much">("normal")
  const [waterIntake, setWaterIntake] = useState<"none" | "little" | "normal" | "much">("normal")
  const [activityLevel, setActivityLevel] = useState<"low" | "normal" | "high">("normal")
  const [vomiting, setVomiting] = useState(false)
  const [vomitCount, setVomitCount] = useState(1)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null)

  useEffect(() => {
    const records = loadDailyRecords<DailyRecord>()
    const todayRecord = records.find((r) => r.date === today)
    if (todayRecord) {
      setExistingRecordId(todayRecord.id)
      setUrineCount(todayRecord.urineCount)
      setPoopCount(todayRecord.poopCount)
      setPoopConsistency(todayRecord.poopConsistency || "normal")
      setFoodIntake(todayRecord.foodIntake)
      setWaterIntake(todayRecord.waterIntake)
      setActivityLevel(todayRecord.activityLevel)
      setVomiting(todayRecord.vomiting)
      setVomitCount(todayRecord.vomitCount || 1)
      setNotes(todayRecord.notes || "")
    }
  }, [today])

  const handleSubmit = () => {
    setIsSubmitting(true)

    const records = loadDailyRecords<DailyRecord>()
    const newRecord: DailyRecord = {
      id: existingRecordId || `record-${Date.now()}`,
      date: today,
      urineCount,
      poopCount,
      poopConsistency,
      foodIntake,
      waterIntake,
      activityLevel,
      vomiting,
      vomitCount: vomiting ? vomitCount : undefined,
      notes: notes.trim() || undefined,
      createdAt: existingRecordId
        ? records.find((r) => r.id === existingRecordId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    }

    if (existingRecordId) {
      const index = records.findIndex((r) => r.id === existingRecordId)
      if (index !== -1) {
        records[index] = newRecord
      }
    } else {
      records.unshift(newRecord)
    }

    saveDailyRecords(records)
    router.push("/record")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="px-6 pt-safe-top border-b border-border">
        <div className="py-4 flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="flex-shrink-0">
            <Link href="/record">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{existingRecordId ? "오늘 기록 수정" : "오늘 기록"}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            </p>
          </div>
        </div>
      </header>

      {/* 폼 */}
      <main className="px-6 py-4 pb-24 space-y-4">
        {/* 배변 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              배변
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 소변 횟수 */}
            <div className="space-y-2">
              <Label>소변 횟수</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="bg-transparent"
                  onClick={() => setUrineCount(Math.max(0, urineCount - 1))}
                >
                  -
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{urineCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="bg-transparent"
                  onClick={() => setUrineCount(urineCount + 1)}
                >
                  +
                </Button>
                <span className="text-sm text-muted-foreground">회</span>
              </div>
            </div>

            {/* 대변 횟수 */}
            <div className="space-y-2">
              <Label>대변 횟수</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="bg-transparent"
                  onClick={() => setPoopCount(Math.max(0, poopCount - 1))}
                >
                  -
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{poopCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="bg-transparent"
                  onClick={() => setPoopCount(poopCount + 1)}
                >
                  +
                </Button>
                <span className="text-sm text-muted-foreground">회</span>
              </div>
            </div>

            {/* 대변 상태 */}
            {poopCount > 0 && (
              <div className="space-y-2">
                <Label>대변 상태</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: "hard", label: "딱딱함" },
                    { value: "normal", label: "정상" },
                    { value: "soft", label: "무름" },
                    { value: "liquid", label: "설사" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={poopConsistency === option.value ? "default" : "outline"}
                      className={poopConsistency !== option.value ? "bg-transparent" : ""}
                      onClick={() => setPoopConsistency(option.value as typeof poopConsistency)}
                      size="sm"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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
          <CardContent className="space-y-4">
            {/* 식사량 */}
            <div className="space-y-2">
              <Label>식사량</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "none", label: "안 먹음" },
                  { value: "little", label: "조금" },
                  { value: "normal", label: "보통" },
                  { value: "much", label: "많이" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={foodIntake === option.value ? "default" : "outline"}
                    className={foodIntake !== option.value ? "bg-transparent" : ""}
                    onClick={() => setFoodIntake(option.value as typeof foodIntake)}
                    size="sm"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 음수량 */}
            <div className="space-y-2">
              <Label>음수량</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "none", label: "안 마심" },
                  { value: "little", label: "조금" },
                  { value: "normal", label: "보통" },
                  { value: "much", label: "많이" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={waterIntake === option.value ? "default" : "outline"}
                    className={waterIntake !== option.value ? "bg-transparent" : ""}
                    onClick={() => setWaterIntake(option.value as typeof waterIntake)}
                    size="sm"
                  >
                    {option.label}
                  </Button>
                ))}
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
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "low", label: "낮음" },
                { value: "normal", label: "보통" },
                { value: "high", label: "활발" },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={activityLevel === option.value ? "default" : "outline"}
                  className={activityLevel !== option.value ? "bg-transparent" : ""}
                  onClick={() => setActivityLevel(option.value as typeof activityLevel)}
                  size="sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 구토 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              이상 증상
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="vomiting">구토 여부</Label>
              <Switch id="vomiting" checked={vomiting} onCheckedChange={setVomiting} />
            </div>

            {vomiting && (
              <div className="space-y-2">
                <Label>구토 횟수</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    onClick={() => setVomitCount(Math.max(1, vomitCount - 1))}
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold w-8 text-center">{vomitCount}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="bg-transparent"
                    onClick={() => setVomitCount(vomitCount + 1)}
                  >
                    +
                  </Button>
                  <span className="text-sm text-muted-foreground">회</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 메모 */}
        <Card>
          <CardContent className="pt-4">
            <Label htmlFor="notes">메모 (선택)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항이 있다면 적어주세요"
              rows={3}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </main>

      {/* 하단 CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-12" size="lg">
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  )
}
