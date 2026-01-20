"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { generateOnboardingQuestions } from "@/lib/questions"
import { evaluateSuspicion } from "@/lib/triage"
import { computeRiskStatus } from "@/lib/risk"
import { getTodayISO, updateMonthlyCare } from "@/lib/care-monthly"
import type { Question, OnboardingAnswers } from "@/lib/types"
import { MessageCircle, ArrowRight, ArrowLeft, HelpCircle } from "lucide-react"
import { submitCheckIn } from "@/lib/backend-care"

export default function QuestionsPage() {
  const router = useRouter()
  const { activeCat, activeCatId } = useActiveCat()
  const { setOnboardingAnswers, setFollowUpPlan, setRiskStatus } = useOnboarding()

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswers>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (activeCat) {
      generateOnboardingQuestions(activeCat).then(generatedQuestions => {
        setQuestions(generatedQuestions)
      })
    }
  }, [activeCat])

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1
  const hasCurrentAnswer = currentQuestion && answers[currentQuestion.id]

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleNext = () => {
    if (!hasCurrentAnswer) return

    if (isLastQuestion) {
      handleComplete()
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleComplete = async () => {
    if (!activeCat || !activeCatId) return

    setIsSubmitting(true)
    
    try {
      // 1. 답변 저장
      setOnboardingAnswers(answers)

      // 2. 백엔드에 체크인 기록 저장 (questions + answers)
      await submitCheckIn(activeCatId, questions, answers)

      // 3. 의심 평가
      const followUp = await evaluateSuspicion(activeCat, answers)
      updateMonthlyCare(getTodayISO(), activeCatId ?? undefined)

      if (followUp) {
        // 의심 징후가 있으면 follow-up 필요
        setFollowUpPlan(followUp)
        router.push("/onboarding/follow-up")
      } else {
        // 의심 징후 없으면 바로 완료
        const risk = computeRiskStatus(activeCat, answers, null, null)
        setRiskStatus(risk)
        router.push("/")
      }
    } catch (error) {
      console.error('Failed to submit check-in:', error)
      setIsSubmitting(false)
      // Still allow navigation even if API fails
      const followUp = await evaluateSuspicion(activeCat, answers)
      updateMonthlyCare(getTodayISO(), activeCatId ?? undefined)

      if (followUp) {
        setFollowUpPlan(followUp)
        router.push("/onboarding/follow-up")
      } else {
        const risk = computeRiskStatus(activeCat, answers, null, null)
        setRiskStatus(risk)
        router.push("/")
      }
    }
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">질문을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 헤더 */}
      <header className="flex-shrink-0 px-6 pt-safe-top">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">몇 가지만 더 물어볼게요</h1>
              <p className="text-xs text-muted-foreground">맞춤 설문</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">기본정보를 바탕으로, 우리 아이에게 중요한 신호만 골랐어요.</p>
        </div>

        {/* 진행률 */}
        <div className="space-y-2 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {currentIndex + 1} / {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </header>

      {/* 질문 */}
      <main className="flex-1 px-6 pb-24">
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0 space-y-6">
            {/* 질문 텍스트 */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground leading-relaxed">{currentQuestion.text}</h2>
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{currentQuestion.description}</span>
              </div>
            </div>

            {/* 선택지 */}
            <div className="space-y-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    answers[currentQuestion.id] === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span
                    className={`font-medium ${answers[currentQuestion.id] === option.value ? "text-primary" : "text-foreground"}`}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="flex-shrink-0 bg-transparent"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button onClick={handleNext} disabled={!hasCurrentAnswer || isSubmitting} className="flex-1 h-12" size="lg">
            {isSubmitting ? "처리 중..." : isLastQuestion ? "완료" : "다음"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
