"use client"

import { backendFetch } from "./backend"

export interface UpdateUserProfileData {
  name?: string
  nickname?: string
  phone?: string
  address?: string
  profilePhoto?: string
  alarmsEnabled?: boolean
  alarmConfig?: any
  cameraEnabled?: boolean
}

export interface UserProfile {
  id: string
  cognitoSub: string
  email?: string
  name?: string
  nickname?: string
  phone?: string
  address?: string
  profilePhoto?: string
  alarmsEnabled?: boolean
  alarmConfig?: any
  cameraEnabled?: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 현재 사용자 프로필 조회
 */
export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    const response = await backendFetch<any>("/users/me", {
      method: "GET",
    })

    if (!response) return null

    // Handle wrapped response
    if (response.success && response.data) {
      return response.data as UserProfile
    }

    return response as UserProfile
  } catch (error) {
    console.error("프로필 조회 실패:", error)
    return null
  }
}

/**
 * 현재 사용자 프로필 업데이트
 */
export async function updateMyProfile(data: UpdateUserProfileData): Promise<UserProfile | null> {
  try {
    const response = await backendFetch<any>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    })

    if (!response) return null

    // Handle wrapped response
    if (response.success && response.data) {
      return response.data as UserProfile
    }

    return response as UserProfile
  } catch (error) {
    console.error("프로필 업데이트 실패:", error)
    return null
  }
}

/**
 * 푸시 토큰 업데이트
 */
export async function updatePushToken(
  pushToken: string,
  deviceInfo?: object
): Promise<boolean> {
  try {
    await backendFetch("/users/me/push-token", {
      method: "PUT",
      body: JSON.stringify({ pushToken, deviceInfo }),
    })
    console.log("✅ 푸시 토큰 업데이트 완료")
    return true
  } catch (error) {
    console.error("푸시 토큰 업데이트 실패:", error)
    return false
  }
}

/**
 * 카메라 설정 조회
 */
export async function getCameraSettings(): Promise<{ cameraEnabled: boolean } | null> {
  try {
    const response = await backendFetch<any>("/users/me/camera-settings", {
      method: "GET",
    })

    if (!response) return null

    // Handle wrapped response
    if (response.success && response.data) {
      return response.data
    }

    return response
  } catch (error) {
    console.error("카메라 설정 조회 실패:", error)
    return null
  }
}

/**
 * 카메라 설정 업데이트
 */
export async function updateCameraSettings(cameraEnabled: boolean): Promise<boolean> {
  try {
    await backendFetch("/users/me/camera-settings", {
      method: "PUT",
      body: JSON.stringify({ cameraEnabled }),
    })
    console.log("✅ 카메라 설정 업데이트 완료")
    return true
  } catch (error) {
    console.error("카메라 설정 업데이트 실패:", error)
    return false
  }
}
