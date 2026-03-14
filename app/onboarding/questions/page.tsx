"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { generateOnboardingQuestions } from "@/lib/questions"
// import { evaluateSuspicion } from "@/lib/triage"  // 비활성화
// import { computeRiskStatus } from "@/lib/risk"  // 비활성화
import { getTodayISO, updateMonthlyCare } from "@/lib/care-monthly"
import type { Question, OnboardingAnswers } from "@/lib/types"
import { MessageCircle, ArrowRight, ArrowLeft, HelpCircle, Camera, X } from "lucide-react"
import { submitCheckIn } from "@/lib/backend-care"
import { createPost, uploadImage } from "@/lib/backend-posts"

export default function QuestionsPage() {
  const router = useRouter()
  const { activeCat, activeCatId } = useActiveCat()
  const { setOnboardingAnswers } = useOnboarding()
  // const { setFollowUpPlan, setRiskStatus } = useOnboarding()  // 비활성화

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswers>({})
  const [customText, setCustomText] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Cleanup blob URLs on unmount
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

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
  const isMediaQuestion = currentQuestion?.type === "photo"
  const hasCurrentAnswer = currentQuestion && (answers[currentQuestion.id] || isMediaQuestion)

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return
    
    // 이전에 입력했던 "other:" 형태에서 값 복원
    if (value === "other" && answers[currentQuestion.id]?.startsWith("other:")) {
      setCustomText(answers[currentQuestion.id].replace("other:", ""))
    } else if (value !== "other") {
      setCustomText("")
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleCustomTextChange = (text: string) => {
    if (!currentQuestion) return
    setCustomText(text)
    
    // text가 있을 때만 "other:내용" 형태로 저장, 아니면 그냥 "other" 유지 (이후 handleNext에서 validate 할 수 있게)
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: text.trim() ? `other:${text}` : "other",
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentQuestion) return

    // Cleanup old preview
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }

    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    setMediaFile(file)
    
    // answers에는 파일이 있음을 표시하기 위한 더미값 저장 (실제 업로드는 handleComplete에서)
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: "media_selected",
    }))
  }

  const removePhoto = () => {
    if (!currentQuestion) return
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoPreview(null)
    setMediaFile(null)
    setAnswers((prev) => {
      const newAnswers = { ...prev }
      delete newAnswers[currentQuestion.id]
      return newAnswers
    })
  }

  const handleNext = () => {
    if (!hasCurrentAnswer) return
    if (answers[currentQuestion.id] === "other" && !customText.trim()) return // 기타 선택 시 내용 필수 입력 방어

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
      // 💡 [수정] 용량이 큰 사진은 저장용 API에는 보내지 않음 (post 생성에서 별도 처리)
      const answersForBackend = { ...answers };
      delete answersForBackend['q7_photo'];
      await submitCheckIn(activeCatId, questions, answersForBackend);

      // 3. 월간 케어 기록 업데이트
      updateMonthlyCare(getTodayISO(), activeCatId ?? undefined)

      // 4. 미디어가 있으면 업로드 후 커뮤니티 게시물 자동 생성
      if (mediaFile && activeCatId) {
        try {
          // backend-posts.ts의 uploadImage 사용 (FormData 기반)
          const uploadedUrl = await uploadImage(mediaFile)
          if (uploadedUrl) {
            await createPost(activeCatId, uploadedUrl, "오늘의 기록 완료! 🐱")
          }
        } catch (postError) {
          console.error('Failed to create community post:', postError)
          // 게시물 생성 실패해도 설문 완료는 유지
        }
      }

      // 5. 홈으로 이동 (evaluateSuspicion 비활성화)
      router.push("/")

      /* evaluateSuspicion 로직 비활성화
      const followUp = await evaluateSuspicion(activeCat, answers)

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
      */
    } catch (error) {
      console.error('Failed to submit check-in:', error)
      setIsSubmitting(false)
      // API 실패해도 홈으로 이동
      updateMonthlyCare(getTodayISO(), activeCatId ?? undefined)
      router.push("/")
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

            {/* 선택지 또는 숫자 입력 */}
            <div className="space-y-2">
              {currentQuestion.type === "number" ? (
                // 숫자 입력 (체중)
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={currentQuestion.validation?.step || 0.01}
                      min={currentQuestion.validation?.min || 0}
                      max={currentQuestion.validation?.max || 100}
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswer(e.target.value)}
                      placeholder="예: 4.25"
                      className="text-lg h-14 text-center"
                    />
                    <span className="text-lg font-medium text-muted-foreground">kg</span>
                  </div>
                  {activeCat?.weight && (
                    <p className="text-sm text-muted-foreground text-center">
                      등록된 체중: {activeCat.weight}kg
                    </p>
                  )}
                </div>
              ) : currentQuestion.type === "photo" ? (
                // 사진 업로드
                <div className="space-y-4">
                  {photoPreview ? (
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-primary/20 bg-black">
                      {mediaFile?.type.startsWith('video/') ? (
                        <video
                          src={photoPreview}
                          className="w-full h-full object-contain"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={photoPreview}
                          alt="오늘의 고양이"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-square w-full rounded-2xl border-2 border-dashed border-border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">사진/영상 촬영 또는 업로드</p>
                          <p className="text-xs">우리 아이의 예쁜 모습을 담아주세요</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  )}
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    사진이나 영상은 필수는 아니에요. 다음 버튼을 눌러 건너뛸 수 있습니다.
                  </p>
                </div>
              ) : (
                // 선택형 질문
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.value || answers[currentQuestion.id]?.startsWith(`${option.value}:`);
                    return (
                      <div key={option.value} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => handleAnswer(option.value)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <span
                            className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}
                          >
                            {option.label}
                          </span>
                        </button>
                        {/* 'other' 선택 시 노출되는 입력 필드 */}
                        {option.value === "other" && isSelected && (
                          <div className="pl-4 pr-1 mt-1">
                            <Input
                              type="text"
                              placeholder="어떤 증상이었는지 알려주세요"
                              value={customText}
                              onChange={(e) => handleCustomTextChange(e.target.value)}
                              autoFocus
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
          <Button onClick={handleNext} disabled={!hasCurrentAnswer || (answers[currentQuestion.id] === "other" && !customText.trim()) || isSubmitting} className="flex-1 h-12" size="lg">
            {isSubmitting ? "처리 중..." : isLastQuestion ? "완료" : "다음"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
