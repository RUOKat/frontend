"use client"

import { backendFetch } from "./backend"

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
}

/**
 * 내 알림 목록 조회 (최근 7일)
 */
export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const result = await backendFetch<Notification[] | { data: Notification[] }>("/notifications")
    // 응답이 { data: [...] } 형태일 수 있음
    if (result && typeof result === "object" && "data" in result && Array.isArray(result.data)) {
      return result.data
    }
    if (Array.isArray(result)) {
      return result
    }
    return []
  } catch (error) {
    console.error("알림 목록 조회 실패:", error)
    return []
  }
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(id: string): Promise<Notification | null> {
  try {
    const result = await backendFetch<Notification>(`/notifications/${id}/read`, {
      method: "PATCH",
    })
    return result
  } catch (error) {
    console.error("알림 읽음 처리 실패:", error)
    return null
  }
}

/**
 * 알림 삭제
 */
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    await backendFetch(`/notifications/${id}`, {
      method: "DELETE",
    })
    return true
  } catch (error) {
    console.error("알림 삭제 실패:", error)
    return false
  }
}
