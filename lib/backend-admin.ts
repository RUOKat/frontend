"use client"

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://192.168.0.140:3001/api"

// 인증 없이 직접 fetch 호출
async function fetchWithoutAuth<T>(url: string, options?: RequestInit): Promise<T | null> {
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

export interface AdminPet {
  id: string
  name: string
  breed: string
  gender: string
  weight: number
  birthDate?: string
  createdAt: string
  user: {
    id: string
    name?: string
    email?: string
  }
}

export interface AdminCareLog {
  id: string
  petId: string
  date: string
  type: string
  answers?: any
  diagAnswers?: any
  createdAt: string
  pet: {
    id: string
    name: string
    user: {
      id: string
      name?: string
      email?: string
    }
  }
}

/**
 * 전체 고양이 목록 조회
 */
export async function getAllPets(): Promise<AdminPet[]> {
  try {
    const data = await fetchWithoutAuth<AdminPet[]>("/admin/pets")
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("전체 고양이 목록 조회 실패:", error)
    return []
  }
}

/**
 * 고양이 상세 조회
 */
export async function getPetDetail(id: string): Promise<AdminPet | null> {
  try {
    return await fetchWithoutAuth<AdminPet>(`/admin/pets/${id}`)
  } catch (error) {
    console.error("고양이 상세 조회 실패:", error)
    return null
  }
}

/**
 * 전체 케어 로그 조회
 */
export async function getAllCareLogs(): Promise<AdminCareLog[]> {
  try {
    const data = await fetchWithoutAuth<AdminCareLog[]>("/admin/care/logs")
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("전체 케어 로그 조회 실패:", error)
    return []
  }
}

/**
 * 특정 고양이의 케어 로그 조회
 */
export async function getCareLogsByPet(petId: string): Promise<AdminCareLog[]> {
  try {
    const data = await fetchWithoutAuth<AdminCareLog[]>(`/admin/care/logs/${petId}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("고양이별 케어 로그 조회 실패:", error)
    return []
  }
}
