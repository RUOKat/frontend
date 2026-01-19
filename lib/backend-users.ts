"use client"

import { backendFetch } from "./backend"

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
