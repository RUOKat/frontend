"use client"

import { useEffect, useState, type ReactNode } from "react"
import { SplashScreen } from "@/components/app/splash-screen"

interface SplashGateProps {
  children: ReactNode
}

export function SplashGate({ children }: SplashGateProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!ready) {
    return <SplashScreen />
  }

  return <>{children}</>
}
