// localStorage 키 상수
const STORAGE_KEYS = {
  AUTH: "areyouokat_auth",
  CAT_PROFILE: "areyouokat_cat_profile",
  CATS: "areyouokat_cats",
  ACTIVE_CAT_ID: "areyouokat_active_cat_id",
  NEW_CAT_MODE: "areyouokat_new_cat_mode",
  ONBOARDING_ANSWERS: "areyouokat_onboarding_answers",
  FOLLOW_UP_PLAN: "areyouokat_follow_up_plan",
  FOLLOW_UP_ANSWERS: "areyouokat_follow_up_answers",
  RISK_STATUS: "areyouokat_risk_status",
  ONBOARDING_COMPLETED: "areyouokat_onboarding_completed",
  CARE_PROGRAM_OPT_IN: "areyouokat_care_program_opt_in",
  SHELTER_SHARE_OPT_IN: "areyouokat_shelter_share_opt_in",
  SHELTER_SHARE_LEVEL: "areyouokat_shelter_share_level",
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

function buildCatKey(baseKey: string, catId?: string): string {
  return catId ? `${baseKey}_${catId}` : baseKey
}

function loadCatScoped<T>(baseKey: string, catId: string | undefined, fallback: T): T {
  return parseJSON<T>(safeGetItem(buildCatKey(baseKey, catId)), fallback)
}

function saveCatScoped(baseKey: string, value: unknown, catId?: string): void {
  safeSetItem(buildCatKey(baseKey, catId), JSON.stringify(value))
}

export function migrateCatScopedKey(catId: string, baseKey: string): void {
  if (!catId) return
  const scopedKey = buildCatKey(baseKey, catId)
  if (safeGetItem(scopedKey) !== null) return
  const legacy = safeGetItem(baseKey)
  if (legacy === null) return
  safeSetItem(scopedKey, legacy)
}

export function migrateLegacyCatData(catId: string): void {
  if (!catId) return
  const keys = [
    STORAGE_KEYS.ONBOARDING_ANSWERS,
    STORAGE_KEYS.FOLLOW_UP_PLAN,
    STORAGE_KEYS.FOLLOW_UP_ANSWERS,
    STORAGE_KEYS.RISK_STATUS,
    STORAGE_KEYS.SHELTER_SHARE_OPT_IN,
    STORAGE_KEYS.SHELTER_SHARE_LEVEL,
    STORAGE_KEYS.DAILY_RECORDS,
    STORAGE_KEYS.VET_VISITS,
    STORAGE_KEYS.CARE_PROGRAM_OPT_IN,
  ]
  keys.forEach((key) => migrateCatScopedKey(catId, key))
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

// Cat Profile 저장/로드 (legacy)
export function saveCatProfile(profile: object): void {
  safeSetItem(STORAGE_KEYS.CAT_PROFILE, JSON.stringify(profile))
}

export function loadCatProfile<T>(): T | null {
  return parseJSON<T | null>(safeGetItem(STORAGE_KEYS.CAT_PROFILE), null)
}

// Cats list 저장/로드
export function saveCats(cats: object[]): void {
  safeSetItem(STORAGE_KEYS.CATS, JSON.stringify(cats))
}

export function loadCats<T>(): T[] {
  return parseJSON<T[]>(safeGetItem(STORAGE_KEYS.CATS), [])
}

// Active cat 저장/로드
export function saveActiveCatId(id: string): void {
  safeSetItem(STORAGE_KEYS.ACTIVE_CAT_ID, JSON.stringify(id))
}

export function loadActiveCatId(): string | null {
  return parseJSON<string | null>(safeGetItem(STORAGE_KEYS.ACTIVE_CAT_ID), null)
}

// New cat mode 저장/로드
export function saveNewCatMode(enabled: boolean): void {
  safeSetItem(STORAGE_KEYS.NEW_CAT_MODE, JSON.stringify(enabled))
}

export function loadNewCatMode(): boolean {
  return parseJSON<boolean>(safeGetItem(STORAGE_KEYS.NEW_CAT_MODE), false)
}

export function clearNewCatMode(): void {
  safeRemoveItem(STORAGE_KEYS.NEW_CAT_MODE)
}

// Onboarding Answers 저장/로드
export function saveOnboardingAnswers(answers: object, catId?: string): void {
  saveCatScoped(STORAGE_KEYS.ONBOARDING_ANSWERS, answers, catId)
}

export function loadOnboardingAnswers<T>(catId?: string): T | null {
  return loadCatScoped<T | null>(STORAGE_KEYS.ONBOARDING_ANSWERS, catId, null)
}

// Follow-up Plan 저장/로드
export function saveFollowUpPlan(plan: object, catId?: string): void {
  saveCatScoped(STORAGE_KEYS.FOLLOW_UP_PLAN, plan, catId)
}

export function loadFollowUpPlan<T>(catId?: string): T | null {
  return loadCatScoped<T | null>(STORAGE_KEYS.FOLLOW_UP_PLAN, catId, null)
}

// Follow-up Answers 저장/로드
export function saveFollowUpAnswers(answers: object, catId?: string): void {
  saveCatScoped(STORAGE_KEYS.FOLLOW_UP_ANSWERS, answers, catId)
}

export function loadFollowUpAnswers<T>(catId?: string): T | null {
  return loadCatScoped<T | null>(STORAGE_KEYS.FOLLOW_UP_ANSWERS, catId, null)
}

// Risk Status 저장/로드
export function saveRiskStatus(status: object, catId?: string): void {
  saveCatScoped(STORAGE_KEYS.RISK_STATUS, status, catId)
}

export function loadRiskStatus<T>(catId?: string): T | null {
  return loadCatScoped<T | null>(STORAGE_KEYS.RISK_STATUS, catId, null)
}

// Onboarding Completed 저장/로드
export function saveOnboardingCompleted(completed: boolean): void {
  safeSetItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed))
}

export function loadOnboardingCompleted(): boolean {
  return parseJSON<boolean>(safeGetItem(STORAGE_KEYS.ONBOARDING_COMPLETED), false)
}

// Care program preferences
export function saveCareProgramOptIn(optIn: boolean, catId?: string): void {
  saveCatScoped(STORAGE_KEYS.CARE_PROGRAM_OPT_IN, optIn, catId)
}

export function loadCareProgramOptIn(catId?: string): boolean {
  return loadCatScoped<boolean>(STORAGE_KEYS.CARE_PROGRAM_OPT_IN, catId, false)
}

export function saveShelterShareOptIn(optIn: boolean, catId?: string): void {
  saveCatScoped(STORAGE_KEYS.SHELTER_SHARE_OPT_IN, optIn, catId)
}

export function loadShelterShareOptIn(catId?: string): boolean {
  return loadCatScoped<boolean>(STORAGE_KEYS.SHELTER_SHARE_OPT_IN, catId, false)
}

export function saveShelterShareLevel(level: string, catId?: string): void {
  saveCatScoped(STORAGE_KEYS.SHELTER_SHARE_LEVEL, level, catId)
}

export function loadShelterShareLevel(catId?: string): string {
  return loadCatScoped<string>(STORAGE_KEYS.SHELTER_SHARE_LEVEL, catId, "signal")
}

// Daily Records 저장/로드
export function saveDailyRecords(records: object[], catId?: string): void {
  saveCatScoped(STORAGE_KEYS.DAILY_RECORDS, records, catId)
}

export function loadDailyRecords<T>(catId?: string): T[] {
  return loadCatScoped<T[]>(STORAGE_KEYS.DAILY_RECORDS, catId, [])
}

// Vet Visits 저장/로드
export function saveVetVisits(visits: object[], catId?: string): void {
  saveCatScoped(STORAGE_KEYS.VET_VISITS, visits, catId)
}

export function loadVetVisits<T>(catId?: string): T[] {
  return loadCatScoped<T[]>(STORAGE_KEYS.VET_VISITS, catId, [])
}

// 전체 초기화
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    safeRemoveItem(key)
  })
}
