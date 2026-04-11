import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { appointments } from "@/lib/db/schema"
import { appointmentSchema } from "@/lib/validators"
import { sendAppointmentNotification } from "@/lib/email"
import { appointmentRateLimit, checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous"
  const { success } = await checkRateLimit(appointmentRateLimit, ip)
  if (!success) {
    return NextResponse.json(
      { error: "Muitas solicitações. Aguarde alguns minutos." },
      { status: 429 }
    )
  }

  const body = await request.json()
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

  return NextResponse.json(
    { message: "Agendamento pré-reservado com sucesso." },
    { status: 201 }
  )
}
