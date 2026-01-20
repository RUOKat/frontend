import type { CatProfile, Question } from "./types"
import { normalizeMedicalHistory } from "./medical-history"
import { fetchQuestions, type QuestionsData } from "./backend-care"

type FollowUpCategory = "FLUTD" | "CKD" | "GI" | "PAIN"

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

function getOnboardingQuestion(id: string, questions: QuestionsData): Question | undefined {
  return questions.onboarding?.[id]
}

export async function generateOnboardingQuestions(catProfile: CatProfile): Promise<Question[]> {
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

export async function getFollowUpQuestions(category: FollowUpCategory): Promise<Question[]> {
  const questionsData = await loadQuestions()

  // Validate questionsData structure
  if (!questionsData || !questionsData.followUp) {
    console.error('Invalid questions data structure for followUp:', questionsData)
    return []
  }

  return questionsData.followUp[category] || []
}
