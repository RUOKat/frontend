"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { catBreeds } from "@/lib/mock"
import { uploadImage } from "@/lib/backend-uploads"
import type { AdoptionSource, CatProfile, MedicationSelection, Weekday } from "@/lib/types"

import { Cat, ArrowLeft, ArrowRight, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const adoptionPaths = ["보호소/입양기관", "지인/가족", "길에서 구조", "기타"]
const agencyAdoptionPath = adoptionPaths[0]
// const surveyFrequencyOptions = [2, 3, 4, 5, 6, 7]
const weekDays: { value: Weekday; label: string }[] = [
  { value: "mon", label: "월" },
  { value: "tue", label: "화" },
  { value: "wed", label: "수" },
  { value: "thu", label: "목" },
  { value: "fri", label: "금" },
  { value: "sat", label: "토" },
  { value: "sun", label: "일" },
]
const weekDayOrder = weekDays.map((day) => day.value)

function resolveAdoptionSource(path: string): AdoptionSource {
  if (path === adoptionPaths[0]) return "shelter"
  if (path === adoptionPaths[1]) return "private"
  if (path === adoptionPaths[2]) return "rescue"
  return "other"
}

function createCatId(): string {
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined
  const uuid = (cryptoObj as Crypto & { randomUUID?: () => string })?.randomUUID?.()
  if (uuid) return uuid
  return `cat-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function CatProfilePage() {
  const router = useRouter()
  const { activeCat, activeCatId, addCat, updateCat, deleteCat, cats } = useActiveCat()
  const { setOnboardingCompleted } = useOnboarding()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const searchParams = useSearchParams()
  const isNewCatMode = searchParams.get("mode") === "new"

  // 필수 필드
  const [name, setName] = useState("")
  const [adoptionPath, setAdoptionPath] = useState("")
  const [customAdoptionPath, setCustomAdoptionPath] = useState("")
  const [adoptionAgencyCode, setAdoptionAgencyCode] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [familyDate, setFamilyDate] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [neutered, setNeutered] = useState(true)
  const [breed, setBreed] = useState("")
  const [customBreed, setCustomBreed] = useState("")
  const [weight, setWeight] = useState("")
  // surveyFrequency와 surveyDays는 고정값 (매일)
  const surveyFrequency = "7"
  const surveyDays: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


  const hasAdoptionPath = true // 필드 제거로 인해 항상 true
  const isAgencyCodeValid = true // 필드 제거로 인해 항상 true
  const showAgencyCodeError = false
  const surveyFrequencyValue = 7 // 고정값
  const isSurveyScheduleValid = true // 항상 유효
  const isValid =
    name.trim() &&
    hasAdoptionPath &&
    isAgencyCodeValid &&
    gender &&
    breed &&
    weight


  useEffect(() => {
    if (isNewCatMode || !activeCat) return

    const storedAdoptionPath = activeCat.adoptionPath ?? ""
    const adoptionPathMatches = storedAdoptionPath && adoptionPaths.includes(storedAdoptionPath)
    setAdoptionPath(adoptionPathMatches ? storedAdoptionPath : storedAdoptionPath ? "기타" : "")
    setCustomAdoptionPath(adoptionPathMatches ? "" : storedAdoptionPath)

    const storedBreed = activeCat.breed ?? ""
    const breedMatches = storedBreed && catBreeds.includes(storedBreed)
    setBreed(breedMatches ? storedBreed : storedBreed ? "기타" : "")
    setCustomBreed(breedMatches ? "" : storedBreed)

    setName(activeCat.name ?? "")
    setAdoptionAgencyCode(activeCat.adoptionAgencyCode ?? activeCat.agencyCode ?? "")
    setBirthDate(activeCat.birthDate ?? "")
    setFamilyDate(activeCat.familyDate ?? activeCat.adoptionDate ?? "")
    setGender(activeCat.gender ?? "")
    setNeutered(activeCat.neutered ?? true)
    setWeight(activeCat.weight != null ? String(activeCat.weight) : "")
    // [주석 처리] surveyFrequency와 surveyDays는 고정값이므로 로드하지 않음
    // setSurveyFrequency(
    //   activeCat.surveyFrequencyPerWeek != null ? String(activeCat.surveyFrequencyPerWeek) : ""
    // )
    // setSurveyDays(activeCat.surveyDays ?? [])
    setProfilePhoto(activeCat.profilePhoto ?? null)
  }, [activeCat, isNewCatMode])

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setProfilePhoto(null)
      setProfilePhotoFile(null)
      return
    }

    // 파일 저장 (나중에 업로드용)
    setProfilePhotoFile(file)

    // 미리보기용 base64
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePhoto(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // [주석 처리] 설문 요일 토글 함수 - 현재 매일 고정이므로 사용하지 않음
  // const toggleSurveyDay = (day: Weekday) => {
  //   if (!surveyFrequencyValue || surveyFrequencyValue === 7) return
  //
  //   setSurveyDays((prev) => {
  //     const isSelected = prev.includes(day)
  //     if (isSelected) {
  //       return prev.filter((item) => item !== day)
  //     }
  //     if (prev.length >= surveyFrequencyValue) {
  //       return prev
  //     }
  //     const next = [...prev, day]
  //     return weekDayOrder.filter((item) => next.includes(item))
  //   })
  // }

  const handleDelete = async () => {
    if (!activeCat?.id) return

    setIsDeleting(true)
    try {
      const success = await deleteCat(activeCat.id)
      if (success) {
        setIsDeleteOpen(false)
        // 남은 고양이가 있으면 홈으로, 없으면 새 고양이 등록
        if (cats.length > 1) {
          router.push("/")
        } else {
          router.push("/onboarding/cat?mode=new")
        }
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async () => {
    if (!isValid) {
      setShowValidation(true)
      return
    }

    setIsSubmitting(true)
    const isCreating = isNewCatMode || cats.length === 0 || !activeCat
    const nextId = isCreating ? createCatId() : activeCat.id ?? activeCatId ?? createCatId()
    const profile: CatProfile = {
      id: nextId,
      name: name.trim(),
      adoptionPath: "기타", // 필드 제거로 인한 기본값 설정
      adoptionSource: "other",
      adoptionAgencyCode: undefined,
      agencyCode: undefined,
      unknownBirthday: false,
      birthDate: birthDate || undefined,
      familyDate: familyDate || undefined,
      estimatedAge: undefined,
      gender: gender as "male" | "female",
      neutered,
      breed: breed === "기타" ? customBreed : breed,
      weight: Number.parseFloat(weight),
      surveyFrequencyPerWeek: surveyFrequencyValue || undefined,
      surveyDays: surveyDays.length > 0 ? surveyDays : undefined,
      medicalHistory: undefined,
      medications: "",
      medicationText: "",
      medicationsSelected: [],
      notes: undefined,
      vetInfo: undefined,
      profilePhoto: profilePhoto || undefined,
    }

    // 새 이미지 파일이 있으면 업로드
    if (profilePhotoFile) {
      try {
        const uploadedUrl = await uploadImage(profilePhotoFile)
        if (uploadedUrl) {
          profile.profilePhoto = uploadedUrl
        }
      } catch (error) {
        console.error('Failed to upload profile photo:', error)
        // 업로드 실패해도 계속 진행 (기존 base64 사용)
      }
    }

    if (isCreating) {
      await addCat(profile)
    } else {
      updateCat(profile)
    }
    setOnboardingCompleted(true)
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 헤더 */}
      <header className="flex-shrink-0 px-4 pt-safe-top">
        <div className="py-1">
          {/* 뒤로가기 버튼 */}
          {cats.length > 0 && (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </button>
          )}
          <div className="mb-0">
            <h1 className="text-xl font-black text-foreground">{name || "우리 고양이 프로필 만들기"}</h1>
          </div>
        </div>
      </header>

      {/* 폼 */}
      <main className="flex-1 px-4 pb-16 overflow-auto">
        <div className="space-y-1.5">
          {/* 필수 항목 */}
          <Card>
            <CardContent className="pt-1.5 space-y-1.5">
              {/* 프로필 사진 */}

              <div className="space-y-2">
                <Label htmlFor="profilePhoto">프로필 사진 (선택)</Label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="고양이 프로필" className="h-full w-full object-cover" />
                    ) : (
                      <Cat className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <Input id="profilePhoto" type="file" accept="image/*" onChange={handlePhotoChange} />
                </div>
              </div>

              {/* 이름 */}
              <div className="space-y-1">
                <Label htmlFor="name">이름 <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="고양이 이름"
                  maxLength={20}
                  className={showValidation && !name.trim() ? "border-destructive ring-destructive" : ""}
                />
                {showValidation && !name.trim() && (
                  <p className="text-xs text-destructive">이름을 입력해 주세요.</p>
                )}
              </div>


              {/* 생년월일 */}
              <div className="space-y-2">
                <Label htmlFor="birthDate">생년월일</Label>
                <Input
                  type="date"
                  id="birthDate"
                  value={birthDate}
                  max="9999-12-31"
                  onChange={(e) => {
                    const val = e.target.value
                    if (val.split("-")[0]?.length > 4) {
                      const parts = val.split("-")
                      parts[0] = parts[0].slice(0, 4)
                      setBirthDate(parts.join("-"))
                    } else {
                      setBirthDate(val)
                    }
                  }}
                />
              </div>

              {/* 가족이 된 날 */}
              <div className="space-y-1">
                <Label htmlFor="familyDate">가족이 된 날</Label>
                <Input
                  type="date"
                  id="familyDate"
                  value={familyDate}
                  max="9999-12-31"
                  onChange={(e) => {
                    const val = e.target.value
                    if (val.split("-")[0]?.length > 4) {
                      const parts = val.split("-")
                      parts[0] = parts[0].slice(0, 4)
                      setFamilyDate(parts.join("-"))
                    } else {
                      setFamilyDate(val)
                    }
                  }}
                />
              </div>

              {/* 성별 */}
              <div className="space-y-1">
                <Label>성별 <span className="text-destructive">*</span></Label>
                <div className={`flex gap-2 ${showValidation && !gender ? "rounded-md ring-2 ring-destructive p-1 -m-1" : ""}`}>
                  <Button
                    type="button"
                    variant={gender === "male" ? "default" : "outline"}
                    className={gender !== "male" ? "bg-transparent" : ""}
                    onClick={() => setGender("male")}
                    size="sm"
                  >
                    수컷
                  </Button>
                  <Button
                    type="button"
                    variant={gender === "female" ? "default" : "outline"}
                    className={gender !== "female" ? "bg-transparent" : ""}
                    onClick={() => setGender("female")}
                    size="sm"
                  >
                    암컷
                  </Button>
                </div>
                {showValidation && !gender && (
                  <p className="text-xs text-destructive">성별을 선택해 주세요.</p>
                )}
              </div>

              {/* 중성화 */}
              <div className="flex items-center justify-between">
                <Label htmlFor="neutered">중성화 완료</Label>
                <Switch id="neutered" checked={neutered} onCheckedChange={setNeutered} />
              </div>

              {/* 품종 */}
              <div className="space-y-1">
                <Label>품종 <span className="text-destructive">*</span></Label>
                <Select value={breed} onValueChange={setBreed}>
                  <SelectTrigger className={showValidation && !breed ? "border-destructive ring-destructive" : ""}>
                    <SelectValue placeholder="품종 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {catBreeds.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showValidation && !breed && (
                  <p className="text-xs text-destructive">품종을 선택해 주세요.</p>
                )}
                {breed === "기타" && (
                  <Input
                    value={customBreed}
                    onChange={(e) => setCustomBreed(e.target.value)}
                    placeholder="품종 직접 입력"
                    className="mt-2"
                  />
                )}
              </div>

              {/* 체중 */}
              <div className="space-y-1">
                <Label htmlFor="weight">체중 <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="체중"
                    step="0.1"
                    min="0.1"
                    max="30"
                    className={showValidation && !weight ? "border-destructive ring-destructive" : ""}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">kg</span>
                </div>
                {showValidation && !weight && (
                  <p className="text-xs text-destructive">체중을 입력해 주세요.</p>
                )}
              </div>



              {/* [주석 처리] 설문 빈도 선택 UI - 현재 매일 고정이므로 사용하지 않음
              <div className="space-y-2">
                <Label>진단 설문 주간 횟수 <span className="text-destructive">*</span></Label>
                <Select value={surveyFrequency} onValueChange={setSurveyFrequency}>
                  <SelectTrigger className={showValidation && !surveyFrequencyValue ? "border-destructive ring-destructive" : ""}>
                    <SelectValue placeholder="--선택--" />
                  </SelectTrigger>
                  <SelectContent>
                    {surveyFrequencyOptions.map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count === 7 ? "매일" : `주 ${count}회`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showValidation && !surveyFrequencyValue && (
                  <p className="text-xs text-destructive">주간 횟수를 선택해 주세요.</p>
                )}
                <p className="text-xs text-muted-foreground">주간 횟수에 맞춰 원하는 요일을 선택해 주세요.</p>
              </div>

              <div className="space-y-2">
                <Label>요일 선택 <span className="text-destructive">*</span></Label>
                <div className={`grid grid-cols-4 gap-2 sm:grid-cols-7 ${showValidation && surveyFrequencyValue && !isSurveyScheduleValid ? "rounded-md ring-2 ring-destructive p-1 -m-1" : ""}`}>
                  {weekDays.map((day) => {
                    const isSelected = surveyDays.includes(day.value)
                    const isAtLimit = surveyDays.length >= surveyFrequencyValue
                    const isDisabled = !surveyFrequencyValue || surveyFrequencyValue === 7 || (!isSelected && isAtLimit)

                    return (
                      <Button
                        key={day.value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={!isSelected ? "bg-transparent" : ""}
                        onClick={() => toggleSurveyDay(day.value)}
                        size="sm"
                        disabled={isDisabled}
                      >
                        {day.label}
                      </Button>
                    )
                  })}
                </div>
                {!surveyFrequencyValue ? (
                  <p className="text-xs text-muted-foreground">먼저 주간 횟수를 선택해 주세요.</p>
                ) : surveyDays.length === surveyFrequencyValue ? (
                  <p className="text-xs text-muted-foreground">
                    선택 {surveyDays.length}/{surveyFrequencyValue}
                  </p>
                ) : (
                  <p className="text-xs text-destructive">
                    주 {surveyFrequencyValue}회에 맞춰 요일을 {surveyFrequencyValue}개 선택해 주세요.
                  </p>
                )}
              </div>
              */}
            </CardContent>
          </Card>


          {/* 고양이 삭제 - Minimalist layout */}
          {!isNewCatMode && activeCat && (
            <div className="flex flex-col items-center gap-1 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive/70 hover:text-destructive hover:bg-destructive/5 h-7 text-[13px] px-3"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                이 고양이 프로필 삭제
              </Button>

              {activeCat?.id && (
                <p className="text-[9px] text-muted-foreground/40 select-all">
                  ID: {activeCat.id}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 하단 CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        <Button onClick={handleSubmit} disabled={!isValid || isSubmitting} className="w-full h-12" size="lg">
          {isSubmitting ? "저장 중..." : "프로필 저장하고 다음"}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">{activeCat?.name}의 프로필을 삭제할까요?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              삭제하면 이 고양이의 모든 기록이 사라지며 복구할 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
