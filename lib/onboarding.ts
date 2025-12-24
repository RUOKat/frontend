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
  saveCareProgramOptIn as storageSaveCareProgramOptIn,
  loadCareProgramOptIn as storageLoadCareProgramOptIn,
  saveShelterShareOptIn as storageSaveShelterShareOptIn,
  loadShelterShareOptIn as storageLoadShelterShareOptIn,
  saveShelterShareLevel as storageSaveShelterShareLevel,
  loadShelterShareLevel as storageLoadShelterShareLevel,
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
export function saveOnboardingAnswers(answers: OnboardingAnswers, catId?: string): void {
  storageSaveOnboardingAnswers(answers, catId)
}

export function loadOnboardingAnswers(catId?: string): OnboardingAnswers | null {
  return storageLoadOnboardingAnswers<OnboardingAnswers>(catId)
}

// Follow-up Plan
export function saveFollowUpPlan(plan: FollowUpPlan, catId?: string): void {
  storageSaveFollowUpPlan(plan, catId)
}

export function loadFollowUpPlan(catId?: string): FollowUpPlan | null {
  return storageLoadFollowUpPlan<FollowUpPlan>(catId)
}

// Follow-up Answers
export function saveFollowUpAnswers(answers: OnboardingAnswers, catId?: string): void {
  storageSaveFollowUpAnswers(answers, catId)
}

export function loadFollowUpAnswers(catId?: string): OnboardingAnswers | null {
  return storageLoadFollowUpAnswers<OnboardingAnswers>(catId)
}

// Risk Status
export function saveRiskStatus(status: RiskStatus, catId?: string): void {
  storageSaveRiskStatus(status, catId)
}

export function loadRiskStatus(catId?: string): RiskStatus | null {
  return storageLoadRiskStatus<RiskStatus>(catId)
}

// Onboarding Completed
export function saveOnboardingCompleted(completed: boolean): void {
  storageSaveOnboardingCompleted(completed)
}

export function loadOnboardingCompleted(): boolean {
  return storageLoadOnboardingCompleted()
}

// Care program preferences
export function saveCareProgramOptIn(optIn: boolean, catId?: string): void {
  storageSaveCareProgramOptIn(optIn, catId)
}

export function loadCareProgramOptIn(catId?: string): boolean {
  return storageLoadCareProgramOptIn(catId)
}

export function saveShelterShareOptIn(optIn: boolean, catId?: string): void {
  storageSaveShelterShareOptIn(optIn, catId)
}

export function loadShelterShareOptIn(catId?: string): boolean {
  return storageLoadShelterShareOptIn(catId)
}

export function saveShelterShareLevel(level: string, catId?: string): void {
  storageSaveShelterShareLevel(level, catId)
}

export function loadShelterShareLevel(catId?: string): string {
  return storageLoadShelterShareLevel(catId)
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
