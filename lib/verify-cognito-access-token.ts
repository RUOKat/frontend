import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

type VerifyResult =
  | {
      ok: true
      payload: JWTPayload
    }
  | {
      ok: false
      message: string
    }

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function getJwks(issuer: string) {
  const cached = jwksCache.get(issuer)
  if (cached) return cached
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
  jwksCache.set(issuer, jwks)
  return jwks
}

/**
 * Verify Cognito access_token signatures for Hosted UI (no Resource Server).
 * - issuer is always verified.
 * - audience is intentionally NOT enforced because access_token does not target a Resource Server.
 * - client_id is optionally validated only when present in the token payload.
 */
export async function verifyCognitoAccessToken(token: string): Promise<VerifyResult> {
  if (!token) {
    return { ok: false, message: "Missing access token." }
  }

  const issuer = process.env.COGNITO_ISSUER?.trim()
  if (!issuer) {
    return { ok: false, message: "Missing COGNITO_ISSUER." }
  }

  try {
    const jwks = getJwks(issuer)
    const { payload } = await jwtVerify(token, jwks, { issuer })

    const expectedClientId = process.env.COGNITO_CLIENT_ID?.trim()
    const tokenClientId = typeof payload.client_id === "string" ? payload.client_id : undefined
    if (expectedClientId && tokenClientId && tokenClientId !== expectedClientId) {
      return { ok: false, message: "client_id mismatch." }
    }

    return { ok: true, payload }
  } catch {
    return { ok: false, message: "Signature verification failed." }
  }
}
