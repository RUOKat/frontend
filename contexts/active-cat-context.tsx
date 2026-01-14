"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react"
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
import { fetchMyPets, createPet, updatePet } from "@/lib/backend-pets"
import { getTokens } from "@/lib/backend"

interface ActiveCatContextType {
  cats: CatProfile[]
  activeCatId: string | null
  activeCat: CatProfile | null
  setActiveCatId: (id: string) => void
  addCat: (profile: CatProfile) => void
  updateCat: (profile: CatProfile, skipBackendSync?: boolean) => void
  syncWithBackend: () => Promise<void>
  isLoading: boolean
  isSyncing: boolean
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
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const initializeCats = async () => {
      const storedCats = loadCats<CatProfile>()
      const storedActiveId = loadActiveCatId()

      // 레거시 데이터 마이그레이션
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

      // 로그인 상태면 백엔드에서 먼저 가져오기
      const { accessToken } = getTokens()
      if (accessToken) {
        try {
          console.log("🔄 백엔드에서 펫 목록 로딩 중...")
          const remoteCats = await fetchMyPets()
          if (remoteCats.length > 0) {
            // 백엔드 데이터는 이미 최신이므로 didUpdate 무시
            const { cats: normalized } = normalizeCats(remoteCats)
            setCatsState(normalized)
            // 로컬 스토리지에만 저장 (백엔드 업데이트 불필요)
            saveCats(normalized)
            setActiveCatIdState(storedActiveId ?? normalized[0]?.id ?? null)
            console.log("✅ 백엔드에서 펫 목록 로드:", normalized.length)
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error("백엔드 펫 목록 로드 실패:", error)
        }
      }

      // 백엔드에 없거나 로그인 안 된 경우 로컬 데이터 사용
      setCatsState(normalizedCats)
      setActiveCatIdState(storedActiveId)
      setIsLoading(false)
    }

    initializeCats()
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

  // 백엔드와 동기화
  const syncWithBackend = useCallback(async () => {
    const { accessToken } = getTokens()
    if (!accessToken) {
      console.log("토큰 없음 - 백엔드 동기화 스킵")
      return
    }

    setIsSyncing(true)
    try {
      const remoteCats = await fetchMyPets()
      if (remoteCats.length > 0) {
        const { cats: normalizedCats } = normalizeCats(remoteCats)
        setCatsState(normalizedCats)
        saveCats(normalizedCats)
        console.log("✅ 백엔드에서 펫 목록 동기화 완료:", normalizedCats.length)
      }
    } catch (error) {
      console.error("백엔드 동기화 실패:", error)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const addCat = useCallback(async (profile: CatProfile) => {
    const normalized = ensureCatId(profile)
    
    // 로컬 저장
    setCatsState((prev) => {
      const filtered = prev.filter((cat) => cat.id !== normalized.id)
      const next = [normalized, ...filtered]
      saveCats(next)
      return next
    })
    if (normalized.id) {
      setActiveCatId(normalized.id)
    }

    // 백엔드에 생성
    const { accessToken } = getTokens()
    if (accessToken) {
      try {
        const created = await createPet(normalized)
        if (created) {
          // 백엔드에서 생성된 ID로 업데이트
          setCatsState((prev) => {
            const next = prev.map((cat) => 
              cat.id === normalized.id ? { ...cat, ...created } : cat
            )
            saveCats(next)
            return next
          })
          if (created.id) {
            setActiveCatId(created.id)
          }
          console.log("✅ 백엔드에 펫 생성 완료:", created.id)
        }
      } catch (error) {
        console.error("백엔드 펫 생성 실패:", error)
      }
    }
  }, [])

  const updateCat = useCallback(async (profile: CatProfile, skipBackendSync = false) => {
    const normalized = ensureCatId(profile)
    
    // 로컬 저장
    setCatsState((prev) => {
      const exists = prev.some((cat) => cat.id === normalized.id)
      const next = exists
        ? prev.map((cat) => (cat.id === normalized.id ? { ...cat, ...normalized } : cat))
        : [normalized, ...prev]
      saveCats(next)
      return next
    })
    if (normalized.id && (!activeCatId || activeCatId === normalized.id)) {
      setActiveCatId(normalized.id)
    }

    // 백엔드에 업데이트 (skipBackendSync가 false일 때만)
    if (!skipBackendSync) {
      const { accessToken } = getTokens()
      if (accessToken && normalized.id) {
        try {
          await updatePet(normalized)
          console.log("✅ 백엔드에 펫 업데이트 완료:", normalized.id)
        } catch (error) {
          console.error("백엔드 펫 업데이트 실패:", error)
        }
      }
    }
  }, [activeCatId])

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
        syncWithBackend,
        isLoading,
        isSyncing,
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
