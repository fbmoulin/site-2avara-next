import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { demands } from "@/lib/db/schema"
import { demandSchema } from "@/lib/validators"
import { sendDemandNotification } from "@/lib/email"
import { demandRateLimit, checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous"
  const { success } = await checkRateLimit(demandRateLimit, ip)
  if (!success) {
    return NextResponse.json(
      { error: "Muitas solicitações. Aguarde alguns minutos." },
      { status: 429 }
    )
  }

  const body = await request.json()
  const result = demandSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: result.error.issues },
      { status: 400 }
    )
  }

  const data = result.data

  await db.insert(demands).values({
    processNumber: data.processNumber,
    demandType: data.demandType,
    description: data.description,
    priority: data.priority,
  })

  await sendDemandNotification(data)

  return NextResponse.json(
    { message: "Demanda registrada com sucesso." },
    { status: 201 }
  )
}
