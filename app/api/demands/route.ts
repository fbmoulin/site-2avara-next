import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { demands } from "@/lib/db/schema"
import { demandSchema } from "@/lib/validators"
import { sendDemandNotification } from "@/lib/email"
import { demandRateLimit, checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0].trim() ?? "anonymous"
  const { success } = await checkRateLimit(demandRateLimit, ip)
  if (!success) {
    return NextResponse.json(
      { error: "Muitas solicitações. Aguarde alguns minutos." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 })
  }
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
