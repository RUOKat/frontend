import type { CatProfile, OnboardingAnswers, FollowUpPlan } from "./types"
import { getFollowUpQuestions } from "./questions"

interface CategoryScore {
  category: "FLUTD" | "CKD" | "GI" | "PAIN"
  score: number
  reasons: string[]
}

// 의심 징후 평가
export function evaluateSuspicion(catProfile: CatProfile, onboardingAnswers: OnboardingAnswers): FollowUpPlan | null {
  const scores: CategoryScore[] = [
    { category: "FLUTD", score: 0, reasons: [] },
    { category: "CKD", score: 0, reasons: [] },
    { category: "GI", score: 0, reasons: [] },
    { category: "PAIN", score: 0, reasons: [] },
  ]

  // 프로필 기반 가산점
  const age = catProfile.birthDate
    ? Math.floor((Date.now() - new Date(catProfile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : catProfile.estimatedAge
      ? Math.floor(catProfile.estimatedAge / 12)
      : 5

  // 나이 기반
  if (age >= 7) {
    const ckdScore = scores.find((s) => s.category === "CKD")!
    ckdScore.score += 1
    ckdScore.reasons.push("7살 이상 시니어 고양이")
  }

  if (age >= 10) {
    const painScore = scores.find((s) => s.category === "PAIN")!
    painScore.score += 1
    painScore.reasons.push("10살 이상 고령 고양이")
  }

  // 성별 기반
  if (catProfile.gender === "male") {
    const flutdScore = scores.find((s) => s.category === "FLUTD")!
    flutdScore.score += 1
    flutdScore.reasons.push("수컷 고양이 (요로 문제 취약)")
  }

  // 병력 기반
  if (catProfile.medicalHistory?.includes("urinary") || catProfile.medicalHistory?.includes("kidney")) {
    const flutdScore = scores.find((s) => s.category === "FLUTD")!
    flutdScore.score += 1
    flutdScore.reasons.push("요로/신장 병력")
  }

  if (catProfile.medicalHistory?.includes("ckd")) {
    const ckdScore = scores.find((s) => s.category === "CKD")!
    ckdScore.score += 2
    ckdScore.reasons.push("CKD 병력")
  }

  // 답변 기반 점수 계산
  Object.entries(onboardingAnswers).forEach(([questionId, answer]) => {
    // Q1: 배뇨 관련
    if (questionId.startsWith("q1_")) {
      const flutdScore = scores.find((s) => s.category === "FLUTD")!
      if (answer === "often") {
        flutdScore.score += 2
        flutdScore.reasons.push("배뇨 시 불편 증상")
      } else if (answer === "rarely" || answer === "more" || answer === "less") {
        flutdScore.score += 1
        flutdScore.reasons.push("화장실 습관 변화")
      }
    }

    // Q2: 음수량 관련
    if (questionId.startsWith("q2_")) {
      const ckdScore = scores.find((s) => s.category === "CKD")!
      if (answer === "much_more" || answer === "much") {
        ckdScore.score += 2
        ckdScore.reasons.push("음수량 증가")
      } else if (answer === "little_more") {
        ckdScore.score += 1
        ckdScore.reasons.push("음수량 약간 증가")
      }
    }

    // Q3: 구토 관련
    if (questionId === "q3_vomiting") {
      const giScore = scores.find((s) => s.category === "GI")!
      if (answer === "daily") {
        giScore.score += 3
        giScore.reasons.push("매일 구토")
      } else if (answer === "weekly") {
        giScore.score += 2
        giScore.reasons.push("주 1회 이상 구토")
      }
    }

    // Q4: 활동성/통증 관련
    if (questionId.startsWith("q4_")) {
      const painScore = scores.find((s) => s.category === "PAIN")!
      if (answer === "often" || answer === "decreased") {
        painScore.score += 2
        painScore.reasons.push("활동량 감소/움직임 회피")
      } else if (answer === "sometimes") {
        painScore.score += 1
        painScore.reasons.push("가끔 움직임 주저")
      }
    }

    // Q5: 식욕 관련
    if (questionId === "q5_appetite") {
      const giScore = scores.find((s) => s.category === "GI")!
      if (answer === "decreased") {
        giScore.score += 2
        giScore.reasons.push("식욕 감소")
      } else if (answer === "picky") {
        giScore.score += 1
        giScore.reasons.push("음식 까다로움 증가")
      }
    }
  })

  // 최고 점수 범주 찾기
  const sortedScores = [...scores].sort((a, b) => b.score - a.score)
  const topCategory = sortedScores[0]

  // 임계값 (2점 미만이면 추가 질문 없음)
  const THRESHOLD = 2
  if (topCategory.score < THRESHOLD) {
    return null
  }

  // Follow-up 계획 생성
  return {
    category: topCategory.category,
    score: topCategory.score,
    reasonSummary: topCategory.reasons.join(", "),
    questions: getFollowUpQuestions(topCategory.category),
  }
}

// 범주별 한글 이름
export function getCategoryName(category: "FLUTD" | "CKD" | "GI" | "PAIN"): string {
  const names = {
    FLUTD: "요로 건강",
    CKD: "신장 건강",
    GI: "소화기 건강",
    PAIN: "활동성/통증",
  }
  return names[category]
}
