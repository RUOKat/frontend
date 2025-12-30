import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type LoginRequest = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  let body: LoginRequest
  try {
    body = (await request.json()) as LoginRequest
  } catch {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 })
  }

  const email = body.email?.trim()
  const password = body.password
  if (!email || !password) {
    return NextResponse.json({ message: "이메일과 비밀번호를 입력해주세요." }, { status: 400 })
  }

  const region = process.env.AWS_REGION || ""
  const clientId = process.env.COGNITO_CLIENT_ID || ""
  const userPoolId = process.env.COGNITO_USER_POOL_ID || ""
  if (!region || !clientId || !userPoolId) {
    return NextResponse.json({ message: "Cognito 환경 변수가 설정되지 않았습니다." }, { status: 500 })
  }

  const client = new CognitoIdentityProviderClient({ region })

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    })

    const response = await client.send(command)
    const result = response.AuthenticationResult

    if (!result?.IdToken || !result.AccessToken) {
      return NextResponse.json({ message: "인증 결과를 가져오지 못했습니다." }, { status: 500 })
    }

    return NextResponse.json({
      idToken: result.IdToken,
      accessToken: result.AccessToken,
      refreshToken: result.RefreshToken ?? null,
      expiresIn: result.ExpiresIn ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그인에 실패했습니다."
    const name = error instanceof Error ? error.name : "UnknownError"
    const status = name === "NotAuthorizedException" || name === "UserNotFoundException" ? 401 : 400
    return NextResponse.json({ message, name }, { status })
  }
}
