"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveCat } from "@/contexts/active-cat-context"
import type { CatProfile } from "@/lib/types"
import { getMediaUrl } from "@/lib/backend"
import { Cat, Check, ChevronDown, PlusCircle, Pencil } from "lucide-react"

type DateParts = {
  year: number
  month: number
  day: number
}

type AgeParts = {
  years: number
  months: number
}

function parseDateParts(value?: string | number | null): DateParts | null {
  if (value == null) return null
  if (typeof value === "number") {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
  }
  const match = value.match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!year || !month || !day) return null
  return { year, month, day }
}

function formatDateLabel(value?: string | number | null): string {
  const parts = parseDateParts(value)
  if (!parts) return ""
  const pad = (input: number) => String(input).padStart(2, "0")
  return `${parts.year}.${pad(parts.month)}.${pad(parts.day)}`
}

function getAgePartsFromMonths(totalMonths?: number | null): AgeParts | null {
  if (totalMonths == null) return null
  const safeMonths = Math.max(0, Math.floor(totalMonths))
  if (safeMonths === 0) return null
  return { years: Math.floor(safeMonths / 12), months: safeMonths % 12 }
}

function formatAgeParts(parts: AgeParts): string {
  if (parts.years <= 0 && parts.months <= 0) return ""
  if (parts.years <= 0) return `만 ${parts.months}개월`
  if (parts.months <= 0) return `만 ${parts.years}세`
  return `만 ${parts.years}세 ${parts.months}개월`
}

function getAgeLabel({
  estimatedAge,
  unknownBirthday,
}: {
  estimatedAge?: number
  unknownBirthday?: boolean
}) {
  if (!unknownBirthday || !estimatedAge) return ""
  return `${estimatedAge}개월`
}

function isAgencyAdoption(cat: CatProfile): boolean {
  const adoptionPath = cat.adoptionPath?.toLowerCase() ?? ""
  return (
    cat.adoptionSource === "shelter" ||
    cat.adoptionSource === "agency" ||
    adoptionPath.includes("보호소") ||
    adoptionPath.includes("입양기관") ||
    adoptionPath.includes("agency") ||
    adoptionPath.includes("shelter")
  )
}

type CatSelectorProps = {
  embedded?: boolean
  primaryAction?: "select" | "edit"
}

export function CatSelector({ embedded = false, primaryAction = "select" }: CatSelectorProps) {
  const router = useRouter()
  const { cats, activeCat, activeCatId, setActiveCatId, isLoading } = useActiveCat()
  const [open, setOpen] = useState(false)

  const hasMultiple = cats.length > 1
  const canOpen = !isLoading

  const detailLine = useMemo(() => {
    if (!activeCat) return ""
    const parts = [
      activeCat.breed,
      activeCat.gender ? (activeCat.gender === "male" ? "수컷" : "암컷") : null,
      activeCat.neutered == null ? null : activeCat.neutered ? "중성화 완료" : "중성화 전",
    ].filter(Boolean)
    return parts.join(" · ")
  }, [activeCat])

  const birthdayLine = useMemo(() => {
    if (!activeCat) return ""
    const birthDateLabel = formatDateLabel(activeCat.birthDate)
    const hasExactBirthDate = Boolean(birthDateLabel) && !activeCat.unknownBirthday
    const estimatedParts =
      !hasExactBirthDate && activeCat.estimatedAge != null ? getAgePartsFromMonths(activeCat.estimatedAge) : null
    const estimatedLabel = estimatedParts ? formatAgeParts(estimatedParts) : ""
    let baseLabel = ""
    if (hasExactBirthDate) {
      baseLabel = `🎂 태어난 날 ${birthDateLabel}`
    } else if (estimatedLabel) {
      baseLabel = `🎂 태어난 날 미상 (추정 ${estimatedLabel})`
    } else {
      baseLabel = "🎂 태어난 날 정보 없음"
    }
    return baseLabel
  }, [activeCat])

  const familyLine = useMemo(() => {
    if (!activeCat) return ""
    const familyDateLabel = formatDateLabel(activeCat.familyDate ?? activeCat.adoptionDate)
    return familyDateLabel ? `🏠 가족이 된 날 ${familyDateLabel}` : "🏠 가족이 된 날 정보 없음"
  }, [activeCat])

  const careShareLine = useMemo(() => {
    if (!activeCat) return ""
    
    const isAgency = isAgencyAdoption(activeCat)
    const isShareActive = activeCat.dataSharing?.enabled
    
    if (!isShareActive) return ""
    
    if (isAgency) {
      // 필수 참여 대상: 기간 표시
      const familyDate = activeCat.familyDate ?? activeCat.adoptionDate
      if (!familyDate) return ""
      
      const startDate = new Date(familyDate)
      if (Number.isNaN(startDate.getTime())) return ""
      
      const endDate = new Date(startDate)
      endDate.setFullYear(endDate.getFullYear() + 1)
      
      const startLabel = formatDateLabel(familyDate)
      const endLabel = formatDateLabel(endDate.toISOString())
      
      return `🛡️ 공동케어 기간 ${startLabel} ~ ${endLabel}`
    } else {
      // 선택적 참여 대상: 참여중 표시만
      return `🛡️ 공동케어 참여중`
    }
  }, [activeCat])

  const handleSelect = (catId: string) => {
    setActiveCatId(catId)
    setOpen(false)
  }

  const handlePrimaryClick = () => {
    if (primaryAction === "edit") {
      router.push("/onboarding/cat")
      return
    }
    if (canOpen) {
      setOpen(true)
    }
  }

  const handleAddCat = () => {
    setOpen(false)
    router.push("/onboarding/cat?mode=new")
  }

  const headerClassName = embedded ? "px-0 pb-0 gap-1" : "pb-3"
  const contentClassName = embedded ? "px-0 mt-6" : ""
  const rowClassName = embedded
    ? "flex-1 min-w-0 flex items-center gap-2 text-left"
    : "flex-1 min-w-0 flex items-center gap-4 text-left"
  const avatarClassName =
    "w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden"

  if (isLoading) {
    const loadingContent = (
      <>
        <CardHeader className={headerClassName}>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Cat className="w-5 h-5 text-primary" />
            프로필
          </CardTitle>
        </CardHeader>
        <CardContent className={contentClassName}>
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </>
    )

    return embedded ? <div className="space-y-0">{loadingContent}</div> : <Card>{loadingContent}</Card>
  }

  const selectorContent = (
    <>
      <CardHeader className={headerClassName}>
        <CardTitle className="text-2xl font-semibold flex items-center gap-2">
          <Cat className="w-5 h-5 text-primary" />
          {activeCat?.name || "고양이"}
        </CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>
        <div className="w-full flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrimaryClick}
            className={rowClassName}
            aria-label={
              primaryAction === "edit" ? "고양이 프로필 보기/수정" : hasMultiple ? "고양이 선택" : "고양이 추가"
            }
            title={primaryAction === "edit" ? "고양이 프로필 보기/수정" : hasMultiple ? "고양이 선택" : "고양이 추가"}
            aria-disabled={primaryAction === "select" && !canOpen}
          >
            <div className={avatarClassName}>
              {activeCat?.profilePhoto ? (
                <img
                  src={getMediaUrl(activeCat.profilePhoto)}
                  alt={`${activeCat.name} 프로필`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Cat className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {detailLine ? (
                <p className="text-sm font-medium text-foreground truncate">{detailLine}</p>
              ) : (
                <p className="text-sm text-muted-foreground">기본 정보 없음</p>
              )}
              {birthdayLine ? (
                <p className="text-xs text-muted-foreground">{birthdayLine}</p>
              ) : (
                <p className="text-xs text-muted-foreground">🎂 태어난 날 정보 없음</p>
              )}
              {familyLine ? <p className="text-xs text-muted-foreground">{familyLine}</p> : null}
              {careShareLine ? <p className="text-xs text-muted-foreground">{careShareLine}</p> : null}
            </div>
            {primaryAction === "edit" && (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 hover:bg-muted transition">
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={() => canOpen && setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/40 transition"
            aria-label={hasMultiple ? "고양이 전환" : "고양이 추가"}
            title={hasMultiple ? "고양이 전환" : "고양이 추가"}
            aria-disabled={!canOpen}
          >
            {hasMultiple ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <PlusCircle className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardContent>
    </>
  )

  return (
    <>
      {embedded ? <div className="space-y-0">{selectorContent}</div> : <Card>{selectorContent}</Card>}

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>고양이 선택</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {cats.map((cat) => {
              const ageLabel = getAgeLabel({
                estimatedAge: cat.estimatedAge,
                unknownBirthday: cat.unknownBirthday,
              })
              const subtext = [
                cat.breed,
                cat.gender ? (cat.gender === "male" ? "수컷" : "암컷") : null,
                ageLabel || null,
              ]
                .filter(Boolean)
                .join(" · ")
              const backgroundClass = isAgencyAdoption(cat)
                ? "bg-sky-50 dark:bg-sky-950/40"
                : "bg-emerald-50 dark:bg-emerald-950/40"

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-left hover:bg-muted/50 transition ${backgroundClass}`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {cat.profilePhoto ? (
                      <img src={getMediaUrl(cat.profilePhoto)} alt={`${cat.name} 프로필`} className="h-full w-full object-cover" />
                    ) : (
                      <Cat className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{subtext || "정보 없음"}</p>
                  </div>
                  {cat.id === activeCatId ? <Check className="w-4 h-4 text-primary" /> : null}
                </button>
              )
            })}
          </div>
          <div className="px-4 pb-6">
            <Button type="button" variant="outline" className="w-full" onClick={handleAddCat}>
              <PlusCircle className="w-4 h-4 mr-2" />
              고양이 추가
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
