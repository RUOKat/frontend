import type React from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AppShell } from "@/components/app/app-shell"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}
