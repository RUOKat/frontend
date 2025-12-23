"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { clearAllData } from "@/lib/storage"
import { Loader2 } from "lucide-react"

export default function SignOutPage() {
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    // 로그아웃 처리
    logout()
    clearAllData()

    router.replace("/")
  }, [logout, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">로그아웃 중...</p>
    </div>
  )
}
