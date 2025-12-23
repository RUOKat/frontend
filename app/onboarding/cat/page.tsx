"use client"

import { useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCatProfile } from "@/contexts/cat-profile-context"
import { catBreeds } from "@/lib/mock"
import type { CatProfile, MedicalCondition } from "@/lib/types"
import { Cat, ChevronDown, ChevronUp, ArrowRight } from "lucide-react"

const medicalConditions: { value: MedicalCondition; label: string }[] = [
  { value: "kidney", label: "신장/요로" },
  { value: "ckd", label: "CKD (만성신장병)" },
  { value: "diabetes", label: "당뇨" },
  { value: "thyroid", label: "갑상선" },
  { value: "dental", label: "치과" },
  { value: "skin", label: "피부" },
  { value: "joint", label: "관절" },
  { value: "heart", label: "심장" },
  { value: "unknown", label: "모름" },
]

export default function CatProfilePage() {
  const router = useRouter()
  const { setCatProfile } = useCatProfile()
  const [showOptional, setShowOptional] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)

  // 필수 필드
  const [name, setName] = useState("")
  const [unknownBirthday, setUnknownBirthday] = useState(false)
  const [birthDate, setBirthDate] = useState("")
  const [estimatedAge, setEstimatedAge] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [neutered, setNeutered] = useState(true)
  const [breed, setBreed] = useState("")
  const [customBreed, setCustomBreed] = useState("")
  const [weight, setWeight] = useState("")
  const [bcs, setBcs] = useState<string>("")
  const [foodType, setFoodType] = useState<"dry" | "wet" | "mixed" | "prescription" | "">("")
  const [waterSource, setWaterSource] = useState<"fountain" | "bowl" | "mixed" | "">("")

  // 선택 필드
  const [activityLevel, setActivityLevel] = useState<"low" | "medium" | "high" | "">("")
  const [livingEnvironment, setLivingEnvironment] = useState<"indoor" | "outdoor" | "both" | "">("")
  const [multiCat, setMultiCat] = useState(false)
  const [catCount, setCatCount] = useState("")
  const [mealsPerDay, setMealsPerDay] = useState("")
  const [waterIntakeTendency, setWaterIntakeTendency] = useState<"low" | "normal" | "high" | "unknown" | "">("")
  const [medicalHistory, setMedicalHistory] = useState<MedicalCondition[]>([])
  const [medications, setMedications] = useState("")
  const [notes, setNotes] = useState("")
  const [vetInfo, setVetInfo] = useState("")

  const isValid =
    name.trim() && (unknownBirthday ? estimatedAge : birthDate) && gender && breed && weight && foodType && waterSource

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setProfilePhoto(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfilePhoto(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const toggleMedicalCondition = (condition: MedicalCondition) => {
    setMedicalHistory((prev) => (prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]))
  }

  const handleSubmit = () => {
    if (!isValid) return

    setIsSubmitting(true)

    const profile: CatProfile = {
      name: name.trim(),
      unknownBirthday,
      birthDate: unknownBirthday ? undefined : birthDate,
      estimatedAge: unknownBirthday ? Number.parseInt(estimatedAge, 10) : undefined,
      gender: gender as "male" | "female",
      neutered,
      breed: breed === "기타" ? customBreed : breed,
      weight: Number.parseFloat(weight),
      bcs: bcs ? Number.parseInt(bcs, 10) : null,
      foodType: foodType as "dry" | "wet" | "mixed" | "prescription",
      waterSource: waterSource as "fountain" | "bowl" | "mixed",
      activityLevel: activityLevel as "low" | "medium" | "high" | undefined,
      livingEnvironment: livingEnvironment as "indoor" | "outdoor" | "both" | undefined,
      multiCat,
      catCount: multiCat && catCount ? Number.parseInt(catCount, 10) : undefined,
      mealsPerDay: mealsPerDay ? Number.parseInt(mealsPerDay, 10) : undefined,
      waterIntakeTendency: waterIntakeTendency as "low" | "normal" | "high" | "unknown" | undefined,
      medicalHistory: medicalHistory.length > 0 ? medicalHistory : undefined,
      medications: medications.trim() || undefined,
      notes: notes.trim() || undefined,
      vetInfo: vetInfo.trim() || undefined,
      profilePhoto: profilePhoto || undefined,
    }

    setCatProfile(profile)
    router.push("/onboarding/consent")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 헤더 */}
      <header className="flex-shrink-0 px-6 pt-safe-top">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Cat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">우리 고양이 프로필 만들기</h1>
              <p className="text-xs text-muted-foreground">1단계 / 최대 3단계</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">기준선을 만들면 작은 변화도 더 빨리 알아챌 수 있어요.</p>
        </div>
      </header>

      {/* 폼 */}
      <main className="flex-1 px-6 pb-24 overflow-auto">
        <div className="space-y-6">
          {/* 필수 항목 */}
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                필수 항목
              </div>

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
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="고양이 이름"
                  maxLength={20}
                />
              </div>

              {/* 생년월일 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="birthDate">생년월일</Label>
                  <div className="flex items-center gap-2">
                    <Switch id="unknownBirthday" checked={unknownBirthday} onCheckedChange={setUnknownBirthday} />
                    <Label htmlFor="unknownBirthday" className="text-xs text-muted-foreground cursor-pointer">
                      정확한 생일 몰라요
                    </Label>
                  </div>
                </div>
                {unknownBirthday ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={estimatedAge}
                      onChange={(e) => setEstimatedAge(e.target.value)}
                      placeholder="추정 나이"
                      min={1}
                      max={300}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">개월</span>
                  </div>
                ) : (
                  <Input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                )}
              </div>

              {/* 성별 */}
              <div className="space-y-2">
                <Label>성별</Label>
                <div className="flex gap-2">
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
              </div>

              {/* 중성화 */}
              <div className="flex items-center justify-between">
                <Label htmlFor="neutered">중성화 완료</Label>
                <Switch id="neutered" checked={neutered} onCheckedChange={setNeutered} />
              </div>

              {/* 품종 */}
              <div className="space-y-2">
                <Label>품종</Label>
                <Select value={breed} onValueChange={setBreed}>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="weight">체중</Label>
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
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">kg</span>
                </div>
              </div>

              {/* BCS */}
              <div className="space-y-2">
                <Label>BCS (체형 점수)</Label>
                <Select value={bcs} onValueChange={setBcs}>
                  <SelectTrigger>
                    <SelectValue placeholder="모름" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">모름</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n <= 3 ? "(마름)" : n <= 5 ? "(적정)" : n <= 7 ? "(과체중)" : "(비만)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 사료 타입 */}
              <div className="space-y-2">
                <Label>사료 타입</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "dry", label: "건식" },
                    { value: "wet", label: "습식" },
                    { value: "mixed", label: "혼합" },
                    { value: "prescription", label: "처방식" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={foodType === option.value ? "default" : "outline"}
                      className={foodType !== option.value ? "bg-transparent" : ""}
                      onClick={() => setFoodType(option.value as typeof foodType)}
                      size="sm"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 급수 방식 */}
              <div className="space-y-2">
                <Label>급수 방식</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "fountain", label: "정수기" },
                    { value: "bowl", label: "그릇" },
                    { value: "mixed", label: "혼합" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={waterSource === option.value ? "default" : "outline"}
                      className={waterSource !== option.value ? "bg-transparent" : ""}
                      onClick={() => setWaterSource(option.value as typeof waterSource)}
                      size="sm"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 선택 항목 토글 */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg text-sm"
          >
            <span className="text-muted-foreground">선택 항목 (더 정확한 분석을 위해)</span>
            {showOptional ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* 선택 항목 */}
          {showOptional && (
            <Card>
              <CardContent className="pt-6 space-y-5">
                {/* 활동 성향 */}
                <div className="space-y-2">
                  <Label>활동 성향</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "low", label: "조용함" },
                      { value: "medium", label: "보통" },
                      { value: "high", label: "활발함" },
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
                </div>

                {/* 실내/실외 */}
                <div className="space-y-2">
                  <Label>생활 환경</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "indoor", label: "실내" },
                      { value: "outdoor", label: "실외" },
                      { value: "both", label: "혼합" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={livingEnvironment === option.value ? "default" : "outline"}
                        className={livingEnvironment !== option.value ? "bg-transparent" : ""}
                        onClick={() => setLivingEnvironment(option.value as typeof livingEnvironment)}
                        size="sm"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 다묘 여부 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="multiCat">다묘 가정</Label>
                    <Switch id="multiCat" checked={multiCat} onCheckedChange={setMultiCat} />
                  </div>
                  {multiCat && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={catCount}
                        onChange={(e) => setCatCount(e.target.value)}
                        placeholder="총 마릿수"
                        min={2}
                        max={20}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">마리</span>
                    </div>
                  )}
                </div>

                {/* 식사 횟수 */}
                <div className="space-y-2">
                  <Label htmlFor="mealsPerDay">하루 식사 횟수</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="mealsPerDay"
                      type="number"
                      value={mealsPerDay}
                      onChange={(e) => setMealsPerDay(e.target.value)}
                      placeholder="횟수"
                      min={1}
                      max={10}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">회</span>
                  </div>
                </div>

                {/* 물 섭취 경향 */}
                <div className="space-y-2">
                  <Label>물 섭취 경향</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "low", label: "적게 마심" },
                      { value: "normal", label: "보통" },
                      { value: "high", label: "많이 마심" },
                      { value: "unknown", label: "모름" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={waterIntakeTendency === option.value ? "default" : "outline"}
                        className={waterIntakeTendency !== option.value ? "bg-transparent" : ""}
                        onClick={() => setWaterIntakeTendency(option.value as typeof waterIntakeTendency)}
                        size="sm"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 기존 병력 */}
                <div className="space-y-2">
                  <Label>기존 병력 (해당하는 것 모두 선택)</Label>
                  <div className="flex flex-wrap gap-2">
                    {medicalConditions.map((condition) => (
                      <Button
                        key={condition.value}
                        type="button"
                        variant={medicalHistory.includes(condition.value) ? "default" : "outline"}
                        className={!medicalHistory.includes(condition.value) ? "bg-transparent" : ""}
                        onClick={() => toggleMedicalCondition(condition.value)}
                        size="sm"
                      >
                        {condition.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 복용 약/영양제 */}
                <div className="space-y-2">
                  <Label htmlFor="medications">복용 중인 약/영양제</Label>
                  <Input
                    id="medications"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="예: 유산균, 관절 영양제"
                  />
                </div>

                {/* 메모 */}
                <div className="space-y-2">
                  <Label htmlFor="notes">메모</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="특이사항이 있다면 적어주세요"
                    rows={2}
                  />
                </div>

                {/* 병원 정보 */}
                <div className="space-y-2">
                  <Label htmlFor="vetInfo">단골 병원</Label>
                  <Input
                    id="vetInfo"
                    value={vetInfo}
                    onChange={(e) => setVetInfo(e.target.value)}
                    placeholder="예: OO동물병원"
                  />
                </div>
              </CardContent>
            </Card>
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
    </div>
  )
}
