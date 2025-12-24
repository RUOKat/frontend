"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Activity, User } from "lucide-react"
import { useOnboarding } from "@/contexts/onboarding-context"

interface AppShellProps {
  children: ReactNode
}

const navItems = [
  { href: "/", icon: Home, label: "홈" },
  {
    href: "/monitoring",
    icon: Activity,
    label: "Are You Okat?",
    shortLabel: "Okat",
    ariaLabel: "Are You Okat?",
    watermark: true,
  },
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
      <main className="flex-1 pb-16">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            const fullLabel = item.label
            const shortLabel = item.shortLabel ?? item.label
            const ariaLabel = item.ariaLabel ?? item.label

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={ariaLabel}
                title={ariaLabel}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span className="relative text-[10px] font-medium leading-none">
                  <span className={cn("relative inline-flex items-center justify-center", item.watermark && "px-2")}>
                    {item.watermark && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-center bg-no-repeat opacity-10"
                        style={{ backgroundImage: "url('/logo.jpg')", backgroundSize: "contain" }}
                      />
                    )}
                    <span className="relative">
                      <span className="hidden sm:inline">{fullLabel}</span>
                      <span className="sm:hidden">{shortLabel}</span>
                    </span>
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
