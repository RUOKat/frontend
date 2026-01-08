"use client"

import { backendFetch } from "@/lib/backend"
import type { User } from "@/lib/types"

type BackendMeResponse = {
  success: boolean
  data?: {
    id?: string
    sub?: string
    email?: string
    name?: string
    [key: string]: unknown
  }
}

type MeResponse = User | { user: User } | BackendMeResponse

export async function getMe(): Promise<MeResponse | null> {
  try {
    return await backendFetch<MeResponse>("/auth/me", {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      allowNotModified: true,
    })
  } catch (error) {
    if (error instanceof TypeError) {
      return null
    }
    throw error
  }
}
