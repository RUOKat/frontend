import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type SignUpRequest = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  let body: SignUpRequest
  try {
    body = (await request.json()) as SignUpRequest
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
  if (!region || !clientId) {
    return NextResponse.json({ message: "Cognito 환경 변수가 설정되지 않았습니다." }, { status: 500 })
  }

  const client = new CognitoIdentityProviderClient({ region })

  try {
    // 이메일에서 이름 추출 (@ 앞부분)
    const name = email.split("@")[0] || "User"

    const command = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
      ],
    })

    const response = await client.send(command)
    const details = response.CodeDeliveryDetails

    return NextResponse.json({
      userSub: response.UserSub ?? null,
      userConfirmed: response.UserConfirmed ?? false,
      codeDeliveryDetails: details
        ? {
          destination: details.Destination,
          deliveryMedium: details.DeliveryMedium,
          attributeName: details.AttributeName,
        }
        : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "회원가입에 실패했습니다."
    const name = error instanceof Error ? error.name : "UnknownError"
    const status = name === "UsernameExistsException" ? 409 : 400
    return NextResponse.json({ message, name }, { status })
  }
}
