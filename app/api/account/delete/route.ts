import { CognitoIdentityProviderClient, GetUserCommand, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { NextResponse } from "next/server"
import { verifyCognitoAccessToken } from "@/lib/verify-cognito-access-token"

export const runtime = "nodejs"

function unauthorized() {
  return NextResponse.json({ message: "인증 정보가 유효하지 않습니다." }, { status: 401 })
}

export async function POST(request: Request) {
  const region = process.env.AWS_REGION || ""
  const userPoolId = process.env.COGNITO_USER_POOL_ID || ""

  if (!region || !userPoolId) {
    return NextResponse.json({ message: "Cognito 환경 변수가 설정되지 않았습니다." }, { status: 400 })
  }

  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized()
  }

  const accessToken = authHeader.slice("Bearer ".length).trim()
  if (!accessToken) {
    return unauthorized()
  }

  const verifyResult = await verifyCognitoAccessToken(accessToken)
  if (!verifyResult.ok) {
    return unauthorized()
  }

  const client = new CognitoIdentityProviderClient({ region })

  let username: string | undefined
  try {
    const response = await client.send(new GetUserCommand({ AccessToken: accessToken }))
    username = response.Username
  } catch {
    return unauthorized()
  }

  if (!username) {
    return unauthorized()
  }

  try {
    await client.send(
      new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      }),
    )
  } catch {
    return NextResponse.json({ message: "계정 삭제에 실패했습니다." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
