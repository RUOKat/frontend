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
  const url = buildUrl(path)

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }
  if (idToken) {
    headers.set("x-id-token", idToken)
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    })
  } catch (networkError) {
    const message = networkError instanceof Error ? networkError.message : String(networkError)
    console.error(`[API] Network error: ${url} - ${message}`)
    throw networkError
  }

  if (response.status === 304 && allowNotModified) {
    return null
  }

  const { data, text } = await parseResponse<T>(response)
  if (!response.ok) {
    const bodyStr = text ?? (data ? JSON.stringify(data) : "(empty)")
    console.error(`[API] ${response.status} ${response.statusText} - ${url}`)
    console.error(`[API] Response body: ${bodyStr}`)

    const error: BackendError = new Error(`${response.status} ${response.statusText || "Backend request failed"}: ${url}`)
    error.status = response.status
    error.body = data ?? text
    throw error
  }

  return data as T
}
