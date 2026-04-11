import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { contactMessages } from "@/lib/db/schema"
import { contactSchema } from "@/lib/validators"
import { sendContactNotification } from "@/lib/email"
import { contactRateLimit, checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous"
  const { success } = await checkRateLimit(contactRateLimit, ip)
  if (!success) {
    return NextResponse.json(
      { error: "Muitas solicitações. Aguarde alguns minutos." },
      { status: 429 }
    )
  }

  const body = await request.json()
  const result = contactSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: result.error.issues },
      { status: 400 }
    )
  }

  const data = result.data

  await db.insert(contactMessages).values({
    name: data.name,
    phone: data.phone,
    email: data.email,
    subject: data.subject,
    message: data.message,
  })

  await sendContactNotification(data)

  return NextResponse.json(
    { message: "Mensagem enviada com sucesso." },
    { status: 201 }
  )
}
