import type React from "react"
import type { Metadata, Viewport } from "next"
import { Noto_Sans_KR } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SplashGate } from "@/components/app/splash-gate"
import { AuthProvider } from "@/contexts/auth-context"
import { CatProfileProvider } from "@/contexts/cat-profile-context"
import { OnboardingProvider } from "@/contexts/onboarding-context"
import "./globals.css"

const notoSansKR = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Are You Okat? - 고양이 건강 기록",
  description: "오늘도 괜찮은지, 기록으로 먼저 알아봐요.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.className} antialiased`}>
        <AuthProvider>
          <CatProfileProvider>
            <OnboardingProvider>
              <SplashGate>{children}</SplashGate>
            </OnboardingProvider>
          </CatProfileProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
