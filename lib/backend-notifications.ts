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
  // 로컬에서 생성된 가상 알림(일정, 생일 등)은 서버로 요청을 보내지 않음
  if (id.startsWith("rem-")) {
    return {
      id,
      userId: "local",
      title: "",
      body: "",
      type: "system",
      isRead: true,
      createdAt: new Date().toISOString()
    }
  }

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
 * 알림 안읽음 처리 (토글용)
 */
export async function markNotificationAsUnread(id: string): Promise<Notification | null> {
  // 로컬 가상 알림 방어
  if (id.startsWith("rem-")) {
    return {
      id,
      userId: "local",
      title: "",
      body: "",
      type: "system",
      isRead: false,
      createdAt: new Date().toISOString()
    }
  }

  try {
    const result = await backendFetch<Notification>(`/notifications/${id}/unread`, {
      method: "PATCH",
    })
    return result
  } catch (error) {
    console.error("알림 안읽음 처리 실패:", error)
    // 에러 발생하더라도 프론트엔드에서는 긍정적인 업데이트를 위해 임시 객체 반환
    return { id, userId: "", title: "", body: "", type: "", isRead: false, createdAt: "" }
  }
}

/**
 * 알림 삭제
 */
export async function deleteNotification(id: string): Promise<boolean> {
  // 로컬에서 생성된 가상 알림은 서버로 요청을 보내지 않음
  if (id.startsWith("rem-")) {
    return true
  }

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
