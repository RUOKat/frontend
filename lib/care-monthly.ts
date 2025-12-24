type CheckinAnswers = Record<string, string>

export type CheckinAnswerEntry = {
  date: string
  answers: CheckinAnswers
}

export type MonthlyCareRecord = {
  completedDays: string[]
  streak: number
  completionRate: number
}

type MonthlyCareMap = Record<string, MonthlyCareRecord>

const DISMISSED_KEY = "ruokat_checkin_popup_dismissed_v0"
const ANSWERS_KEY = "ruokat_checkin_answers_v0"
const MONTHLY_KEY = "ruokat_monthly_care_v0"

function canUseStorage(): boolean {
  return typeof window !== "undefined"
}

function getStorageKey(baseKey: string, catId?: string): string {
  return catId ? `${baseKey}_${catId}` : baseKey
}

function readStringValue(baseKey: string, catId?: string): string | null {
  if (!canUseStorage()) return null
  return window.localStorage.getItem(getStorageKey(baseKey, catId))
}

function readJsonValue<T>(baseKey: string, catId: string | undefined, fallback: T): T {
  if (!canUseStorage()) return fallback
  return safeParse<T>(window.localStorage.getItem(getStorageKey(baseKey, catId)), fallback)
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map((part) => Number(part))
  return new Date(year, month - 1, day)
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function getTodayISO(): string {
  return toISODate(new Date())
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

export function getCheckinPopupDismissed(catId?: string): string | null {
  return readStringValue(DISMISSED_KEY, catId)
}

export function setCheckinPopupDismissed(value: string, catId?: string): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(getStorageKey(DISMISSED_KEY, catId), value)
}

export function loadCheckinAnswers(catId?: string): CheckinAnswerEntry[] {
  return readJsonValue<CheckinAnswerEntry[]>(ANSWERS_KEY, catId, [])
}

export function appendCheckinAnswer(entry: CheckinAnswerEntry, catId?: string): void {
  if (!canUseStorage()) return
  const existing = loadCheckinAnswers(catId)
  existing.push(entry)
  window.localStorage.setItem(getStorageKey(ANSWERS_KEY, catId), JSON.stringify(existing))
}

export function loadMonthlyCare(catId?: string): MonthlyCareMap {
  return readJsonValue<MonthlyCareMap>(MONTHLY_KEY, catId, {})
}

export function saveMonthlyCare(map: MonthlyCareMap, catId?: string): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(getStorageKey(MONTHLY_KEY, catId), JSON.stringify(map))
}

export function migrateCareMonthlyToCat(catId: string): void {
  if (!canUseStorage()) return
  const keys = [DISMISSED_KEY, ANSWERS_KEY, MONTHLY_KEY]
  keys.forEach((baseKey) => {
    const catKey = getStorageKey(baseKey, catId)
    if (window.localStorage.getItem(catKey) !== null) return
    const legacy = window.localStorage.getItem(baseKey)
    if (legacy === null) return
    window.localStorage.setItem(catKey, legacy)
  })
}

export function getMonthlyCareForDate(date: Date = new Date(), catId?: string): MonthlyCareRecord {
  const map = loadMonthlyCare(catId)
  const monthKey = getMonthKey(date)
  return map[monthKey] ?? {
    completedDays: [],
    streak: 0,
    completionRate: 0,
  }
}

function normalizeDays(days: string[]): string[] {
  return Array.from(new Set(days)).sort()
}

function calculateStreak(completedDays: string[], dateISO: string): number {
  const daySet = new Set(completedDays)
  let streak = 0
  let cursor = parseISODate(dateISO)

  while (daySet.has(toISODate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function calculateCompletionRate(completedCount: number, dateISO: string): number {
  const elapsedDays = parseISODate(dateISO).getDate()
  if (elapsedDays <= 0) return 0
  const rate = completedCount / elapsedDays
  return Math.min(1, Number(rate.toFixed(2)))
}

export function updateMonthlyCare(dateISO: string, catId?: string): MonthlyCareRecord {
  const map = loadMonthlyCare(catId)
  const monthKey = getMonthKey(parseISODate(dateISO))
  const existing = map[monthKey] ?? { completedDays: [], streak: 0, completionRate: 0 }

  const completedDays = normalizeDays([...existing.completedDays, dateISO])
  const streak = calculateStreak(completedDays, dateISO)
  const completionRate = calculateCompletionRate(completedDays.length, dateISO)

  const updated = {
    completedDays,
    streak,
    completionRate,
  }

  map[monthKey] = updated
  saveMonthlyCare(map, catId)

  return updated
}
