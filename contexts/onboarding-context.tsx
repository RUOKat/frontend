"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { OnboardingAnswers, FollowUpPlan, RiskStatus, ShareLevel } from "@/lib/types"
import { useActiveCat } from "@/contexts/active-cat-context"
import {
  loadOnboardingAnswers,
  saveOnboardingAnswers as storageSaveOnboardingAnswers,
  loadFollowUpPlan,
  saveFollowUpPlan as storageSaveFollowUpPlan,
  loadFollowUpAnswers,
  saveFollowUpAnswers as storageSaveFollowUpAnswers,
  loadRiskStatus,
  saveRiskStatus as storageSaveRiskStatus,
  loadOnboardingCompleted,
  saveOnboardingCompleted as storageSaveOnboardingCompleted,
  loadShelterShareOptIn,
  saveShelterShareOptIn as storageSaveShelterShareOptIn,
  loadShelterShareLevel,
  saveShelterShareLevel as storageSaveShelterShareLevel,
} from "@/lib/onboarding"

interface OnboardingContextType {
  onboardingAnswers: OnboardingAnswers | null
  setOnboardingAnswers: (answers: OnboardingAnswers) => void
  followUpPlan: FollowUpPlan | null
  setFollowUpPlan: (plan: FollowUpPlan | null) => void
  followUpAnswers: OnboardingAnswers | null
  setFollowUpAnswers: (answers: OnboardingAnswers) => void
  riskStatus: RiskStatus | null
  setRiskStatus: (status: RiskStatus) => void
  onboardingCompleted: boolean
  setOnboardingCompleted: (completed: boolean) => void
  shelterShareOptIn: boolean
  setShelterShareOptIn: (optIn: boolean) => void
  shareLevel: ShareLevel
  setShareLevel: (level: ShareLevel) => void
  isLoading: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { activeCatId, isLoading: catLoading } = useActiveCat()
  const [onboardingAnswers, setOnboardingAnswersState] = useState<OnboardingAnswers | null>(null)
  const [followUpPlan, setFollowUpPlanState] = useState<FollowUpPlan | null>(null)
  const [followUpAnswers, setFollowUpAnswersState] = useState<OnboardingAnswers | null>(null)
  const [riskStatus, setRiskStatusState] = useState<RiskStatus | null>(null)
  const [onboardingCompleted, setOnboardingCompletedState] = useState(false)
  const [shelterShareOptIn, setShelterShareOptInState] = useState(false)
  const [shareLevel, setShareLevelState] = useState<ShareLevel>("signal")
  const [isLoading, setIsLoading] = useState(true)
  const didInit = useRef(false)

  useEffect(() => {
    if (catLoading) return
    const catId = activeCatId ?? undefined
    setOnboardingAnswersState(loadOnboardingAnswers(catId))
    setFollowUpPlanState(loadFollowUpPlan(catId))
    setFollowUpAnswersState(loadFollowUpAnswers(catId))
    setRiskStatusState(loadRiskStatus(catId))
    setShelterShareOptInState(loadShelterShareOptIn(catId))
    setShareLevelState(loadShelterShareLevel(catId) as ShareLevel)

    if (!didInit.current) {
      setOnboardingCompletedState(loadOnboardingCompleted())
      setIsLoading(false)
      didInit.current = true
    }
  }, [activeCatId, catLoading])

  const setOnboardingAnswers = (answers: OnboardingAnswers) => {
    setOnboardingAnswersState(answers)
    storageSaveOnboardingAnswers(answers, activeCatId ?? undefined)
  }

  const setFollowUpPlan = (plan: FollowUpPlan | null) => {
    setFollowUpPlanState(plan)
    if (plan) {
      storageSaveFollowUpPlan(plan, activeCatId ?? undefined)
    }
  }

  const setFollowUpAnswers = (answers: OnboardingAnswers) => {
    setFollowUpAnswersState(answers)
    storageSaveFollowUpAnswers(answers, activeCatId ?? undefined)
  }

  const setRiskStatus = (status: RiskStatus) => {
    setRiskStatusState(status)
    storageSaveRiskStatus(status, activeCatId ?? undefined)
  }

  const setOnboardingCompleted = (completed: boolean) => {
    setOnboardingCompletedState(completed)
    storageSaveOnboardingCompleted(completed)
  }

  const setShelterShareOptIn = (optIn: boolean) => {
    setShelterShareOptInState(optIn)
    storageSaveShelterShareOptIn(optIn, activeCatId ?? undefined)
  }

  const setShareLevel = (level: ShareLevel) => {
    setShareLevelState(level)
    storageSaveShelterShareLevel(level, activeCatId ?? undefined)
  }

  return (
    <OnboardingContext.Provider
      value={{
        onboardingAnswers,
        setOnboardingAnswers,
        followUpPlan,
        setFollowUpPlan,
        followUpAnswers,
        setFollowUpAnswers,
        riskStatus,
        setRiskStatus,
        onboardingCompleted,
        setOnboardingCompleted,
        shelterShareOptIn,
        setShelterShareOptIn,
        shareLevel,
        setShareLevel,
        isLoading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
