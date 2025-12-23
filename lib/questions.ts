import type { CatProfile, Question } from "./types"
import questionsData from "./questions.json"

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

  if (catProfile.gender === "male" || catProfile.medicalHistory?.includes("urinary")) {
    questions.push(getOnboardingQuestion("q1_urinary_male"))
  } else {
    questions.push(getOnboardingQuestion("q1_urinary_general"))
  }

  if (age >= 7 || catProfile.medicalHistory?.includes("kidney") || catProfile.medicalHistory?.includes("ckd")) {
    questions.push(getOnboardingQuestion("q2_water_senior"))
  } else {
    questions.push(getOnboardingQuestion("q2_water_general"))
  }

  questions.push(getOnboardingQuestion("q3_vomiting"))

  if (age >= 10 || catProfile.medicalHistory?.includes("joint")) {
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
