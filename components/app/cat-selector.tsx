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

export function CatSelector() {
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

  const handleSelect = (catId: string) => {
    setActiveCatId(catId)
    setOpen(false)
  }

  const handleAddCat = () => {
    setOpen(false)
    router.push("/onboarding/cat?mode=new")
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Cat className="w-5 h-5 text-primary" />
            프로필
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Cat className="w-5 h-5 text-primary" />
            프로필
          </CardTitle>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={() => canOpen && setOpen(true)}
            className="w-full flex items-center gap-4 text-left"
            aria-label={hasMultiple ? "고양이 선택" : "고양이 추가"}
            title={hasMultiple ? "고양이 선택" : "고양이 추가"}
            aria-disabled={!canOpen}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
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
              <h3 className="font-semibold text-foreground">{activeCat?.name || "고양이"}</h3>
              {detailLine ? (
                <p className="text-sm text-muted-foreground truncate">{detailLine}</p>
              ) : (
                <p className="text-sm text-muted-foreground">등록된 정보 없음</p>
              )}
              {activeCat?.weight ? <p className="text-sm text-muted-foreground">{activeCat.weight}kg</p> : null}
            </div>
            {hasMultiple ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <PlusCircle className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </CardContent>
      </Card>

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
