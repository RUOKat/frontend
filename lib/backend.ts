"use client"

export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://192.168.0.140:3001/api"

type BackendTokens = {
  accessToken: string | null
  idToken: string | null
}

export function getTokens(): BackendTokens {
  if (typeof window === "undefined") {
    return { accessToken: null, idToken: null }
  }
  return {
    accessToken: sessionStorage.getItem("access_token"),
    idToken: sessionStorage.getItem("id_token"),
  }
}

type BackendError = Error & { status?: number; body?: unknown }
type BackendFetchOptions = RequestInit & { allowNotModified?: boolean }
type ParsedResponse<T> = { data: T | null; text: string | null }

async function parseResponse<T>(response: Response): Promise<ParsedResponse<T>> {
  const contentType = response.headers.get("content-type") ?? ""
  let text: string | null = null
  try {
    text = await response.text()
  } catch {
    text = null
  }

  if (!text) {
    return { data: null, text: null }
  }

  if (contentType.includes("application/json")) {
    try {
      return { data: JSON.parse(text) as T, text }
    } catch {
      return { data: null, text }
    }
  }

  return { data: text as unknown as T, text }
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  if (!path.startsWith("/")) {
    return `${BASE_URL}/${path}`
  }
  return `${BASE_URL}${path}`
}

export async function backendFetch<T = unknown>(path: string, options: BackendFetchOptions = {}): Promise<T | null> {
  const { accessToken, idToken } = getTokens()
  const { allowNotModified, ...fetchOptions } = options
  const headers = new Headers(options.headers ?? {})

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }
  if (idToken) {
    headers.set("x-id-token", idToken)
  }

  const response = await fetch(buildUrl(path), {
    ...fetchOptions,
    headers,
  })

  if (response.status === 304 && allowNotModified) {
    return null
  }

  const { data, text } = await parseResponse<T>(response)
  if (!response.ok) {
    const body = text ?? (data ? JSON.stringify(data) : null)
    if (body) {
      console.error("Backend request failed", { url: response.url, status: response.status, body })
    } else {
      console.error("Backend request failed", { url: response.url, status: response.status })
    }
    const error: BackendError = new Error(response.statusText || "Backend request failed")
    error.status = response.status
    error.body = data ?? text
    throw error
  }

  return data as T
}
