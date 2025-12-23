// localStorage 키 상수
const STORAGE_KEYS = {
  AUTH: "areyouokat_auth",
  CAT_PROFILE: "areyouokat_cat_profile",
  ONBOARDING_ANSWERS: "areyouokat_onboarding_answers",
  FOLLOW_UP_PLAN: "areyouokat_follow_up_plan",
  FOLLOW_UP_ANSWERS: "areyouokat_follow_up_answers",
  RISK_STATUS: "areyouokat_risk_status",
  ONBOARDING_COMPLETED: "areyouokat_onboarding_completed",
  DAILY_RECORDS: "areyouokat_daily_records",
  VET_VISITS: "areyouokat_vet_visits",
} as const

// 안전한 localStorage 접근
function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, value)
  } catch {
    console.error("localStorage 저장 실패:", key)
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(key)
  } catch {
    console.error("localStorage 삭제 실패:", key)
  }
}

// JSON 파싱 헬퍼
function parseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

// Auth 저장/로드
export function saveAuth(auth: object): void {
  safeSetItem(STORAGE_KEYS.AUTH, JSON.stringify(auth))
}

export function loadAuth<T>(): T | null {
  return parseJSON<T | null>(safeGetItem(STORAGE_KEYS.AUTH), null)
}

export function clearAuth(): void {
  safeRemoveItem(STORAGE_KEYS.AUTH)
}

// Cat Profile 저장/로드
export function saveCatProfile(profile: object): void {
  safeSetItem(STORAGE_KEYS.CAT_PROFILE, JSON.stringify(profile))
}

export function loadCatProfile<T>(): T | null {
  return parseJSON<T | null>(safeGetItem(STORAGE_KEYS.CAT_PROFILE), null)
}

// Onboarding Answers 저장/로드
export function saveOnboardingAnswers(answers: object): void {
  safeSetItem(STORAGE_KEYS.ONBOARDING_ANSWERS, JSON.stringify(answers))
}

export function loadOnboardingAnswers<T>(): T | null {
  return parseJSON<T | null>(safeGetItem(STORAGE_KEYS.ONBOARDING_ANSWERS), null)
}

// Follow-up Plan 저장/로드
export function saveFollowUpPlan(plan: object): void {
  safeSetItem(STORAGE_KEYS.FOLLOW_UP_PLAN, JSON.stringify(plan))
}

export function loadFollowUpPlan<T>(): T | null {
  return parseJSON<T | null>(safeGetItem(STORAGE_KEYS.FOLLOW_UP_PLAN), null)
}

// Follow-up Answers 저장/로드
export function saveFollowUpAnswers(answers: object): void {
  safeSetItem(STORAGE_KEYS.FOLLOW_UP_ANSWERS, JSON.stringify(answers))
}

export function loadFollowUpAnswers<T>(): T | null {
  return parseJSON<T | null>(safeGetItem(STORAGE_KEYS.FOLLOW_UP_ANSWERS), null)
}

// Risk Status 저장/로드
export function saveRiskStatus(status: object): void {
  safeSetItem(STORAGE_KEYS.RISK_STATUS, JSON.stringify(status))
}

export function loadRiskStatus<T>(): T | null {
  return parseJSON<T | null>(safeGetItem(STORAGE_KEYS.RISK_STATUS), null)
}

// Onboarding Completed 저장/로드
export function saveOnboardingCompleted(completed: boolean): void {
  safeSetItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed))
}

export function loadOnboardingCompleted(): boolean {
  return parseJSON<boolean>(safeGetItem(STORAGE_KEYS.ONBOARDING_COMPLETED), false)
}

// Daily Records 저장/로드
export function saveDailyRecords(records: object[]): void {
  safeSetItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(records))
}

export function loadDailyRecords<T>(): T[] {
  return parseJSON<T[]>(safeGetItem(STORAGE_KEYS.DAILY_RECORDS), [])
}

// Vet Visits 저장/로드
export function saveVetVisits(visits: object[]): void {
  safeSetItem(STORAGE_KEYS.VET_VISITS, JSON.stringify(visits))
}

export function loadVetVisits<T>(): T[] {
  return parseJSON<T[]>(safeGetItem(STORAGE_KEYS.VET_VISITS), [])
}

// 전체 초기화
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    safeRemoveItem(key)
  })
}
