import type { CatProfile, Question } from "./types"
// import { normalizeMedicalHistory } from "./medical-history"  // 주석: 기존 로직에서 사용
import { fetchQuestions, fetchQuestionsForPet, type QuestionsData } from "./backend-care"

// type FollowUpCategory = "FLUTD" | "CKD" | "GI" | "PAIN"  // 주석: 기존 followUp 카테고리

let questionBank: QuestionsData | null = null

async function loadQuestions(): Promise<QuestionsData> {
  if (questionBank) {
    return questionBank
  }

  try {
    questionBank = await fetchQuestions()
    return questionBank
  } catch (error) {
    console.error('Failed to load questions from backend:', error)
    // Fallback to empty data if backend fails
    return {
      onboarding: {},
      followUp: {}
    }
  }
}

// petId별 맞춤 질문 로드 (DynamoDB question_bank 포함)
async function loadQuestionsForPet(petId: string): Promise<QuestionsData> {
  try {
    return await fetchQuestionsForPet(petId)
  } catch (error) {
    console.error('Failed to load questions for pet from backend:', error)
    // Fallback to basic questions
    return loadQuestions()
  }
}

function getOnboardingQuestion(id: string, questions: QuestionsData): Question | undefined {
  return questions.onboarding?.[id]
}

// 데일리 기록 질문 5개 + 맞춤 질문 1개 (고정)
export async function generateOnboardingQuestions(catProfile: CatProfile): Promise<Question[]> {
  // petId가 있으면 맞춤 질문 포함 API 호출
  const questionsData = catProfile.id
    ? await loadQuestionsForPet(catProfile.id)
    : await loadQuestions()

  const questions: Question[] = []

  // Validate questionsData structure
  if (!questionsData || !questionsData.onboarding) {
    console.error('Invalid questions data structure:', questionsData)
    return []
  }

  // 고정된 5개 질문 순서대로 추가
  const questionIds = [
    "q1_food_intake",   // 식사량
    "q2_water_intake",  // 음수량
    "q3_weight",        // 체중
    "q4_poop",          // 배변량
    "q5_urine"          // 배뇨량
  ]

  for (const id of questionIds) {
    const question = getOnboardingQuestion(id, questionsData)
    if (question) {
      questions.push(question)
    }
  }

  // 6번째 맞춤 질문 추가 (DynamoDB에서 가져온 경우)
  const customQuestion = getOnboardingQuestion("q6_custom", questionsData)
  if (customQuestion) {
    questions.push(customQuestion)
  }

  return questions
}

// followUp 질문은 현재 사용하지 않음
export async function getFollowUpQuestions(category: string): Promise<Question[]> {
  const questionsData = await loadQuestions()

  // Validate questionsData structure
  if (!questionsData || !questionsData.followUp) {
    console.error('Invalid questions data structure for followUp:', questionsData)
    return []
  }

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
