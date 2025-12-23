"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { OnboardingAnswers, FollowUpPlan, RiskStatus } from "@/lib/types"
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
  isLoading: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingAnswers, setOnboardingAnswersState] = useState<OnboardingAnswers | null>(null)
  const [followUpPlan, setFollowUpPlanState] = useState<FollowUpPlan | null>(null)
  const [followUpAnswers, setFollowUpAnswersState] = useState<OnboardingAnswers | null>(null)
  const [riskStatus, setRiskStatusState] = useState<RiskStatus | null>(null)
  const [onboardingCompleted, setOnboardingCompletedState] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setOnboardingAnswersState(loadOnboardingAnswers())
    setFollowUpPlanState(loadFollowUpPlan())
    setFollowUpAnswersState(loadFollowUpAnswers())
    setRiskStatusState(loadRiskStatus())
    setOnboardingCompletedState(loadOnboardingCompleted())
    setIsLoading(false)
  }, [])

  const setOnboardingAnswers = (answers: OnboardingAnswers) => {
    setOnboardingAnswersState(answers)
    storageSaveOnboardingAnswers(answers)
  }

  const setFollowUpPlan = (plan: FollowUpPlan | null) => {
    setFollowUpPlanState(plan)
    if (plan) {
      storageSaveFollowUpPlan(plan)
    }
  }

  const setFollowUpAnswers = (answers: OnboardingAnswers) => {
    setFollowUpAnswersState(answers)
    storageSaveFollowUpAnswers(answers)
  }

  const setRiskStatus = (status: RiskStatus) => {
    setRiskStatusState(status)
    storageSaveRiskStatus(status)
  }

  const setOnboardingCompleted = (completed: boolean) => {
    setOnboardingCompletedState(completed)
    storageSaveOnboardingCompleted(completed)
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
