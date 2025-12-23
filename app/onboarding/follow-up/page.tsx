"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useCatProfile } from "@/contexts/cat-profile-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { computeRiskStatus } from "@/lib/risk"
import { getCategoryName } from "@/lib/triage"
import type { OnboardingAnswers } from "@/lib/types"
import { Stethoscope, ArrowRight, ArrowLeft, HelpCircle, AlertTriangle } from "lucide-react"

export default function FollowUpPage() {
  const router = useRouter()
  const { catProfile } = useCatProfile()
  const { onboardingAnswers, followUpPlan, setFollowUpAnswers, setRiskStatus, setOnboardingCompleted } = useOnboarding()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswers>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!followUpPlan || !followUpPlan.questions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">질문을 불러오는 중...</p>
      </div>
    )
  }

  const questions = followUpPlan.questions
  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1
  const hasCurrentAnswer = currentQuestion && answers[currentQuestion.id]
  const categoryName = getCategoryName(followUpPlan.category)

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
    if (!catProfile || !onboardingAnswers) return

    setIsSubmitting(true)

    // 1. 답변 저장
    setFollowUpAnswers(answers)

    // 2. 위험도 계산
    const risk = computeRiskStatus(catProfile, onboardingAnswers, followUpPlan, answers)
    setRiskStatus(risk)

    // 3. 온보딩 완료
    setOnboardingCompleted(true)

    // 4. 홈으로
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 헤더 */}
      <header className="flex-shrink-0 px-6 pt-safe-top">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">조금만 더 확인해볼게요</h1>
              <p className="text-xs text-muted-foreground">3단계 (마지막)</p>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-medium">{categoryName}</span> 관련 신호가 보여서 확인 질문 3개만 더 물어볼게요.
              <br />
              <span className="text-xs opacity-80">(진단이 아니라 참고용이에요)</span>
            </p>
          </div>
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
            {isSubmitting ? "분석 중..." : isLastQuestion ? "완료" : "다음"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
