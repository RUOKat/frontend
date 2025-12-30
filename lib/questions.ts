import type { CatProfile, Question } from "./types"
import questionsData from "./questions.json"
import { normalizeMedicalHistory } from "./medical-history"

type FollowUpCategory = "FLUTD" | "CKD" | "GI" | "PAIN"

type QuestionsData = {
  onboarding: Record<string, Question>
  followUp: Record<FollowUpCategory, Question[]>
}

const questionBank = questionsData as QuestionsData

function getOnboardingQuestion(id: string): Question {
  return questionBank.onboarding[id]
}

export function generateOnboardingQuestions(catProfile: CatProfile): Question[] {
  const questions: Question[] = []
  const age = catProfile.birthDate
    ? Math.floor((Date.now() - new Date(catProfile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : catProfile.estimatedAge
      ? Math.floor(catProfile.estimatedAge / 12)
      : 5
  const medicalHistory = normalizeMedicalHistory(catProfile.medicalHistory)
  const hasRenalUrinaryHistory = medicalHistory?.selectedGroupIds.includes("renal-urinary") ?? false
  const hasCkdHistory = medicalHistory?.selectedItemIds.includes("ckd") ?? false
  const hasMusculoskeletalHistory = medicalHistory?.selectedGroupIds.includes("musculoskeletal") ?? false

  if (catProfile.gender === "male" || hasRenalUrinaryHistory) {
    questions.push(getOnboardingQuestion("q1_urinary_male"))
  } else {
    questions.push(getOnboardingQuestion("q1_urinary_general"))
  }

  if (age >= 7 || hasRenalUrinaryHistory || hasCkdHistory) {
    questions.push(getOnboardingQuestion("q2_water_senior"))
  } else {
    questions.push(getOnboardingQuestion("q2_water_general"))
  }

  questions.push(getOnboardingQuestion("q3_vomiting"))

  if (age >= 10 || hasMusculoskeletalHistory) {
    questions.push(getOnboardingQuestion("q4_mobility_senior"))
  } else {
    questions.push(getOnboardingQuestion("q4_activity_general"))
  }

  questions.push(getOnboardingQuestion("q5_appetite"))

  return questions
}

export function getFollowUpQuestions(category: FollowUpCategory): Question[] {
  return questionBank.followUp[category] || []
}
