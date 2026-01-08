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
import { catBreeds } from "@/lib/mock"
import {
  createEmptyMedicalHistory,
  getMedicalHistoryGroupMap,
  getMedicalHistoryItemMap,
  getMedicalHistoryItemsByGroup,
  medicalHistoryGroups,
  normalizeMedicalHistory,
  sortMedicalHistoryGroupIds,
  sortMedicalHistoryItemIds,
  type MedicalHistoryGroupId,
  type MedicalHistoryItemId,
  type MedicalHistoryV2,
} from "@/lib/medical-history"
import type { AdoptionSource, CatProfile, MedicationSelection, Weekday } from "@/lib/types"
import { Cat, ChevronDown, ChevronUp, ArrowRight, X } from "lucide-react"

const medicalHistoryGroupMap = getMedicalHistoryGroupMap()
const medicalHistoryItemMap = getMedicalHistoryItemMap()
const medicalHistoryItemsByGroup = getMedicalHistoryItemsByGroup()

const adoptionPaths = ["보호소/입양기관", "지인/가족", "길에서 구조", "기타"]
const agencyAdoptionPath = adoptionPaths[0]
const surveyFrequencyOptions = [2, 3, 4, 5, 6, 7]
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

type MedicalHistorySignalId = MedicalHistoryGroupId | MedicalHistoryItemId

const medicationRecommendationMap: Partial<Record<MedicalHistorySignalId, string[]>> = {
  "renal-urinary": ["인결합제", "수액(피하수액)", "구토억제제", "식욕촉진제", "요로 처방식", "오메가3"],
  diabetes: ["인슐린", "혈당측정", "당뇨 처방식"],
  hyperthyroidism: ["메티마졸(항갑상선제)"],
  musculoskeletal: ["관절영양제", "진통제(수의사 처방)"],
  cardiovascular: ["이뇨제(수의사 처방)", "심장약(수의사 처방)"],
  oral: ["항생제(수의사 처방)", "소염제(수의사 처방)"],
  "dermatologic-allergy": ["항생제(수의사 처방)", "소염제(수의사 처방)"],
}

const medicationCatalog = [
  "인결합제",
  "수액(피하수액)",
  "구토억제제",
  "식욕촉진제",
  "요로 처방식",
  "오메가3",
  "인슐린",
  "혈당측정",
  "당뇨 처방식",
  "메티마졸(항갑상선제)",
  "관절영양제",
  "진통제(수의사 처방)",
  "이뇨제(수의사 처방)",
  "심장약(수의사 처방)",
  "항생제(수의사 처방)",
  "소염제(수의사 처방)",
  "위장보호제",
  "항구토제",
  "간 보호제",
  "간 처방식",
  "프로바이오틱스",
  "유산균",
  "스테로이드(수의사 처방)",
  "항히스타민제",
  "피부 보습제",
  "안약",
  "귀약",
  "구강 세정제",
  "치석 제거 보조제",
  "혈압약(수의사 처방)",
  "심장 영양제",
  "칼륨 보충제",
  "비타민 B군",
  "철분 보충제",
  "변비약",
  "설사약",
  "구충제",
  "기생충 예방약",
  "항산화제",
  "면역 보조제",
  "장 보호제",
  "진정제(수의사 처방)",
  "항경련제(수의사 처방)",
  "눈물 관리제",
  "요로 영양제",
  "신장 처방식",
  "치과 처방식",
  "피부 처방식",
  "알레르기 처방식",
  "항곰팡이제(수의사 처방)",
]

const medicationCatalogUnique = Array.from(new Set(medicationCatalog))

const createMedicationId = (label: string) => label.trim().toLowerCase().replace(/\s+/g, "-")

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
  const { activeCat, activeCatId, addCat, updateCat, cats } = useActiveCat()
  const [showOptional, setShowOptional] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const isNewCatMode = searchParams.get("mode") === "new"

  // 필수 필드
  const [name, setName] = useState("")
  const [adoptionPath, setAdoptionPath] = useState("")
  const [customAdoptionPath, setCustomAdoptionPath] = useState("")
  const [adoptionAgencyCode, setAdoptionAgencyCode] = useState("")
  const [unknownBirthday, setUnknownBirthday] = useState(false)
  const [birthDate, setBirthDate] = useState("")
  const [familyDate, setFamilyDate] = useState("")
  const [estimatedAge, setEstimatedAge] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [neutered, setNeutered] = useState(true)
  const [breed, setBreed] = useState("")
  const [customBreed, setCustomBreed] = useState("")
  const [weight, setWeight] = useState("")
  const [foodType, setFoodType] = useState<"dry" | "wet" | "mixed" | "prescription" | "">("")
  const [waterSource, setWaterSource] = useState<"fountain" | "bowl" | "mixed" | "">("")
  const [surveyFrequency, setSurveyFrequency] = useState("")
  const [surveyDays, setSurveyDays] = useState<Weekday[]>([])

  // 선택 필드
  const [activityLevel, setActivityLevel] = useState<"low" | "medium" | "high" | "">("")
  const [livingEnvironment, setLivingEnvironment] = useState<"indoor" | "outdoor" | "both" | "">("")
  const [multiCat, setMultiCat] = useState(false)
  const [catCount, setCatCount] = useState("")
  const [mealsPerDay, setMealsPerDay] = useState("")
  const [waterIntakeTendency, setWaterIntakeTendency] = useState<"low" | "normal" | "high" | "unknown" | "">("")
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryV2>(() => createEmptyMedicalHistory())
  const [medicationsSelected, setMedicationsSelected] = useState<MedicationSelection[]>([])
  const [medicationSearchQuery, setMedicationSearchQuery] = useState("")
  const [notes, setNotes] = useState("")
  const [vetInfo, setVetInfo] = useState("")

  const isAgencyAdoption = adoptionPath === agencyAdoptionPath
  const trimmedAgencyCode = adoptionAgencyCode.trim()
  const isAgencyCodeValid = !isAgencyAdoption || trimmedAgencyCode.length >= 4
  const showAgencyCodeError = isAgencyAdoption && trimmedAgencyCode.length < 4

  const hasAdoptionPath = adoptionPath && (adoptionPath !== "기타" || customAdoptionPath.trim())
  const surveyFrequencyValue = surveyFrequency ? Number.parseInt(surveyFrequency, 10) : 0
  const isSurveyScheduleValid =
    surveyFrequencyValue >= 2 && surveyFrequencyValue <= 7 && surveyDays.length === surveyFrequencyValue
  const isValid =
    name.trim() &&
    hasAdoptionPath &&
    isAgencyCodeValid &&
    (unknownBirthday ? estimatedAge : birthDate) &&
    gender &&
    breed &&
    weight &&
    foodType &&
    waterSource &&
    isSurveyScheduleValid

  const selectedGroupIds = medicalHistory.selectedGroupIds
  const selectedItemIds = medicalHistory.selectedItemIds
  const selectedGroupSet = new Set(selectedGroupIds)
  const selectedItemSet = new Set(selectedItemIds)
  const selectedItemCount = selectedItemIds.length
  const selectedMedicalSignalIds = new Set<MedicalHistorySignalId>([...selectedGroupIds, ...selectedItemIds])

  const recommendedMedications = Array.from(selectedMedicalSignalIds).reduce<string[]>((acc, conditionId) => {
    const candidates = medicationRecommendationMap[conditionId] ?? []
    candidates.forEach((item) => {
      if (!acc.includes(item)) acc.push(item)
    })
    return acc
  }, [])
  const selectedMedicationIds = new Set(medicationsSelected.map((item) => item.id))
  const medicationQuery = medicationSearchQuery.trim()
  const searchResults =
    medicationQuery.length >= 2
      ? medicationCatalogUnique
          .filter((item) => item.toLowerCase().includes(medicationQuery.toLowerCase()))
          .filter((item) => !selectedMedicationIds.has(createMedicationId(item)))
          .slice(0, 8)
      : []

  const addMedicationSelection = (label: string, source: MedicationSelection["source"]) => {
    const normalizedLabel = label.trim()
    if (!normalizedLabel) return
    const id = createMedicationId(normalizedLabel)
    if (!id) return
    setMedicationsSelected((prev) => {
      if (prev.some((item) => item.id === id)) return prev
      return [...prev, { id, label: normalizedLabel, source }]
    })
  }

  const removeMedicationSelection = (id: string) => {
    setMedicationsSelected((prev) => prev.filter((item) => item.id !== id))
  }

  const toggleRecommendedMedication = (label: string) => {
    const normalizedLabel = label.trim()
    if (!normalizedLabel) return
    const id = createMedicationId(normalizedLabel)
    if (!id) return
    setMedicationsSelected((prev) => {
      if (prev.some((item) => item.id === id)) {
        return prev.filter((item) => item.id !== id)
      }
      return [...prev, { id, label: normalizedLabel, source: "recommended" }]
    })
  }

  useEffect(() => {
    if (!isAgencyAdoption) {
      setAdoptionAgencyCode("")
    }
  }, [isAgencyAdoption])

  useEffect(() => {
    if (!surveyFrequencyValue) {
      setSurveyDays([])
      return
    }

    if (surveyFrequencyValue === 7) {
      setSurveyDays(weekDayOrder)
      return
    }

    setSurveyDays((prev) => {
      const normalized = weekDayOrder.filter((day) => prev.includes(day))
      return normalized.slice(0, surveyFrequencyValue)
    })
  }, [surveyFrequencyValue])

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

    const isUnknownBirthday = Boolean(activeCat.unknownBirthday)

    setName(activeCat.name ?? "")
    setAdoptionAgencyCode(activeCat.adoptionAgencyCode ?? activeCat.agencyCode ?? "")
    setUnknownBirthday(isUnknownBirthday)
    setBirthDate(isUnknownBirthday ? "" : activeCat.birthDate ?? "")
    setFamilyDate(activeCat.familyDate ?? activeCat.adoptionDate ?? "")
    setEstimatedAge(isUnknownBirthday && activeCat.estimatedAge != null ? String(activeCat.estimatedAge) : "")
    setGender(activeCat.gender ?? "")
    setNeutered(activeCat.neutered ?? true)
    setWeight(activeCat.weight != null ? String(activeCat.weight) : "")
    setFoodType(activeCat.foodType ?? "")
    setWaterSource(activeCat.waterSource ?? "")
    setSurveyFrequency(
      activeCat.surveyFrequencyPerWeek != null ? String(activeCat.surveyFrequencyPerWeek) : ""
    )
    setSurveyDays(activeCat.surveyDays ?? [])
    setActivityLevel(activeCat.activityLevel ?? "")
    setLivingEnvironment(activeCat.livingEnvironment ?? "")
    setMultiCat(Boolean(activeCat.multiCat))
    setCatCount(activeCat.catCount != null ? String(activeCat.catCount) : "")
    setMealsPerDay(activeCat.mealsPerDay != null ? String(activeCat.mealsPerDay) : "")
    setWaterIntakeTendency(activeCat.waterIntakeTendency ?? "")
    const normalizedMedicalHistory = normalizeMedicalHistory(activeCat.medicalHistory) ?? createEmptyMedicalHistory()
    setMedicalHistory(normalizedMedicalHistory)
    const storedMedicationsSelected = activeCat.medicationsSelected ?? []
    setMedicationsSelected(storedMedicationsSelected)
    setMedicationSearchQuery("")
    setNotes(activeCat.notes ?? "")
    setVetInfo(activeCat.vetInfo ?? "")
    setProfilePhoto(activeCat.profilePhoto ?? null)
  }, [activeCat, isNewCatMode])

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

  const toggleSurveyDay = (day: Weekday) => {
    if (!surveyFrequencyValue || surveyFrequencyValue === 7) return

    setSurveyDays((prev) => {
      const isSelected = prev.includes(day)
      if (isSelected) {
        return prev.filter((item) => item !== day)
      }
      if (prev.length >= surveyFrequencyValue) {
        return prev
      }
      const next = [...prev, day]
      return weekDayOrder.filter((item) => next.includes(item))
    })
  }

  const toggleMedicalGroup = (groupId: MedicalHistoryGroupId) => {
    setMedicalHistory((prev) => {
      const isSelected = prev.selectedGroupIds.includes(groupId)
      if (isSelected) {
        const nextGroupIds = prev.selectedGroupIds.filter((id) => id !== groupId)
        const nextItemIds = prev.selectedItemIds.filter((itemId) => medicalHistoryItemMap[itemId]?.groupId !== groupId)
        return {
          ...prev,
          selectedGroupIds: nextGroupIds,
          selectedItemIds: nextItemIds,
        }
      }
      const nextGroupIds = sortMedicalHistoryGroupIds([...prev.selectedGroupIds, groupId])
      return { ...prev, selectedGroupIds: nextGroupIds }
    })
  }

  const toggleMedicalItem = (itemId: MedicalHistoryItemId) => {
    const groupId = medicalHistoryItemMap[itemId]?.groupId
    setMedicalHistory((prev) => {
      const isSelected = prev.selectedItemIds.includes(itemId)
      const nextItemIds = isSelected
        ? prev.selectedItemIds.filter((id) => id !== itemId)
        : sortMedicalHistoryItemIds([...prev.selectedItemIds, itemId])
      const nextGroupIds =
        groupId && !prev.selectedGroupIds.includes(groupId)
          ? sortMedicalHistoryGroupIds([...prev.selectedGroupIds, groupId])
          : prev.selectedGroupIds
      return { ...prev, selectedGroupIds: nextGroupIds, selectedItemIds: nextItemIds }
    })
  }

  const clearMedicalHistory = () => {
    setMedicalHistory(createEmptyMedicalHistory())
  }

  const handleSubmit = () => {
    if (!isValid) return

    setIsSubmitting(true)
    const isCreating = isNewCatMode || cats.length === 0 || !activeCat
    const nextId = isCreating ? createCatId() : activeCat.id ?? activeCatId ?? createCatId()
    const normalizedSelections = medicationsSelected.reduce<MedicationSelection[]>((acc, item) => {
      const label = item.label.trim()
      if (!label) return acc
      const id = createMedicationId(label)
      if (!id || acc.some((entry) => entry.id === id)) return acc
      acc.push({ ...item, id, label })
      return acc
    }, [])
    const medicationsSelectedValue = normalizedSelections
    const legacyParts = medicationsSelectedValue.map((item) => item.label)
    const medicationLegacy = Array.from(new Set(legacyParts.map((item) => item.trim()).filter(Boolean))).join(", ")
    const normalizedMedicalHistory = normalizeMedicalHistory(medicalHistory) ?? createEmptyMedicalHistory()
    const hasMedicalHistorySelections =
      normalizedMedicalHistory.selectedGroupIds.length > 0 || normalizedMedicalHistory.selectedItemIds.length > 0

    const profile: CatProfile = {
      id: nextId,
      name: name.trim(),
      adoptionPath: adoptionPath === "기타" ? customAdoptionPath.trim() : adoptionPath,
      adoptionSource: resolveAdoptionSource(adoptionPath),
      adoptionAgencyCode: isAgencyAdoption ? trimmedAgencyCode : undefined,
      agencyCode: isAgencyAdoption ? trimmedAgencyCode : undefined,
      unknownBirthday,
      birthDate: unknownBirthday ? undefined : birthDate,
      familyDate: familyDate || undefined,
      estimatedAge: unknownBirthday ? Number.parseInt(estimatedAge, 10) : undefined,
      gender: gender as "male" | "female",
      neutered,
      breed: breed === "기타" ? customBreed : breed,
      weight: Number.parseFloat(weight),
      foodType: foodType as "dry" | "wet" | "mixed" | "prescription",
      waterSource: waterSource as "fountain" | "bowl" | "mixed",
      surveyFrequencyPerWeek: surveyFrequencyValue || undefined,
      surveyDays: surveyDays.length > 0 ? surveyDays : undefined,
      activityLevel: activityLevel as "low" | "medium" | "high" | undefined,
      livingEnvironment: livingEnvironment as "indoor" | "outdoor" | "both" | undefined,
      multiCat,
      catCount: multiCat && catCount ? Number.parseInt(catCount, 10) : undefined,
      mealsPerDay: mealsPerDay ? Number.parseInt(mealsPerDay, 10) : undefined,
      waterIntakeTendency: waterIntakeTendency as "low" | "normal" | "high" | "unknown" | undefined,
      medicalHistory: hasMedicalHistorySelections ? normalizedMedicalHistory : undefined,
      medications: medicationLegacy,
      medicationText: "",
      medicationsSelected: medicationsSelectedValue,
      medicationOtherText: "",
      notes: notes.trim() || undefined,
      vetInfo: vetInfo.trim() || undefined,
      profilePhoto: profilePhoto || undefined,
    }

    if (isCreating) {
      addCat(profile)
    } else {
      updateCat(profile)
    }
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

              {/* 입양 경로 */}
              <div className="space-y-2">
                <Label>입양 경로</Label>
                <Select value={adoptionPath} onValueChange={setAdoptionPath}>
                  <SelectTrigger>
                    <SelectValue placeholder="입양 경로 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {adoptionPaths.map((path) => (
                      <SelectItem key={path} value={path}>
                        {path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {adoptionPath === "기타" && (
                  <Input
                    value={customAdoptionPath}
                    onChange={(e) => setCustomAdoptionPath(e.target.value)}
                    placeholder="입양 경로 입력"
                    className="mt-2"
                  />
                )}
                {isAgencyAdoption && (
                  <div className="mt-2 space-y-2">
                    <Label htmlFor="adoptionAgencyCode">기관 코드</Label>
                    <Input
                      id="adoptionAgencyCode"
                      value={adoptionAgencyCode}
                      onChange={(e) => setAdoptionAgencyCode(e.target.value)}
                      placeholder="예) RUOKAT-1234"
                    />
                    <p className="text-xs text-muted-foreground">입양기관에서 받은 코드를 입력해 주세요.</p>
                    {showAgencyCodeError && (
                      <p className="text-xs text-destructive">
                        기관 입양을 선택한 경우 기관 코드는 필수입니다.
                      </p>
                    )}
                  </div>
                )}
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

              {/* 가족이 된 날 */}
              <div className="space-y-2">
                <Label htmlFor="familyDate">가족이 된 날</Label>
                <Input
                  type="date"
                  id="familyDate"
                  value={familyDate}
                  onChange={(e) => setFamilyDate(e.target.value)}
                />
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

              {/* 진단 설문 일정 */}
              <div className="space-y-2">
                <Label>진단 설문 주간 횟수</Label>
                <Select value={surveyFrequency} onValueChange={setSurveyFrequency}>
                  <SelectTrigger>
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
                <p className="text-xs text-muted-foreground">주간 횟수에 맞춰 원하는 요일을 선택해 주세요.</p>
              </div>

              <div className="space-y-2">
                <Label>요일 선택</Label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
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
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>기존 병력 (해당하는 것 모두 선택)</Label>
                    <span className="text-xs text-muted-foreground">선택됨 {selectedItemCount}개</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">1단계. 해당하는 질환군을 먼저 선택하세요.</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {medicalHistoryGroups.map((group) => {
                        const isSelected = selectedGroupSet.has(group.id)
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => toggleMedicalGroup(group.id)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-foreground"
                            }`}
                            aria-pressed={isSelected}
                          >
                            {group.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={clearMedicalHistory}>
                      모르겠어요/없어요
                    </Button>
                    <span className="text-xs text-muted-foreground">선택이 어려우면 비워둘 수 있어요.</span>
                  </div>

                  {selectedGroupIds.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">2단계. 선택한 질환군에서 세부 항목을 체크하세요.</p>
                      {selectedGroupIds.map((groupId) => {
                        const group = medicalHistoryGroupMap[groupId]
                        const items = medicalHistoryItemsByGroup[groupId] ?? []
                        const selectedCount = items.filter((item) => selectedItemSet.has(item.id)).length
                        return (
                          <div key={groupId} className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium text-foreground">{group.label}</span>
                              <span className="text-xs text-muted-foreground">선택 {selectedCount}개</span>
                            </div>
                            <div className="space-y-3">
                              {items.map((item) => {
                                const checkboxId = `medical-history-${item.id}`
                                return (
                                  <div key={item.id} className="flex items-start gap-3">
                                    <Checkbox
                                      id={checkboxId}
                                      checked={selectedItemSet.has(item.id)}
                                      onCheckedChange={() => toggleMedicalItem(item.id)}
                                    />
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Label htmlFor={checkboxId} className="text-sm font-medium leading-relaxed">
                                          {item.label}
                                        </Label>
                                        <Badge
                                          variant={item.type === "symptom" ? "outline" : "secondary"}
                                          className="text-[10px]"
                                        >
                                          {item.type === "symptom" ? "증상군" : "질환"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 복용 약/영양제 */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label htmlFor="medicationSearch">복용 중인 약/영양제</Label>
                    <div className="w-full sm:max-w-[220px]">
                      <Input
                        id="medicationSearch"
                        value={medicationSearchQuery}
                        onChange={(e) => {
                          setMedicationSearchQuery(e.target.value)
                        }}
                        placeholder="2글자 이상 입력"
                      />
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="sm:ml-auto sm:max-w-[220px]">
                      <div className="rounded-md border border-border bg-background p-2 shadow-sm">
                        <div className="space-y-1">
                          {searchResults.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => {
                                addMedicationSelection(item, "search")
                                setMedicationSearchQuery("")
                              }}
                              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm hover:bg-muted/50"
                            >
                              <span>{item}</span>
                              <span className="text-[10px] text-muted-foreground">추가</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {recommendedMedications.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {recommendedMedications.map((item) => {
                          const isSelected = selectedMedicationIds.has(createMedicationId(item))
                          return (
                            <Button
                              key={item}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              className={!isSelected ? "bg-transparent" : ""}
                              onClick={() => toggleRecommendedMedication(item)}
                              size="sm"
                            >
                              {item}
                            </Button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {medicationsSelected.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {medicationsSelected.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-xs text-foreground"
                        >
                          {item.label}
                          <button
                            type="button"
                            onClick={() => removeMedicationSelection(item.id)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`${item.label} 제거`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

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
