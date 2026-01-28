"use client"

import { backendFetch } from "./backend"

export interface MedicalProvider {
  id: string
  userId?: string
  type: string // "hospital", "clinic", "doctor"
  name: string
  address?: string
  phone?: string
  specialty?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMedicalProviderData {
  type: string
  name: string
  address?: string
  phone?: string
  specialty?: string
  notes?: string
}

export interface UpdateMedicalProviderData {
  type?: string
  name?: string
  address?: string
  phone?: string
  specialty?: string
  notes?: string
}

// 인증 없이 직접 fetch 호출
async function fetchWithoutAuth<T>(url: string, options?: RequestInit): Promise<T | null> {
  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://192.168.0.140:3001/api"

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Handle wrapped response
    if (data.success && data.data) {
      return data.data as T
    }

    return data as T
  } catch (error) {
    console.error("API 호출 실패:", error)
    return null
  }
}

/**
 * 기관/의사 목록 조회
 */
export async function getMedicalProviders(): Promise<MedicalProvider[]> {
  try {
    const data = await fetchWithoutAuth<MedicalProvider[]>("/medical-providers")
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("기관/의사 목록 조회 실패:", error)
    return []
  }
}

/**
 * 기관/의사 상세 조회
 */
export async function getMedicalProvider(id: string): Promise<MedicalProvider | null> {
  try {
    return await fetchWithoutAuth<MedicalProvider>(`/medical-providers/${id}`)
  } catch (error) {
    console.error("기관/의사 상세 조회 실패:", error)
    return null
  }
}

/**
 * 기관/의사 등록
 */
export async function createMedicalProvider(data: CreateMedicalProviderData): Promise<MedicalProvider | null> {
  try {
    return await fetchWithoutAuth<MedicalProvider>("/medical-providers", {
      method: "POST",
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error("기관/의사 등록 실패:", error)
    return null
  }
}

/**
 * 기관/의사 수정
 */
export async function updateMedicalProvider(
  id: string,
  data: UpdateMedicalProviderData
): Promise<MedicalProvider | null> {
  try {
    return await fetchWithoutAuth<MedicalProvider>(`/medical-providers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error("기관/의사 수정 실패:", error)
    return null
  }
}

/**
 * 기관/의사 삭제
 */
export async function deleteMedicalProvider(id: string): Promise<boolean> {
  try {
    await fetchWithoutAuth(`/medical-providers/${id}`, {
      method: "DELETE",
    })
    console.log("✅ 기관/의사 삭제 완료")
    return true
  } catch (error) {
    console.error("기관/의사 삭제 실패:", error)
    return false
  }
}
