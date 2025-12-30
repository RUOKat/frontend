"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { CatProfile } from "@/lib/types"
import {
  loadActiveCatId,
  loadCatProfile,
  loadCats,
  migrateLegacyCatData,
  saveActiveCatId,
  saveCats,
} from "@/lib/storage"
import { migrateCareMonthlyToCat } from "@/lib/care-monthly"
import { normalizeMedicalHistory } from "@/lib/medical-history"

interface ActiveCatContextType {
  cats: CatProfile[]
  activeCatId: string | null
  activeCat: CatProfile | null
  setActiveCatId: (id: string) => void
  addCat: (profile: CatProfile) => void
  updateCat: (profile: CatProfile) => void
  isLoading: boolean
}

const ActiveCatContext = createContext<ActiveCatContextType | undefined>(undefined)

function createCatId(): string {
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined
  const uuid = (cryptoObj as Crypto & { randomUUID?: () => string })?.randomUUID?.()
  if (uuid) return uuid
  return `cat-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function ensureCatId(profile: CatProfile): CatProfile {
  if (profile.id) return profile
  return { ...profile, id: createCatId() }
}

function normalizeCats(cats: CatProfile[]): { cats: CatProfile[]; didUpdate: boolean } {
  let didUpdate = false
  const normalizedCats = cats.map((cat) => {
    let nextCat = cat
    if (!cat.id) {
      nextCat = { ...nextCat, id: createCatId() }
      didUpdate = true
    }
    const normalizedHistory = normalizeMedicalHistory(cat.medicalHistory)
    const historyChanged =
      JSON.stringify(normalizedHistory ?? null) !== JSON.stringify(cat.medicalHistory ?? null)
    if (historyChanged) {
      nextCat = { ...nextCat, medicalHistory: normalizedHistory }
      didUpdate = true
    }
    return nextCat
  })
  return { cats: normalizedCats, didUpdate }
}

export function ActiveCatProvider({ children }: { children: ReactNode }) {
  const [cats, setCatsState] = useState<CatProfile[]>([])
  const [activeCatId, setActiveCatIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedCats = loadCats<CatProfile>()
    const storedActiveId = loadActiveCatId()

    if (storedCats.length === 0) {
      const legacyProfile = loadCatProfile<CatProfile>()
      if (legacyProfile) {
        const normalizedProfile = {
          ...legacyProfile,
          medicalHistory: normalizeMedicalHistory(legacyProfile.medicalHistory),
        }
        const normalized = ensureCatId(normalizedProfile)
        const nextCats = [normalized]
        saveCats(nextCats)
        setCatsState(nextCats)
        const nextActiveId = storedActiveId ?? normalized.id ?? createCatId()
        saveActiveCatId(nextActiveId)
        setActiveCatIdState(nextActiveId)
        migrateLegacyCatData(normalized.id ?? nextActiveId)
        migrateCareMonthlyToCat(normalized.id ?? nextActiveId)
        setIsLoading(false)
        return
      }
    }

    const { cats: normalizedCats, didUpdate } = normalizeCats(storedCats)
    if (didUpdate) {
      saveCats(normalizedCats)
    }

    setCatsState(normalizedCats)
    setActiveCatIdState(storedActiveId)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (cats.length === 0) return
    if (activeCatId && cats.some((cat) => cat.id === activeCatId)) return
    const fallbackId = cats[0].id ?? createCatId()
    if (!cats[0].id) {
      const updatedCats = [{ ...cats[0], id: fallbackId }, ...cats.slice(1)]
      setCatsState(updatedCats)
      saveCats(updatedCats)
    }
    saveActiveCatId(fallbackId)
    setActiveCatIdState(fallbackId)
  }, [activeCatId, cats, isLoading])

  const setActiveCatId = (id: string) => {
    setActiveCatIdState(id)
    saveActiveCatId(id)
  }

  const addCat = (profile: CatProfile) => {
    const normalized = ensureCatId(profile)
    setCatsState((prev) => {
      const filtered = prev.filter((cat) => cat.id !== normalized.id)
      const next = [normalized, ...filtered]
      saveCats(next)
      return next
    })
    setActiveCatId(normalized.id)
  }

  const updateCat = (profile: CatProfile) => {
    const normalized = ensureCatId(profile)
    setCatsState((prev) => {
      const exists = prev.some((cat) => cat.id === normalized.id)
      const next = exists
        ? prev.map((cat) => (cat.id === normalized.id ? { ...cat, ...normalized } : cat))
        : [normalized, ...prev]
      saveCats(next)
      return next
    })
    if (!activeCatId || activeCatId === normalized.id) {
      setActiveCatId(normalized.id)
    }
  }

  const activeCat = useMemo(() => {
    if (!activeCatId) return cats[0] ?? null
    return cats.find((cat) => cat.id === activeCatId) ?? cats[0] ?? null
  }, [cats, activeCatId])

  return (
    <ActiveCatContext.Provider
      value={{
        cats,
        activeCatId,
        activeCat,
        setActiveCatId,
        addCat,
        updateCat,
        isLoading,
      }}
    >
      {children}
    </ActiveCatContext.Provider>
  )
}

export function useActiveCat() {
  const context = useContext(ActiveCatContext)
  if (context === undefined) {
    throw new Error("useActiveCat must be used within an ActiveCatProvider")
  }
  return context
}
