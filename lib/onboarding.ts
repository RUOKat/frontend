import {
  saveCatProfile as storageSaveCatProfile,
  loadCatProfile as storageLoadCatProfile,
  saveOnboardingAnswers as storageSaveOnboardingAnswers,
  loadOnboardingAnswers as storageLoadOnboardingAnswers,
  saveFollowUpPlan as storageSaveFollowUpPlan,
  loadFollowUpPlan as storageLoadFollowUpPlan,
  saveFollowUpAnswers as storageSaveFollowUpAnswers,
  loadFollowUpAnswers as storageLoadFollowUpAnswers,
  saveRiskStatus as storageSaveRiskStatus,
  loadRiskStatus as storageLoadRiskStatus,
  saveOnboardingCompleted as storageSaveOnboardingCompleted,
  loadOnboardingCompleted as storageLoadOnboardingCompleted,
} from "./storage"
import type { CatProfile, OnboardingAnswers, FollowUpPlan, RiskStatus } from "./types"

// Cat Profile
export function saveCatProfile(profile: CatProfile): void {
  storageSaveCatProfile(profile)
}

export function loadCatProfile(): CatProfile | null {
  return storageLoadCatProfile<CatProfile>()
}

// Onboarding Answers
export function saveOnboardingAnswers(answers: OnboardingAnswers): void {
  storageSaveOnboardingAnswers(answers)
}

export function loadOnboardingAnswers(): OnboardingAnswers | null {
  return storageLoadOnboardingAnswers<OnboardingAnswers>()
}

// Follow-up Plan
export function saveFollowUpPlan(plan: FollowUpPlan): void {
  storageSaveFollowUpPlan(plan)
}

export function loadFollowUpPlan(): FollowUpPlan | null {
  return storageLoadFollowUpPlan<FollowUpPlan>()
}

// Follow-up Answers
export function saveFollowUpAnswers(answers: OnboardingAnswers): void {
  storageSaveFollowUpAnswers(answers)
}

export function loadFollowUpAnswers(): OnboardingAnswers | null {
  return storageLoadFollowUpAnswers<OnboardingAnswers>()
}

// Risk Status
export function saveRiskStatus(status: RiskStatus): void {
  storageSaveRiskStatus(status)
}

export function loadRiskStatus(): RiskStatus | null {
  return storageLoadRiskStatus<RiskStatus>()
}

// Onboarding Completed
export function saveOnboardingCompleted(completed: boolean): void {
  storageSaveOnboardingCompleted(completed)
}

export function loadOnboardingCompleted(): boolean {
  return storageLoadOnboardingCompleted()
}

// 온보딩 상태 체크
export function getOnboardingStatus(): {
  hasCatProfile: boolean
  hasOnboardingAnswers: boolean
  hasFollowUpPlan: boolean
  hasFollowUpAnswers: boolean
  isCompleted: boolean
} {
  return {
    hasCatProfile: !!loadCatProfile(),
    hasOnboardingAnswers: !!loadOnboardingAnswers(),
    hasFollowUpPlan: !!loadFollowUpPlan(),
    hasFollowUpAnswers: !!loadFollowUpAnswers(),
    isCompleted: loadOnboardingCompleted(),
  }
}
