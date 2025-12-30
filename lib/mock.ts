import { createEmptyMedicalHistory } from "./medical-history"
import type { CatProfile, DailyRecord, VetVisit, User } from "./types"

// Mock 사용자
export const mockUser: User = {
  id: "mock-user-001",
  email: "demo@areyouokat.com",
  name: "집사님",
}

// Mock 고양이 프로필 (온보딩 완료 상태 테스트용)
export const mockCatProfile: CatProfile = {
  name: "나비",
  adoptionPath: "보호소/입양기관",
  birthDate: "2020-03-15",
  unknownBirthday: false,
  gender: "female",
  neutered: true,
  breed: "코리안숏헤어",
  weight: 4.2,
  bcs: 5,
  foodType: "mixed",
  waterSource: "fountain",
  activityLevel: "medium",
  livingEnvironment: "indoor",
  multiCat: false,
  mealsPerDay: 2,
  waterIntakeTendency: "normal",
  medicalHistory: createEmptyMedicalHistory(),
}

// Mock 일일 기록
export const mockDailyRecords: DailyRecord[] = [
  {
    id: "record-001",
    date: new Date().toISOString().split("T")[0],
    urineCount: 3,
    poopCount: 1,
    poopConsistency: "normal",
    foodIntake: "normal",
    waterIntake: "normal",
    activityLevel: "normal",
    vomiting: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "record-002",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    urineCount: 2,
    poopCount: 1,
    poopConsistency: "normal",
    foodIntake: "normal",
    waterIntake: "little",
    activityLevel: "low",
    vomiting: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

// Mock 진료 기록
export const mockVetVisits: VetVisit[] = [
  {
    id: "vet-001",
    date: "2024-01-15",
    clinic: "행복한동물병원",
    reason: "정기 건강검진",
    diagnosis: "건강함",
    treatment: "예방접종",
    createdAt: "2024-01-15T10:00:00Z",
  },
]

// 품종 목록
export const catBreeds = [
  "코리안숏헤어",
  "페르시안",
  "러시안블루",
  "브리티시숏헤어",
  "스코티시폴드",
  "아메리칸숏헤어",
  "먼치킨",
  "벵갈",
  "랙돌",
  "샴",
  "메인쿤",
  "노르웨이숲",
  "터키시앙고라",
  "아비시니안",
  "버먼",
  "기타",
]
