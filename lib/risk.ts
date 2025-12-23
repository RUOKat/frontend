import type { CatProfile, OnboardingAnswers, FollowUpPlan, RiskStatus } from "./types"
import { getCategoryName } from "./triage"

// 위험도 계산
export function computeRiskStatus(
  catProfile: CatProfile,
  onboardingAnswers: OnboardingAnswers,
  followUpPlan: FollowUpPlan | null,
  followUpAnswers: OnboardingAnswers | null,
): RiskStatus {
  const now = new Date().toISOString()

  // 기본값: 정상
  const defaultStatus: RiskStatus = {
    level: "normal",
    labelKorean: "정상",
    summary: `${catProfile.name}의 현재 상태는 양호해 보여요.`,
    recommendations: ["규칙적인 기록으로 건강 상태를 모니터링해요.", "평소와 다른 행동이 있으면 기록해주세요."],
    lastUpdatedAt: now,
  }

  // followUpPlan이 없으면 기본적으로 정상
  // 단, onboardingAnswers 중 강한 신호가 있으면 주의
  if (!followUpPlan) {
    // 강한 신호 체크
    const hasStrongSignal = Object.entries(onboardingAnswers).some(([, answer]) => {
      return answer === "daily" || answer === "much_more" || answer === "often"
    })

    if (hasStrongSignal) {
      return {
        level: "caution",
        labelKorean: "주의",
        summary: `${catProfile.name}에게 관심을 가져야 할 신호가 있어요.`,
        recommendations: ["매일 기록을 남겨 변화를 추적해요.", "증상이 지속되면 수의사 상담을 고려해요."],
        lastUpdatedAt: now,
      }
    }

    return defaultStatus
  }

  // followUpPlan이 있으면 최소 주의
  const categoryName = getCategoryName(followUpPlan.category)

  // followUpAnswers가 없으면 주의
  if (!followUpAnswers) {
    return {
      level: "caution",
      labelKorean: "주의",
      summary: `${categoryName} 관련 신호가 있어 추가 확인이 필요해요.`,
      category: followUpPlan.category,
      recommendations: getRecommendations(followUpPlan.category, "caution"),
      lastUpdatedAt: now,
    }
  }

  // followUpAnswers 분석
  const strongAnswers = Object.values(followUpAnswers).filter((answer) =>
    ["yes", "clear", "often", "daily"].includes(answer),
  ).length

  const unknownAnswers = Object.values(followUpAnswers).filter((answer) => answer === "unknown").length

  // 강한 신호가 2개 이상이면 "확인 필요"
  if (strongAnswers >= 2) {
    return {
      level: "check",
      labelKorean: "확인 필요",
      summary: `${categoryName} 관련하여 수의사 상담을 권장해요.`,
      category: followUpPlan.category,
      recommendations: getRecommendations(followUpPlan.category, "check"),
      lastUpdatedAt: now,
    }
  }

  // 모름이 많으면 주의 유지
  if (unknownAnswers >= 2) {
    return {
      level: "caution",
      labelKorean: "주의",
      summary: `${categoryName} 상태를 좀 더 관찰해주세요.`,
      category: followUpPlan.category,
      recommendations: [
        "해당 증상들을 주의 깊게 관찰해주세요.",
        "변화가 있으면 기록으로 남겨주세요.",
        ...getRecommendations(followUpPlan.category, "caution").slice(0, 1),
      ],
      lastUpdatedAt: now,
    }
  }

  // 강한 신호가 1개 있으면 주의
  if (strongAnswers >= 1) {
    return {
      level: "caution",
      labelKorean: "주의",
      summary: `${categoryName} 관련 일부 신호가 있어요. 관찰을 계속해주세요.`,
      category: followUpPlan.category,
      recommendations: getRecommendations(followUpPlan.category, "caution"),
      lastUpdatedAt: now,
    }
  }

  // 별 문제 없음
  return {
    level: "normal",
    labelKorean: "정상",
    summary: `${catProfile.name}의 ${categoryName} 상태는 현재 양호해요.`,
    category: followUpPlan.category,
    recommendations: ["규칙적인 기록으로 건강 상태를 모니터링해요.", "변화가 있으면 바로 기록해주세요."],
    lastUpdatedAt: now,
  }
}

// 범주별 권장사항
function getRecommendations(category: "FLUTD" | "CKD" | "GI" | "PAIN", level: "caution" | "check"): string[] {
  const recommendations: Record<string, Record<string, string[]>> = {
    FLUTD: {
      caution: [
        "화장실 사용 횟수와 소변량을 매일 체크해요.",
        "물 섭취를 늘릴 수 있도록 급수대를 점검해요.",
        "스트레스 요인이 있는지 확인해요.",
      ],
      check: [
        "가급적 빠른 시일 내 수의사 상담을 권장해요.",
        "소변 샘플을 받아두면 진료에 도움이 돼요.",
        "배뇨 시 통증이나 혈뇨가 있으면 응급 상황일 수 있어요.",
      ],
    },
    CKD: {
      caution: ["음수량과 소변량 변화를 기록해요.", "체중을 정기적으로 측정해요.", "신선한 물을 항상 제공해요."],
      check: [
        "신장 기능 검사를 위해 수의사 상담을 권장해요.",
        "혈액검사와 소변검사가 필요할 수 있어요.",
        "식이 조절이 필요할 수 있으니 상담 후 결정해요.",
      ],
    },
    GI: {
      caution: ["구토 빈도와 내용물을 기록해요.", "배변 상태를 매일 확인해요.", "사료 변경이 있었는지 점검해요."],
      check: [
        "잦은 구토는 수의사 상담이 필요해요.",
        "탈수 예방을 위해 수분 섭취를 확인해요.",
        "식욕 저하가 지속되면 진료를 받아요.",
      ],
    },
    PAIN: {
      caution: [
        "활동량과 움직임 패턴을 관찰해요.",
        "좋아하는 장소에 쉽게 접근할 수 있게 해요.",
        "과도한 운동이나 점프를 피해요.",
      ],
      check: [
        "통증 관리를 위해 수의사 상담을 권장해요.",
        "관절 건강 보조제에 대해 상담해요.",
        "환경을 편안하게 조성해요 (낮은 화장실, 계단 설치 등).",
      ],
    },
  }

  return recommendations[category]?.[level] || []
}
