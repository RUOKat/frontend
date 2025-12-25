"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Cat, Home, User, type LucideIcon } from "lucide-react"
import { useOnboarding } from "@/contexts/onboarding-context"

interface AppShellProps {
  children: ReactNode
}

type NavItem = {
  href: string
  icon: LucideIcon
  label: string
  matchPrefixes?: string[]
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/okat", icon: Cat, label: "Are You Okat?", matchPrefixes: ["/okat", "/reports"] },
  { href: "/settings", icon: User, label: "프로필" },
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { onboardingCompleted, isLoading } = useOnboarding()

  // Hide shell on auth/onboarding pages
  const isAuthOrOnboarding = pathname.startsWith("/auth") || pathname.startsWith("/onboarding")

  // Render without shell until onboarding is complete
  if (isLoading || !onboardingCompleted || isAuthOrOnboarding) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center h-16 px-4">
          {navItems.map((item) => {
            const isActive = item.matchPrefixes
              ? item.matchPrefixes.some((prefix) => pathname.startsWith(prefix))
              : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            const isOkat = item.href === "/okat"
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-colors",
                  isOkat && "flex-[1.2] gap-1",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn("w-5 h-5", isOkat && "w-6 h-6", isActive && "stroke-[2.5]")}
                />
                <span className={cn("text-[10px] font-medium leading-none", isOkat && "text-[11px]")}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
