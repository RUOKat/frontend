export const MEDICAL_HISTORY_VERSION = 2 as const

export const medicalHistoryGroups = [
  { id: "renal-urinary", label: "신장·요로" },
  { id: "gastrointestinal", label: "소화기" },
  { id: "metabolic-hormonal", label: "대사/호르몬" },
  { id: "cardiovascular", label: "심혈관" },
  { id: "musculoskeletal", label: "근골격(관절)" },
  { id: "dermatologic-allergy", label: "피부/알러지" },
  { id: "oral", label: "구강" },
  { id: "respiratory", label: "호흡기" },
  { id: "neurologic", label: "신경계" },
  { id: "infectious-immune", label: "감염/면역" },
  { id: "weight-obesity", label: "체중/비만" },
] as const

export type MedicalHistoryGroupId = (typeof medicalHistoryGroups)[number]["id"]

export type MedicalHistoryGroup = {
  id: MedicalHistoryGroupId
  label: string
}

export type MedicalHistoryItemType = "disease" | "symptom"

export const medicalHistoryItems = [
  // 신장·요로
  { id: "ckd", label: "CKD(만성 신장병)", type: "disease", groupId: "renal-urinary" },
  { id: "aki", label: "AKI(급성 신손상)", type: "disease", groupId: "renal-urinary" },
  { id: "fic", label: "FIC(특발성 방광염)", type: "disease", groupId: "renal-urinary" },
  { id: "urethral-obstruction", label: "요도 폐색", type: "disease", groupId: "renal-urinary" },
  { id: "urolithiasis", label: "요로결석", type: "disease", groupId: "renal-urinary" },
  { id: "recurrent-cystitis", label: "반복성 방광염", type: "disease", groupId: "renal-urinary" },
  { id: "polyuria-polydipsia", label: "다뇨/다음", type: "symptom", groupId: "renal-urinary" },
  { id: "hematuria-dysuria", label: "혈뇨/배뇨통", type: "symptom", groupId: "renal-urinary" },

  // 소화기
  { id: "ibd", label: "IBD(염증성 장질환)", type: "disease", groupId: "gastrointestinal" },
  { id: "chronic-vomiting", label: "만성 구토", type: "disease", groupId: "gastrointestinal" },
  { id: "chronic-diarrhea", label: "만성 설사", type: "disease", groupId: "gastrointestinal" },
  { id: "pancreatitis", label: "췌장염", type: "disease", groupId: "gastrointestinal" },
  { id: "constipation", label: "변비", type: "disease", groupId: "gastrointestinal" },
  { id: "dietary-sensitivity", label: "식이 알러지/과민성", type: "disease", groupId: "gastrointestinal" },
  { id: "parasite-suspected-diarrhea", label: "기생충 의심/반복 설사", type: "symptom", groupId: "gastrointestinal" },

  // 대사/호르몬
  { id: "diabetes", label: "당뇨병", type: "disease", groupId: "metabolic-hormonal" },
  { id: "hyperthyroidism", label: "갑상선기능항진증", type: "disease", groupId: "metabolic-hormonal" },
  { id: "hypothyroidism", label: "갑상선기능저하증(드묾)", type: "disease", groupId: "metabolic-hormonal" },

  // 심혈관
  { id: "hcm", label: "HCM(비대성 심근증)", type: "disease", groupId: "cardiovascular" },
  { id: "heart-failure", label: "심부전", type: "disease", groupId: "cardiovascular" },
  { id: "thromboembolism", label: "혈전색전증", type: "disease", groupId: "cardiovascular" },
  { id: "murmur-arrhythmia", label: "심잡음/부정맥", type: "symptom", groupId: "cardiovascular" },

  // 근골격
  { id: "osteoarthritis", label: "퇴행성 관절염", type: "disease", groupId: "musculoskeletal" },
  { id: "gait-abnormality", label: "보행 이상", type: "disease", groupId: "musculoskeletal" },
  { id: "difficulty-jumping", label: "점프 어려움", type: "disease", groupId: "musculoskeletal" },
  { id: "hip-knee-issue", label: "고관절/슬관절 문제", type: "disease", groupId: "musculoskeletal" },
  { id: "chronic-pain", label: "만성 통증", type: "symptom", groupId: "musculoskeletal" },

  // 피부/알러지
  { id: "environmental-allergy", label: "환경 알러지/아토피", type: "disease", groupId: "dermatologic-allergy" },
  { id: "food-allergy", label: "식이 알러지", type: "disease", groupId: "dermatologic-allergy" },
  { id: "bacterial-dermatitis", label: "세균성 피부염", type: "disease", groupId: "dermatologic-allergy" },
  { id: "fungal-infection", label: "진균 감염", type: "disease", groupId: "dermatologic-allergy" },
  { id: "alopecia", label: "탈모", type: "disease", groupId: "dermatologic-allergy" },
  { id: "overgrooming", label: "과도한 그루밍", type: "disease", groupId: "dermatologic-allergy" },
  { id: "itching", label: "가려움", type: "symptom", groupId: "dermatologic-allergy" },

  // 구강
  { id: "gingivitis", label: "치은염", type: "disease", groupId: "oral" },
  { id: "periodontitis", label: "치주염", type: "disease", groupId: "oral" },
  { id: "forl", label: "FORL(흡수성 병변)", type: "disease", groupId: "oral" },
  { id: "halitosis", label: "구취", type: "disease", groupId: "oral" },
  { id: "chewing-pain", label: "저작 통증/한쪽 씹기", type: "disease", groupId: "oral" },

  // 호흡기
  { id: "asthma", label: "천식", type: "disease", groupId: "respiratory" },
  { id: "chronic-bronchitis", label: "만성 기관지염", type: "disease", groupId: "respiratory" },
  { id: "upper-respiratory-infection", label: "상부호흡기 감염", type: "disease", groupId: "respiratory" },
  { id: "dyspnea-tachypnea", label: "호흡곤란/빈호흡", type: "symptom", groupId: "respiratory" },

  // 신경계
  { id: "seizures", label: "발작", type: "disease", groupId: "neurologic" },
  { id: "neuro-gait-balance", label: "균형/보행 이상(신경계)", type: "disease", groupId: "neurologic" },
  { id: "cognitive-decline", label: "인지기능 저하(노령)", type: "disease", groupId: "neurologic" },
  { id: "neurologic-pain", label: "신경계 통증", type: "disease", groupId: "neurologic" },

  // 감염/면역
  { id: "fiv", label: "FIV", type: "disease", groupId: "infectious-immune" },
  { id: "felv", label: "FeLV", type: "disease", groupId: "infectious-immune" },
  { id: "chronic-inflammatory-disease", label: "만성 염증성 질환", type: "disease", groupId: "infectious-immune" },
  { id: "recurrent-infection", label: "반복 감염", type: "disease", groupId: "infectious-immune" },
  { id: "immunocompromised", label: "면역 저하 상태", type: "disease", groupId: "infectious-immune" },

  // 체중/비만
  { id: "obesity", label: "비만", type: "disease", groupId: "weight-obesity" },
  { id: "underweight", label: "저체중", type: "disease", groupId: "weight-obesity" },
  { id: "rapid-weight-change", label: "급격한 체중 변화", type: "disease", groupId: "weight-obesity" },
] as const

export type MedicalHistoryItemId = (typeof medicalHistoryItems)[number]["id"]

export type MedicalHistoryItem = {
  id: MedicalHistoryItemId
  label: string
  type: MedicalHistoryItemType
  groupId: MedicalHistoryGroupId
}

export type MedicalHistoryV2 = {
  version: typeof MEDICAL_HISTORY_VERSION
  selectedGroupIds: MedicalHistoryGroupId[]
  selectedItemIds: MedicalHistoryItemId[]
  notes?: string
}

export type LegacyMedicalCondition =
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

export type MedicalHistory = MedicalHistoryV2 | LegacyMedicalCondition[]

const medicalHistoryGroupOrder = medicalHistoryGroups.map((group) => group.id)
const medicalHistoryItemOrder = medicalHistoryItems.map((item) => item.id)

const medicalHistoryItemMap = medicalHistoryItems.reduce<Record<MedicalHistoryItemId, MedicalHistoryItem>>((acc, item) => {
  acc[item.id] = item
  return acc
}, {})

const medicalHistoryGroupMap = medicalHistoryGroups.reduce<Record<MedicalHistoryGroupId, MedicalHistoryGroup>>((acc, group) => {
  acc[group.id] = group
  return acc
}, {})

const medicalHistoryItemsByGroup = medicalHistoryGroups.reduce<Record<MedicalHistoryGroupId, MedicalHistoryItem[]>>(
  (acc, group) => {
    acc[group.id] = medicalHistoryItems.filter((item) => item.groupId === group.id)
    return acc
  },
  {} as Record<MedicalHistoryGroupId, MedicalHistoryItem[]>,
)

function sortByOrder<T extends string>(items: T[], order: T[]): T[] {
  const set = new Set(items)
  return order.filter((item) => set.has(item))
}

export function sortMedicalHistoryGroupIds(ids: MedicalHistoryGroupId[]): MedicalHistoryGroupId[] {
  return sortByOrder(ids, medicalHistoryGroupOrder)
}

export function sortMedicalHistoryItemIds(ids: MedicalHistoryItemId[]): MedicalHistoryItemId[] {
  return sortByOrder(ids, medicalHistoryItemOrder)
}

export function createEmptyMedicalHistory(): MedicalHistoryV2 {
  return {
    version: MEDICAL_HISTORY_VERSION,
    selectedGroupIds: [],
    selectedItemIds: [],
  }
}

export function isMedicalHistoryV2(value: unknown): value is MedicalHistoryV2 {
  if (!value || typeof value !== "object") return false
  const candidate = value as MedicalHistoryV2
  return (
    candidate.version === MEDICAL_HISTORY_VERSION &&
    Array.isArray(candidate.selectedGroupIds) &&
    Array.isArray(candidate.selectedItemIds)
  )
}

function normalizeIds<T extends string>(values: T[] | undefined, order: T[]): T[] {
  if (!values) return []
  return sortByOrder(Array.from(new Set(values)), order)
}

function migrateLegacyMedicalHistory(legacy: LegacyMedicalCondition[]): MedicalHistoryV2 {
  const withoutUnknown = legacy.filter((condition) => condition !== "unknown")
  const selectedGroupIds = new Set<MedicalHistoryGroupId>()
  const selectedItemIds = new Set<MedicalHistoryItemId>()

  if (withoutUnknown.includes("kidney") || withoutUnknown.includes("urinary")) {
    selectedGroupIds.add("renal-urinary")
  }
  if (withoutUnknown.includes("ckd")) {
    selectedGroupIds.add("renal-urinary")
    selectedItemIds.add("ckd")
  }
  if (withoutUnknown.includes("diabetes")) {
    selectedGroupIds.add("metabolic-hormonal")
    selectedItemIds.add("diabetes")
  }
  if (withoutUnknown.includes("thyroid")) {
    selectedGroupIds.add("metabolic-hormonal")
  }
  if (withoutUnknown.includes("dental")) {
    selectedGroupIds.add("oral")
  }
  if (withoutUnknown.includes("skin")) {
    selectedGroupIds.add("dermatologic-allergy")
  }
  if (withoutUnknown.includes("joint")) {
    selectedGroupIds.add("musculoskeletal")
  }
  if (withoutUnknown.includes("heart")) {
    selectedGroupIds.add("cardiovascular")
  }

  return {
    version: MEDICAL_HISTORY_VERSION,
    selectedGroupIds: sortMedicalHistoryGroupIds(Array.from(selectedGroupIds)),
    selectedItemIds: sortMedicalHistoryItemIds(Array.from(selectedItemIds)),
  }
}

export function normalizeMedicalHistory(input?: MedicalHistory | null): MedicalHistoryV2 | undefined {
  if (!input) return undefined
  if (Array.isArray(input)) {
    return migrateLegacyMedicalHistory(input)
  }
  if (!isMedicalHistoryV2(input)) return undefined
  return {
    version: MEDICAL_HISTORY_VERSION,
    selectedGroupIds: normalizeIds(input.selectedGroupIds, medicalHistoryGroupOrder),
    selectedItemIds: normalizeIds(input.selectedItemIds, medicalHistoryItemOrder),
    notes: input.notes?.trim() || undefined,
  }
}

export function getMedicalHistoryGroupMap(): Record<MedicalHistoryGroupId, MedicalHistoryGroup> {
  return medicalHistoryGroupMap
}

export function getMedicalHistoryItemMap(): Record<MedicalHistoryItemId, MedicalHistoryItem> {
  return medicalHistoryItemMap
}

export function getMedicalHistoryItemsByGroup(): Record<MedicalHistoryGroupId, MedicalHistoryItem[]> {
  return medicalHistoryItemsByGroup
}

export function hasMedicalHistorySelection(history: MedicalHistory | null | undefined, id: MedicalHistoryGroupId | MedicalHistoryItemId): boolean {
  const normalized = normalizeMedicalHistory(history)
  if (!normalized) return false
  if (medicalHistoryGroupOrder.includes(id as MedicalHistoryGroupId)) {
    return normalized.selectedGroupIds.includes(id as MedicalHistoryGroupId)
  }
  return normalized.selectedItemIds.includes(id as MedicalHistoryItemId)
}
