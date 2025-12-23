"use client"

import Image from "next/image"

export function SplashScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-secondary/80 blur-3xl" />
        <div className="absolute left-1/2 top-16 h-28 w-28 -translate-x-1/2 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="animate-in fade-in zoom-in duration-700">
          <div className="rounded-[28px] bg-white/80 p-5 shadow-2xl ring-1 ring-white/70 backdrop-blur-sm">
            <Image
              src="/logo.jpg"
              alt="Are You Okat logo"
              width={260}
              height={220}
              priority
              className="h-auto w-[220px] sm:w-[260px]"
            />
          </div>
        </div>

        <div className="mt-6 h-1 w-14 rounded-full bg-primary/70 animate-pulse" />
      </div>
    </div>
  )
}
