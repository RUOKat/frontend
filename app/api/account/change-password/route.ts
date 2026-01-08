import { CognitoIdentityProviderClient, ChangePasswordCommand } from "@aws-sdk/client-cognito-identity-provider"
import { NextResponse } from "next/server"
import { verifyCognitoAccessToken } from "@/lib/verify-cognito-access-token"

export const runtime = "nodejs"

type ChangePasswordRequest = {
  currentPassword?: string
  newPassword?: string
}

function unauthorized() {
  return NextResponse.json({ message: "인증 정보가 유효하지 않습니다." }, { status: 401 })
}

export async function POST(request: Request) {
  let body: ChangePasswordRequest
  try {
    body = (await request.json()) as ChangePasswordRequest
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 })
  }

  const currentPassword = body.currentPassword
  const newPassword = body.newPassword
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: "현재 비밀번호와 새 비밀번호를 입력해주세요." }, { status: 400 })
  }

  const region = process.env.AWS_REGION || ""

  if (!region) {
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

  try {
    await client.send(
      new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: currentPassword,
        ProposedPassword: newPassword,
      }),
    )
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError"
    if (name === "NotAuthorizedException") {
      return NextResponse.json({ message: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 })
    }
    if (name === "InvalidPasswordException") {
      return NextResponse.json({ message: "새 비밀번호가 규칙에 맞지 않습니다." }, { status: 400 })
    }
    return NextResponse.json({ message: "비밀번호 변경에 실패했습니다." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
