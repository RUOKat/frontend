import type { CatProfile, Question } from "./types"
// import { normalizeMedicalHistory } from "./medical-history"  // 주석: 기존 로직에서 사용

// 백엔드 질문 기능 비활성화로 인한 더미 데이터
export interface QuestionsData {
  onboarding: Record<string, Question>;
  followUp: Record<string, Question[]>;
}

const STATIC_QUESTIONS: QuestionsData = {
  onboarding: {},
  followUp: {}
}

async function loadQuestions(): Promise<QuestionsData> {
  return STATIC_QUESTIONS
}

async function loadQuestionsForPet(petId: string): Promise<QuestionsData> {
  return STATIC_QUESTIONS
}

function getOnboardingQuestion(id: string, questions: QuestionsData): Question | undefined {
  return questions.onboarding?.[id]
}

// 데일리 기록 질문 5개 + 맞춤 질문 1개 (고정)
export async function generateOnboardingQuestions(catProfile: CatProfile): Promise<Question[]> {
  const questions: Question[] = []


  // 고정된 5개 질문 순서대로 추가
  const questionIds = [
    "q1_food_intake",   // 식사량
    "q2_water_intake",  // 음수량
    "q5_urine",         // 소변량
    "q4_poop",          // 대변량
    "q3_weight",        // 체중
    "q6_abnormal_signs",// 기타 이상 징후
    "q7_photo",         // 사진 업로드
  ]

  const HARDCODED_QUESTIONS: Record<string, Question> = {
    "q1_food_intake": {
      id: "q1_food_intake",
      text: "오늘 식사량은 어땠나요?",
      description: "평소 하루 권장량을 기준으로 얼마나 먹었는지 알려주세요.",
      type: "single",
      options: [
        { value: "none", label: "전혀 안 먹음" },
        { value: "less", label: "평소보다 적게" },
        { value: "normal", label: "평소만큼" },
        { value: "more", label: "평소보다 많이" }
      ]
    },
    "q2_water_intake": {
      id: "q2_water_intake",
      text: "오늘 음수량은 어땠나요?",
      description: "습식 사료를 포함하여 섭취한 수분의 양을 체크해주세요.",
      type: "single",
      options: [
        { value: "none", label: "전혀 안 마심" },
        { value: "less", label: "평소보다 적게" },
        { value: "normal", label: "평소만큼" },
        { value: "more", label: "평소보다 많이" }
      ]
    },
    "q5_urine": {
      id: "q5_urine",
      text: "오늘 소변량은 어땠나요?",
      description: "화장실의 감자 개수나 상태 등을 비교해서 알려주세요.",
      type: "single",
      options: [
        { value: "none", label: "소변을 안 봄" },
        { value: "less", label: "평소보다 적게" },
        { value: "normal", label: "평소만큼" },
        { value: "more", label: "평소보다 많이" }
      ]
    },
    "q4_poop": {
      id: "q4_poop",
      text: "오늘 대변량은 어땠나요?",
      description: "화장실의 맛동산 개수나 상태 등을 종합적으로 알려주세요.",
      type: "single",
      options: [
        { value: "none", label: "대변을 안 봄" },
        { value: "less", label: "평소보다 적게" },
        { value: "normal", label: "평소만큼" },
        { value: "more", label: "평소보다 많이" }
      ]
    },
    "q6_abnormal_signs": {
      id: "q6_abnormal_signs",
      text: "기타 이상 징후가 있었나요?",
      description: "평소와 다른 증상이 있었다면 선택해주세요. (기타 선택 시 직접 입력)",
      type: "single",
      options: [
        { value: "none", label: "해당 없음" },
        { value: "vomit", label: "구토" },
        { value: "diarrhea", label: "설사" },
        { value: "lethargy", label: "활력 저하 및 은둔" },
        { value: "urination_mistake", label: "대소변 실수" },
        { value: "drooling", label: "침 흘림" },
        { value: "other", label: "기타 (직접 입력)" }
      ]
    },
    "q3_weight": {
      id: "q3_weight",
      text: "오늘 체중은 얼마인가요?",
      description: "소수점 자리까지 입력할 수 있습니다. (kg 단위)",
      type: "number",
      options: [],
      validation: {
        min: 0,
        max: 30,
        step: 0.1
      }
    },
    "q7_photo": {
      id: "q7_photo",
      text: "우리 집 막둥이 사진도 자랑해주실래요?",
      description: "오늘의 고양이를 기록으로 남겨보세요. (선택 사항)",
      type: "photo",
      options: []
    }
  };

  for (const id of questionIds) {
    const question = HARDCODED_QUESTIONS[id]
    if (question) {
      questions.push(question)
    }
  }

  return questions
}

// followUp 질문은 현재 사용하지 않음
export async function getFollowUpQuestions(category: string): Promise<Question[]> {
  const questionsData = STATIC_QUESTIONS

  return questionsData.followUp[category] || []
}

/* ============================================
 * 기존 질문 생성 로직 (주석 처리)
 * ============================================
export async function generateOnboardingQuestions_OLD(catProfile: CatProfile): Promise<Question[]> {
  const questionsData = await loadQuestions()
  const questions: Question[] = []

  // Validate questionsData structure
  if (!questionsData || !questionsData.onboarding) {
    console.error('Invalid questions data structure:', questionsData)
    return []
  }

  const age = catProfile.birthDate
    ? Math.floor((Date.now() - new Date(catProfile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : catProfile.estimatedAge
      ? Math.floor(catProfile.estimatedAge / 12)
      : 5
  const medicalHistory = normalizeMedicalHistory(catProfile.medicalHistory)
  const hasRenalUrinaryHistory = medicalHistory?.selectedGroupIds.includes("renal-urinary") ?? false
  const hasCkdHistory = medicalHistory?.selectedItemIds.includes("ckd") ?? false
  const hasMusculoskeletalHistory = medicalHistory?.selectedGroupIds.includes("musculoskeletal") ?? false

  let question: Question | undefined

  if (catProfile.gender === "male" || hasRenalUrinaryHistory) {
    question = getOnboardingQuestion("q1_urinary_male", questionsData)
    if (question) questions.push(question)
  } else {
    question = getOnboardingQuestion("q1_urinary_general", questionsData)
    if (question) questions.push(question)
  }

  if (age >= 7 || hasRenalUrinaryHistory || hasCkdHistory) {
    question = getOnboardingQuestion("q2_water_senior", questionsData)
    if (question) questions.push(question)
  } else {
    question = getOnboardingQuestion("q2_water_general", questionsData)
    if (question) questions.push(question)
  }

  question = getOnboardingQuestion("q3_vomiting", questionsData)
  if (question) questions.push(question)

  if (age >= 10 || hasMusculoskeletalHistory) {
    question = getOnboardingQuestion("q4_mobility_senior", questionsData)
    if (question) questions.push(question)
  } else {
    question = getOnboardingQuestion("q4_activity_general", questionsData)
    if (question) questions.push(question)
  }

  question = getOnboardingQuestion("q5_appetite", questionsData)
  if (question) questions.push(question)

  return questions
}
*/
