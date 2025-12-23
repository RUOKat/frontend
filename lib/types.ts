// 고양이 프로필 타입
export interface CatProfile {
  // 필수
  name: string
  birthDate?: string // ISO string
  estimatedAge?: number // 개월 수
  unknownBirthday: boolean
  gender: "male" | "female"
  neutered: boolean
  breed: string
  weight: number // kg
  bcs: number | null // 1-9, null = 모름
  foodType: "dry" | "wet" | "mixed" | "prescription"
  waterSource: "fountain" | "bowl" | "mixed"

  // 선택
  activityLevel?: "low" | "medium" | "high"
  livingEnvironment?: "indoor" | "outdoor" | "both"
  multiCat?: boolean
  catCount?: number
  mealsPerDay?: number
  waterIntakeTendency?: "low" | "normal" | "high" | "unknown"
  medicalHistory?: MedicalCondition[]
  medications?: string
  notes?: string
  vetInfo?: string
  notificationPreference?: "all" | "important" | "none"
  profilePhoto?: string
}

export type MedicalCondition =
  | "kidney"
  | "urinary"
  | "ckd"
  | "diabetes"
  | "thyroid"
  | "dental"
  | "skin"
  | "joint"
  | "heart"
  | "unknown"

// 질문 타입
export interface Question {
  id: string
  text: string
  description: string
  type: "single" | "scale" | "yesno"
  options: QuestionOption[]
  category?: "FLUTD" | "CKD" | "GI" | "PAIN"
}

export interface QuestionOption {
  value: string
  label: string
  score?: number
}

// 온보딩 답변 타입
export interface OnboardingAnswers {
  [questionId: string]: string
}

// Follow-up 계획 타입
export interface FollowUpPlan {
  category: "FLUTD" | "CKD" | "GI" | "PAIN"
  score: number
  reasonSummary: string
  questions: Question[]
}

// 위험도 상태 타입
export interface RiskStatus {
  level: "normal" | "caution" | "check"
  labelKorean: "정상" | "주의" | "확인 필요"
  summary: string
  category?: "FLUTD" | "CKD" | "GI" | "PAIN"
  recommendations: string[]
  lastUpdatedAt: string
}

// 인증 상태 타입
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
}

export interface User {
  id: string
  email: string
  name?: string
}

// 기록 타입
export interface DailyRecord {
  id: string
  date: string
  urineCount: number
  poopCount: number
  poopConsistency?: "hard" | "normal" | "soft" | "liquid"
  foodIntake: "none" | "little" | "normal" | "much"
  waterIntake: "none" | "little" | "normal" | "much"
  activityLevel: "low" | "normal" | "high"
  vomiting: boolean
  vomitCount?: number
  notes?: string
  abnormalSigns?: string[]
  createdAt: string
}

// 진료 기록 타입
export interface VetVisit {
  id: string
  date: string
  clinic: string
  reason: string
  diagnosis?: string
  treatment?: string
  medications?: string
  nextVisit?: string
  notes?: string
  createdAt: string
}
