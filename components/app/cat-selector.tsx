"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveCat } from "@/contexts/active-cat-context"
import type { CatProfile } from "@/lib/types"
import { Cat, Check, ChevronDown, PlusCircle } from "lucide-react"

function getAgeLabel({
  birthDate,
  estimatedAge,
  unknownBirthday,
}: {
  birthDate?: string
  estimatedAge?: number
  unknownBirthday?: boolean
}) {
  if (unknownBirthday && !estimatedAge) return ""
  if (estimatedAge) return `${estimatedAge}개월`
  if (!birthDate) return ""

  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return ""
  const today = new Date()
  const months =
    (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  if (months <= 0) return ""
  if (months < 12) return `${months}개월`
  return `${Math.floor(months / 12)}살`
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

  const ageLabel = useMemo(() => {
    if (!activeCat) return ""
    return getAgeLabel({
      birthDate: activeCat.birthDate,
      estimatedAge: activeCat.estimatedAge,
      unknownBirthday: activeCat.unknownBirthday,
    })
  }, [activeCat])

  const extraLine = useMemo(() => {
    if (!activeCat) return ""
    const parts = [
      ageLabel ? `나이 ${ageLabel}` : null,
      activeCat.weight ? `체중 ${activeCat.weight}kg` : null,
    ].filter(Boolean)
    return parts.join(" · ")
  }, [activeCat, ageLabel])

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
                  src={activeCat.profilePhoto}
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
            {extraLine ? (
              <p className="text-xs text-muted-foreground">{extraLine}</p>
            ) : (
              <p className="text-xs text-muted-foreground">나이/체중 정보 없음</p>
            )}
          </div>
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
                birthDate: cat.birthDate,
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
                      <img src={cat.profilePhoto} alt={`${cat.name} 프로필`} className="h-full w-full object-cover" />
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
