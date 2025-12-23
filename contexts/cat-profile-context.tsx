"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { CatProfile } from "@/lib/types"
import { loadCatProfile, saveCatProfile as storageSaveCatProfile } from "@/lib/onboarding"

interface CatProfileContextType {
  catProfile: CatProfile | null
  setCatProfile: (profile: CatProfile) => void
  isLoading: boolean
}

const CatProfileContext = createContext<CatProfileContextType | undefined>(undefined)

export function CatProfileProvider({ children }: { children: ReactNode }) {
  const [catProfile, setCatProfileState] = useState<CatProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = loadCatProfile()
    if (saved) {
      setCatProfileState(saved)
    }
    setIsLoading(false)
  }, [])

  const setCatProfile = (profile: CatProfile) => {
    setCatProfileState(profile)
    storageSaveCatProfile(profile)
  }

  return (
    <CatProfileContext.Provider value={{ catProfile, setCatProfile, isLoading }}>{children}</CatProfileContext.Provider>
  )
}

export function useCatProfile() {
  const context = useContext(CatProfileContext)
  if (context === undefined) {
    throw new Error("useCatProfile must be used within a CatProfileProvider")
  }
  return context
}
