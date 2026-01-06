import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type ConfirmRequest = {
  email?: string
  code?: string
}

export async function POST(request: Request) {
  let body: ConfirmRequest
  try {
    body = (await request.json()) as ConfirmRequest
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 })
  }

  const email = body.email?.trim()
  const code = body.code?.trim()
  if (!email || !code) {
    return NextResponse.json({ message: "이메일과 인증 코드를 입력해주세요." }, { status: 400 })
  }

  const region = process.env.AWS_REGION || ""
  const clientId = process.env.COGNITO_CLIENT_ID || ""
  if (!region || !clientId) {
    return NextResponse.json({ message: "Cognito 환경 변수가 설정되지 않았습니다." }, { status: 500 })
  }

  const client = new CognitoIdentityProviderClient({ region })

  try {
    const command = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
    })

    await client.send(command)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "인증에 실패했습니다."
    const name = error instanceof Error ? error.name : "UnknownError"
    const status = name === "UserNotFoundException" ? 404 : 400
    return NextResponse.json({ message, name }, { status })
  }
}
