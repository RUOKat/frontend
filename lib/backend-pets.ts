"use client"

import { backendFetch } from "./backend"
import type { CatProfile } from "./types"

/**
 * 백엔드 전송 전 불필요한 필드 제거
 * - 백엔드 응답 필드 (success, data, error, createdAt, updatedAt, deletedAt, userId)
 * - 빈 문자열을 undefined로 변환
 */
function cleanProfileForBackend(profile: CatProfile): Partial<CatProfile> {
  const {
    // 백엔드 응답 전용 필드 제거
    success,
    data,
    error,
    createdAt,
    updatedAt,
    deletedAt,
    userId,
    // 나머지 필드
    ...cleanProfile
  } = profile as CatProfile & {
    success?: boolean
    data?: unknown
    error?: unknown
    createdAt?: string
    updatedAt?: string
    deletedAt?: string | null
    userId?: string
  }

  // 빈 문자열을 undefined로 변환 (enum 필드 validation 에러 방지)
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(cleanProfile)) {
    if (value === "") {
      result[key] = undefined
    } else {
      result[key] = value
    }
  }

  return result as Partial<CatProfile>
}

/**
 * 백엔드 응답에서 실제 데이터 추출
 * 응답이 { data: {...} } 형태일 수 있음
 */
function extractDataFromResponse<T>(response: T | { data: T }): T {
  if (response && typeof response === "object" && "data" in response && response.data) {
    return response.data as T
  }
  return response as T
}

/**
 * 백엔드에서 내 모든 펫 프로필 조회
 */
export async function fetchMyPets(): Promise<CatProfile[]> {
  try {
    const result = await backendFetch<CatProfile[] | { data: CatProfile[] }>("/pets")
    const pets = extractDataFromResponse(result)
    return pets ?? []
  } catch (error) {
    console.error("펫 목록 조회 실패:", error)
    return []
  }
}

/**
 * 백엔드에 새 펫 프로필 생성
 */
export async function createPet(profile: CatProfile): Promise<CatProfile | null> {
  try {
    // id 제거 및 불필요한 필드 정리
    const cleanedProfile = cleanProfileForBackend(profile)
    const { id, ...profileWithoutId } = cleanedProfile

    const result = await backendFetch<CatProfile | { data: CatProfile }>("/pets", {
      method: "POST",
      body: JSON.stringify(profileWithoutId),
    })
    return extractDataFromResponse(result)
  } catch (error) {
    console.error("펫 생성 실패:", error)
    return null
  }
}

/**
 * 백엔드에 펫 프로필 업데이트
 * 404 에러 시 createPet으로 폴백
 */
export async function updatePet(profile: CatProfile): Promise<CatProfile | null> {
  if (!profile.id) {
    console.error("펫 업데이트 실패: id가 없습니다")
    return null
  }

  try {
    // 불필요한 필드 정리
    const cleanedProfile = cleanProfileForBackend(profile)

    const result = await backendFetch<CatProfile | { data: CatProfile }>(`/pets/${profile.id}`, {
      method: "PUT",
      body: JSON.stringify(cleanedProfile),
    })
    return extractDataFromResponse(result)
  } catch (error: unknown) {
    // 404 에러인 경우 createPet으로 폴백
    const errorObj = error as { status?: number; message?: string }
    if (errorObj?.status === 404 || errorObj?.message?.includes("404") || errorObj?.message?.includes("Not Found")) {
      console.log("펫이 백엔드에 없음, 새로 생성합니다:", profile.id)
      return createPet(profile)
    }
    console.error("펫 업데이트 실패:", error)
    return null
  }
}

/**
 * 백엔드에서 펫 프로필 삭제
 */
export async function deletePet(petId: string): Promise<boolean> {
  try {
    await backendFetch(`/pets/${petId}`, {
      method: "DELETE",
    })
    return true
  } catch (error) {
    console.error("펫 삭제 실패:", error)
    return false
  }
}

/**
 * 로컬 프로필을 백엔드와 동기화
 * - 백엔드에 없는 로컬 프로필은 생성
 * - 백엔드에 있는 프로필은 업데이트
 */
export async function syncPetsWithBackend(localCats: CatProfile[]): Promise<CatProfile[]> {
  try {
    // 백엔드에서 기존 펫 목록 조회
    const remoteCats = await fetchMyPets()
    const remoteIds = new Set(remoteCats.map(cat => cat.id))

    const syncedCats: CatProfile[] = []

    for (const localCat of localCats) {
      if (localCat.id && remoteIds.has(localCat.id)) {
        // 백엔드에 이미 존재 → 업데이트
        const updated = await updatePet(localCat)
        if (updated) {
          syncedCats.push(updated)
        } else {
          syncedCats.push(localCat)
        }
      } else {
        // 백엔드에 없음 → 생성
        const created = await createPet(localCat)
        if (created) {
          syncedCats.push(created)
        } else {
          syncedCats.push(localCat)
        }
      }
    }

    // 백엔드에만 있는 펫도 포함 (다른 기기에서 생성된 경우)
    for (const remoteCat of remoteCats) {
      const existsLocally = syncedCats.some(cat => cat.id === remoteCat.id)
      if (!existsLocally) {
        syncedCats.push(remoteCat)
      }
    }

    return syncedCats
  } catch (error) {
    console.error("펫 동기화 실패:", error)
    return localCats
  }
}
