"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Gift, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import type { ShareLevel } from "@/lib/types"

export default function ConsentNoticePage() {
  const router = useRouter()
  const {
    shelterShareOptIn,
    setShelterShareOptIn,
    shareLevel,
    setShareLevel,
    setOnboardingCompleted,
  } = useOnboarding()
  const { activeCat, updateCat } = useActiveCat()
  const adoptionPathLabel = activeCat?.adoptionPath || ""
  const normalizedAdoptionPath = adoptionPathLabel.toLowerCase()
  const hasAgencyCode = Boolean(activeCat?.adoptionAgencyCode?.trim())
  const isAgencyAdoption =
    hasAgencyCode &&
    (normalizedAdoptionPath.includes("보호소") ||
      normalizedAdoptionPath.includes("입양기관") ||
      normalizedAdoptionPath.includes("agency") ||
      normalizedAdoptionPath.includes("shelter"))
  const shareEndAt = activeCat?.careShareEndAt
  const isSharePeriodExpired = isAgencyAdoption && typeof shareEndAt === "number" && shareEndAt < Date.now()
  const isAgencyShareActive = isAgencyAdoption && !isSharePeriodExpired

  useEffect(() => {
    if (!isAgencyAdoption || !activeCat) return

    const now = Date.now()
    let nextStartAt = activeCat.careShareStartAt ?? now
    let nextEndAt = activeCat.careShareEndAt

    if (!nextEndAt) {
      const endDate = new Date(nextStartAt)
      endDate.setFullYear(endDate.getFullYear() + 1)
      nextEndAt = endDate.getTime()
    }

    if (nextStartAt != activeCat.careShareStartAt || nextEndAt != activeCat.careShareEndAt) {
      updateCat({
        ...activeCat,
        careShareStartAt: nextStartAt,
        careShareEndAt: nextEndAt,
      })
    }

    if (nextEndAt < now) {
      if (shelterShareOptIn) {
        setShelterShareOptIn(false)
      }
      return
    }

    if (!shelterShareOptIn) {
      setShelterShareOptIn(true)
    }
    if (shareLevel != "signal") {
      setShareLevel("signal")
    }
  }, [
    isAgencyAdoption,
    activeCat,
    updateCat,
    shelterShareOptIn,
    shareLevel,
    setShelterShareOptIn,
    setShareLevel,
  ])

  const handleContinue = () => {
    setOnboardingCompleted(true)
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex-shrink-0 px-6 pt-safe-top">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">케어 참여 프로그램 안내</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            입양 후 초기에는 작은 변화도 보호자에게 큰 부담이 될 수 있어요.
            <br />
            Are You Okat?은 지속적인 체크인과 기록을 통해
            <br />
            보호자와 입양기관이 함께 케어할 수 있도록 돕습니다.
          </p>
        </div>
      </header>

      <main className="flex-1 px-6 pb-24">
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-0 space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              {isAgencyAdoption ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">입양기관과 상태 요약 공유</p>
                      <p className="text-xs text-muted-foreground">
                        입양 초기 1년간은 보호자, 입양기관, 필요 시 수의사가 함께 케어하는 기간입니다.
                        <br />
                        사후 케어 목적의 정보 공유는 이 기간에만 적용되며, 1년 후 자동 종료됩니다.
                      </p>
                    </div>
                    <Switch checked={isAgencyShareActive} disabled />
                  </div>

                  {isSharePeriodExpired ? (
                    <p className="text-xs text-emerald-700">1년 공동 케어가 종료되었어요.</p>
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        공유 범위: 상태 신호만(정상/주의/확인필요 + 체크인 완료 여부)
                      </p>
                      <p className="text-xs text-muted-foreground">더 상세한 공유는 추후 설정에서 선택할 수 있어요.</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">입양기관과 상태 요약을 공유할게요(선택)</p>
                      <p className="text-xs text-muted-foreground">
                        원하시면 공유할 수 있어요. 공유하면 케어 상담/지원 연결이 더 원활해질 수 있어요. 언제든 변경하거나 철회할 수 있습니다.
                      </p>
                    </div>
                    <Switch checked={shelterShareOptIn} onCheckedChange={setShelterShareOptIn} />
                  </div>

                  {shelterShareOptIn && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                      <p className="text-xs text-muted-foreground">공유 범위를 선택해 주세요. 기본은 상태 신호만입니다.</p>
                      <RadioGroup
                        value={shareLevel}
                        onValueChange={(value) => setShareLevel(value as ShareLevel)}
                        className="space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <RadioGroupItem id="share-signal" value="signal" className="mt-1" />
                          <Label htmlFor="share-signal" className="text-sm leading-relaxed">
                            상태 신호만(정상/주의/확인필요 + 체크인 완료 여부)
                          </Label>
                        </div>
                        <div className="flex items-start gap-2">
                          <RadioGroupItem id="share-summary" value="summary" className="mt-1" />
                          <Label htmlFor="share-summary" className="text-sm leading-relaxed">
                            상태 요약(변화 항목 요약 포함)
                          </Label>
                        </div>
                        <div className="flex items-start gap-2">
                          <RadioGroupItem id="share-full" value="full" className="mt-1" />
                          <Label htmlFor="share-full" className="text-sm leading-relaxed">
                            원문 응답 포함(가장 상세)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </>
              )}
            </div>

            <Alert>
              <Gift />
              <AlertTitle>케어 참여 혜택 안내</AlertTitle>
              <AlertDescription>
                <p>
                  케어 프로그램에 꾸준히 참여하신 보호자분들께
                  <br />
                  입양기관 및 협력 병원과 함께
                  <br />
                  중성화 수술 할인, 간식 지원 등
                  <br />
                  실질적인 케어 혜택을 제공하고 있어요.
                  <br />
                  (혜택은 참여 조건에 따라 달라질 수 있어요.)
                </p>
                {isAgencyAdoption ? (
                  <p className="text-xs text-muted-foreground">
                    입양 초기 1년간 공동 케어를 위한 공유이며, 1년 후 자동 종료됩니다.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    기관 공유는 선택이며, 공유 범위는 언제든 변경하거나 철회할 수 있어요.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        <Button onClick={handleContinue} className="w-full h-12" size="lg">
          계속
        </Button>
      </div>
    </div>
  )
}
