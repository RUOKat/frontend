const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const region = process.env.NEXT_PUBLIC_AWS_REGION || ""
const rawDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || ""

function normalizeCognitoDomain(domain: string, awsRegion: string): string {
  if (!domain) return ""
  if (domain.startsWith("http://") || domain.startsWith("https://")) return domain
  if (domain.includes("amazoncognito.com")) return `https://${domain}`
  if (awsRegion) return `https://${domain}.auth.${awsRegion}.amazoncognito.com`
  return `https://${domain}`
}

export const cognitoConfig = {
  domain: normalizeCognitoDomain(rawDomain, region),
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
  redirectSignIn: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNIN || `${appUrl}/auth/callback`,
  redirectSignOut: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGNOUT || `${appUrl}/auth/sign-in`,
  scopes: process.env.NEXT_PUBLIC_COGNITO_SCOPES || "openid email profile",
}

export function isCognitoConfigured(): boolean {
  return !!(cognitoConfig.domain && cognitoConfig.clientId && cognitoConfig.redirectSignIn)
}

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

function decodeBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "===".slice((base64.length + 3) % 4)
  return atob(padded)
}

export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = generateRandomString(64)
  const hash = await sha256(codeVerifier)
  const codeChallenge = base64urlencode(hash)

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

export function getStoredOAuthState(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem("oauth_state")
}

export function clearOAuthState(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem("oauth_state")
}

export async function getCognitoLoginUrl(
  options: { provider?: string; idpIdentifier?: string } = {},
): Promise<string> {
  const { codeChallenge } = await generatePKCE()

  const state = generateRandomString(16)
  if (typeof window !== "undefined") {
    sessionStorage.setItem("oauth_state", state)
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: cognitoConfig.clientId,
    redirect_uri: cognitoConfig.redirectSignIn,
    scope: cognitoConfig.scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })

  if (options.provider) {
    params.set("identity_provider", options.provider)
  }
  if (options.idpIdentifier) {
    params.set("idp_identifier", options.idpIdentifier)
  }

  return `${cognitoConfig.domain}/oauth2/authorize?${params.toString()}`
}

export function getCognitoLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    logout_uri: cognitoConfig.redirectSignOut,
  })

  return `${cognitoConfig.domain}/logout?${params.toString()}`
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<{ accessToken: string; idToken: string; refreshToken: string } | null> {
  const codeVerifier = getStoredCodeVerifier()
  if (!codeVerifier) {
    console.error("Code verifier not found")
    return null
  }

  try {
    const response = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
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

export function parseIdToken(idToken: string): { sub: string; email: string; name?: string } | null {
  try {
    const parts = idToken.split(".")
    if (parts.length !== 3) return null

    const payload = JSON.parse(decodeBase64Url(parts[1]))
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split("@")[0],
    }
  } catch {
    return null
  }
}
