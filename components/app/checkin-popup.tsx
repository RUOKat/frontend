"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useOnboarding } from "@/contexts/onboarding-context"
import {
  appendCheckinAnswer,
  getCheckinPopupDismissed,
  getTodayISO,
  setCheckinPopupDismissed,
  updateMonthlyCare,
  type MonthlyCareRecord,
} from "@/lib/care-monthly"

const QUESTIONS = [
  {
    id: "q1",
    text: "최근 24시간 동안 식욕이 평소와 달랐나요?",
    options: ["아니요", "조금", "많이"],
  },
  {
    id: "q2",
    text: "배변/배뇨 패턴이 평소와 달랐나요?",
    options: ["아니요", "조금", "많이"],
  },
  {
    id: "q3",
    text: "활동량이 지난주보다 줄었나요?",
    options: ["아니요", "조금", "많이"],
  },
]

interface CheckinPopupProps {
  catId?: string | null
  catName?: string
  onCheckinSaved?: (record: MonthlyCareRecord) => void
}

// 체크인 팝업 비활성화됨 - 나중에 활성화하려면 아래 주석 해제
export function CheckinPopup({ catId, catName, onCheckinSaved }: CheckinPopupProps) {
  // 비활성화: 항상 null 반환
  return null

  /* 체크인 팝업 원본 코드 - 비활성화됨
  const { onboardingCompleted } = useOnboarding()
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const isComplete = QUESTIONS.every((question) => Boolean(answers[question.id]))
  const displayName = catName || "고양이"

  useEffect(() => {
    if (!onboardingCompleted) return
    if (getCheckinPopupDismissed(catId ?? undefined)) return

    const timer = window.setTimeout(() => {
      setOpen(true)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [onboardingCompleted, catId])

  const handleDismiss = () => {
    setCheckinPopupDismissed(getTodayISO(), catId ?? undefined)
    setOpen(false)
  }

  const handleSubmit = () => {
    if (!isComplete) return
    const today = getTodayISO()
    appendCheckinAnswer({ date: today, answers }, catId ?? undefined)
    const updatedRecord = updateMonthlyCare(today, catId ?? undefined)
    onCheckinSaved?.(updatedRecord)
    setCheckinPopupDismissed(today, catId ?? undefined)
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && open) {
      handleDismiss()
      return
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>오늘의 짧은 체크인(1~2분)</DialogTitle>
          <DialogDescription>{displayName}의 상태를 확인하기 위해 짧은 질문이 있어요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {QUESTIONS.map((question) => (
            <div key={question.id} className="space-y-2">
              <p className="text-sm font-medium text-foreground">{question.text}</p>
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: value,
                  }))
                }
                className="grid grid-cols-3 gap-2"
              >
                {question.options.map((option, index) => {
                  const optionId = `${question.id}-option-${index}`
                  return (
                    <div key={option} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                      <RadioGroupItem id={optionId} value={option} />
                      <Label htmlFor={optionId}>{option}</Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={handleDismiss}>
            나중에
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!isComplete}>
            제출
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
  */
}
