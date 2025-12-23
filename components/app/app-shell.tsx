"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, PenSquare, Activity, Clock, Settings } from "lucide-react"
import { useOnboarding } from "@/contexts/onboarding-context"

interface AppShellProps {
  children: ReactNode
}

const navItems = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/record", icon: PenSquare, label: "기록" },
  { href: "/monitoring", icon: Activity, label: "모니터링" },
  { href: "/history", icon: Clock, label: "히스토리" },
  { href: "/settings", icon: Settings, label: "설정" },
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { onboardingCompleted, isLoading } = useOnboarding()

  // 온보딩/인증 페이지에서는 쉘 숨김
  const isAuthOrOnboarding = pathname.startsWith("/auth") || pathname.startsWith("/onboarding")

  // 온보딩 완료 전이거나 인증/온보딩 페이지면 쉘 없이 렌더링
  if (isLoading || !onboardingCompleted || isAuthOrOnboarding) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-16">{children}</main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
