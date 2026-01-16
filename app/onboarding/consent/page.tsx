"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useActiveCat } from "@/contexts/active-cat-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import type { DataSharing, ShareLevel } from "@/lib/types"

const CARE_MESSAGE_REQUIRED =
  "입양 초기 1년은 아이가 새 환경에 적응하며\n건강·행동 변화가 가장 많이 나타나는 시기예요.\nAre You Okat?은 사용자(집사)와 입양기관,\n그리고 필요 시 수의사가 같은 정보를 바탕으로\n더 빠르게 도울 수 있도록 '1년 동안만' 기록을 공유해요."

const CARE_MESSAGE_OPTIONAL =
  "Are You Okat?은 필요할 때 전문가들과\n정보를 공유해서 더 나은 케어를 받을 수 있어요.\n언제든지 공유를 시작하거나 중단할 수 있으며,\n공유 범위도 자유롭게 조절할 수 있습니다."

const CARE_BULLETS_REQUIRED = [
  "이 기능은 '감시'가 아니라 '공동 케어' 목적이에요.",
  "공유는 입양 후 1년까지만 자동으로 적용돼요.",
  "민감 정보는 최소화하고, 건강/행동 기록 중심으로 공유돼요.",
]

const CARE_BULLETS_OPTIONAL = [
  "이 기능은 '감시'가 아니라 '선택적 케어 지원' 목적이에요.",
  "언제든지 공유를 켜거나 끌 수 있어요.",
  "민감 정보는 최소화하고, 건강/행동 기록 중심으로 공유돼요.",
]

function buildOneYearLaterISO(base: Date): string {
  const end = new Date(base)
  end.setFullYear(end.getFullYear() + 1)
  return end.toISOString()
}

export default function ConsentNoticePage() {
  const router = useRouter()
  const { shelterShareOptIn, setShelterShareOptIn, shareLevel, setShareLevel, setOnboardingCompleted } = useOnboarding()
  const { activeCat, updateCat } = useActiveCat()
  const [consentChecked, setConsentChecked] = useState(false)

  const adoptionPathLabel = activeCat?.adoptionPath || ""
  const normalizedAdoptionPath = adoptionPathLabel.toLowerCase()
  const adoptionSource = activeCat?.adoptionSource
  const hasAgencyCode = Boolean(activeCat?.agencyCode?.trim() || activeCat?.adoptionAgencyCode?.trim())
  const isAgencyAdoption =
    adoptionSource === "shelter" ||
    adoptionSource === "agency" ||
    normalizedAdoptionPath.includes("보호소") ||
    normalizedAdoptionPath.includes("입양기관") ||
    normalizedAdoptionPath.includes("agency") ||
    normalizedAdoptionPath.includes("shelter")

  // 필수/선택에 따른 메시지 선택
  const careMessage = isAgencyAdoption ? CARE_MESSAGE_REQUIRED : CARE_MESSAGE_OPTIONAL
  const careBullets = isAgencyAdoption ? CARE_BULLETS_REQUIRED : CARE_BULLETS_OPTIONAL
  const pageTitle = isAgencyAdoption ? "1년간 함께 케어하기" : "선택적 케어 지원"

  useEffect(() => {
    if (!activeCat) return
    const initialChecked = Boolean(activeCat.dataSharing?.enabled ?? shelterShareOptIn)
    setConsentChecked(initialChecked)
  }, [activeCat, shelterShareOptIn])

  useEffect(() => {
    if (!activeCat?.dataSharing?.expiresAt) return
    const expiresAt = new Date(activeCat.dataSharing.expiresAt).getTime()
    if (Number.isNaN(expiresAt) || expiresAt >= Date.now()) return
    if (!activeCat.dataSharing.enabled) return

    const nextDataSharing: DataSharing = {
      ...activeCat.dataSharing,
      enabled: false,
    }
    // 만료 처리는 로컬에서만 (백엔드 동기화 스킵)
    updateCat({
      ...activeCat,
      dataSharing: nextDataSharing,
    }, true)
    setShelterShareOptIn(false)
  }, [activeCat, setShelterShareOptIn, updateCat])

  const handleConsentChange = (checked: boolean) => {
    setConsentChecked(checked)
    if (!isAgencyAdoption) {
      setShelterShareOptIn(checked)
      if (!checked) {
        setShareLevel("signal")
      }
    }
  }

  const applyDataSharing = (enabled: boolean, required: boolean) => {
    if (!activeCat) return
    const now = new Date()
    const expiresAt = enabled && isAgencyAdoption ? buildOneYearLaterISO(now) : null
    const nextDataSharing: DataSharing = {
      enabled,
      required,
      expiresAt,
    }

    updateCat({
      ...activeCat,
      dataSharing: nextDataSharing,
      careShareStartAt: enabled ? now.toISOString() : undefined,
      careShareEndAt: enabled && isAgencyAdoption ? (expiresAt || undefined) : undefined,
      agencyCode: activeCat.agencyCode ?? activeCat.adoptionAgencyCode,
    })

    setShelterShareOptIn(enabled)
    if (enabled && shareLevel !== "signal" && required) {
      setShareLevel("signal")
    }

    setOnboardingCompleted(true)
    router.push("/")
  }

  const handleRequiredContinue = () => {
    if (!consentChecked || !hasAgencyCode) return
    applyDataSharing(true, true)
  }

  const handleOptionalContinue = () => {
    if (!consentChecked) return
    applyDataSharing(true, false)
  }

  const handleOptionalSkip = () => {
    applyDataSharing(false, false)
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
              <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pb-32 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{careMessage}</p>
            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
              {careBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="care-share-consent"
                checked={consentChecked}
                onCheckedChange={(value) => handleConsentChange(Boolean(value))}
              />
              <div className="space-y-1">
                <Label htmlFor="care-share-consent" className="text-sm font-medium leading-relaxed">
                  {isAgencyAdoption 
                    ? "위 내용을 이해했고 1년간 공유에 동의합니다"
                    : "위 내용을 이해했고 선택적 공유에 동의합니다"
                  }
                </Label>
                {isAgencyAdoption && (
                  <p className="text-xs text-muted-foreground">동의는 입양기관 입양 시 필수 항목입니다.</p>
                )}
              </div>
            </div>

            {isAgencyAdoption ? (
              consentChecked && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    공유 범위를 선택해 주세요. 기본은 상태 신호만입니다.
                  </p>
                  <RadioGroup
                    value={shareLevel}
                    onValueChange={(value) => setShareLevel(value as ShareLevel)}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem id="share-signal-required" value="signal" className="mt-1" />
                      <Label htmlFor="share-signal-required" className="text-sm leading-relaxed">
                        상태 신호만(정상/주의/확인 필요 + 체크인 완료율)
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <RadioGroupItem id="share-summary-required" value="summary" className="mt-1" />
                      <Label htmlFor="share-summary-required" className="text-sm leading-relaxed">
                        상태 요약(변화 항목 요약 포함)
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <RadioGroupItem id="share-full-required" value="full" className="mt-1" />
                      <Label htmlFor="share-full-required" className="text-sm leading-relaxed">
                        원문 응답 포함(가장 상세)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )
            ) : (
              consentChecked && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    원하시면 공유 범위를 선택해 주세요. 기본은 상태 신호만입니다.
                  </p>
                  <RadioGroup
                    value={shareLevel}
                    onValueChange={(value) => setShareLevel(value as ShareLevel)}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem id="share-signal" value="signal" className="mt-1" />
                      <Label htmlFor="share-signal" className="text-sm leading-relaxed">
                        상태 신호만(정상/주의/확인 필요 + 체크인 완료율)
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
              )
            )}
          </CardContent>
        </Card>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        {isAgencyAdoption ? (
          <Button onClick={handleRequiredContinue} disabled={!consentChecked || !hasAgencyCode} className="w-full h-12" size="lg">
            동의하고 1년 공동 케어 시작하기
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleOptionalSkip} className="flex-1 h-12" size="lg">
              나중에 하기
            </Button>
            <Button onClick={handleOptionalContinue} disabled={!consentChecked} className="flex-1 h-12" size="lg">
              선택하고 계속하기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}