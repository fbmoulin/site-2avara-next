import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { appointments } from "@/lib/db/schema"
import { appointmentSchema } from "@/lib/validators"
import { sendAppointmentNotification } from "@/lib/email"
import { appointmentRateLimit, checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0].trim() ?? "anonymous"
  const limit = await checkRateLimit(appointmentRateLimit, ip)
  if (!limit.success) {
    return NextResponse.json(
      {
        error: limit.unavailable
          ? "Serviço temporariamente indisponível."
          : "Muitas solicitações. Aguarde alguns minutos.",
      },
      { status: limit.unavailable ? 503 : 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 })
  }
  const result = appointmentSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: result.error.issues },
      { status: 400 }
    )
  }

  const data = result.data

  await db.insert(appointments).values({
    type: data.type,
    withWhom: data.withWhom,
    name: data.name,
    oabNumber: data.oabNumber,
    processNumber: data.processNumber,
    reason: data.reason,
  })

  await sendAppointmentNotification(data)

  return NextResponse.json({ message: "Agendamento pré-reservado com sucesso." }, { status: 201 })
}
