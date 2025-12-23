// Cognito 환경변수
export const cognitoConfig = {
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "",
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
  redirectSignIn: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN || "",
  redirectSignOut: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT || "",
  scopes: process.env.NEXT_PUBLIC_COGNITO_SCOPES || "openid email profile",
}

// Cognito가 설정되어 있는지 확인
export function isCognitoConfigured(): boolean {
  return !!(cognitoConfig.domain && cognitoConfig.clientId && cognitoConfig.redirectSignIn)
}

// PKCE 코드 생성
function generateRandomString(length: number): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest("SHA-256", data)
}

function base64urlencode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = generateRandomString(64)
  const hash = await sha256(codeVerifier)
  const codeChallenge = base64urlencode(hash)

  // 세션 스토리지에 저장 (callback에서 사용)
  if (typeof window !== "undefined") {
    sessionStorage.setItem("pkce_code_verifier", codeVerifier)
  }

  return { codeVerifier, codeChallenge }
}

export function getStoredCodeVerifier(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("pkce_code_verifier")
}

export function clearCodeVerifier(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem("pkce_code_verifier")
}

// Cognito Hosted UI 로그인 URL 생성
export async function getCognitoLoginUrl(): Promise<string> {
  const { codeChallenge } = await generatePKCE()

  const params = new URLSearchParams({
    response_type: "code",
    client_id: cognitoConfig.clientId,
    redirect_uri: cognitoConfig.redirectSignIn,
    scope: cognitoConfig.scopes,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })

  return `https://${cognitoConfig.domain}/oauth2/authorize?${params.toString()}`
}

// Cognito 로그아웃 URL 생성
export function getCognitoLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    logout_uri: cognitoConfig.redirectSignOut,
  })

  return `https://${cognitoConfig.domain}/logout?${params.toString()}`
}

// Authorization Code를 토큰으로 교환
export async function exchangeCodeForTokens(
  code: string,
): Promise<{ accessToken: string; idToken: string; refreshToken: string } | null> {
  const codeVerifier = getStoredCodeVerifier()
  if (!codeVerifier) {
    console.error("Code verifier not found")
    return null
  }

  try {
    const response = await fetch(`https://${cognitoConfig.domain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: cognitoConfig.clientId,
        redirect_uri: cognitoConfig.redirectSignIn,
        code,
        code_verifier: codeVerifier,
      }),
    })

    if (!response.ok) {
      console.error("Token exchange failed:", await response.text())
      return null
    }

    const data = await response.json()
    clearCodeVerifier()

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
    }
  } catch (error) {
    console.error("Token exchange error:", error)
    return null
  }
}

// ID 토큰에서 사용자 정보 추출
export function parseIdToken(idToken: string): { sub: string; email: string; name?: string } | null {
  try {
    const parts = idToken.split(".")
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[1]))
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split("@")[0],
    }
  } catch {
    return null
  }
}
