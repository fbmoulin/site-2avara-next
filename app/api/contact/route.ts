import { after, NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { contactMessages } from "@/lib/db/schema"
import { contactSchema } from "@/lib/validators"
import { sendContactNotification } from "@/lib/email"
import { contactRateLimit, checkRateLimit } from "@/lib/rate-limit"
import { readJsonBody, RequestBodyError } from "@/lib/request-body"

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0].trim() ?? "anonymous"
  const limit = await checkRateLimit(contactRateLimit, ip)
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
    body = await readJsonBody(request, 32768)
  } catch (error) {
    const invalid = error instanceof RequestBodyError ? error : new RequestBodyError(400)
    return NextResponse.json({ error: invalid.message }, { status: invalid.status })
  }
  const result = contactSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: result.error.issues },
      { status: 400 }
    )
  }

  const data = result.data

  let id: string
  try {
    const [record] = await db
      .insert(contactMessages)
      .values({
        name: data.name,
        phone: data.phone,
        email: data.email,
        subject: data.subject,
        message: data.message,
      })
      .returning({ id: contactMessages.id })
    id = record.id
  } catch {
    console.error("[contact] persistence_failed")
    return NextResponse.json(
      { error: "Não foi possível receber a mensagem. Tente novamente mais tarde." },
      { status: 503 }
    )
  }

  // Notification failure must never undo or misreport a successful persistence.
  after(async () => {
    try {
      if (!(await sendContactNotification(data)))
        console.error("[contact] notification_pending", { id })
    } catch {
      console.error("[contact] notification_pending", { id })
    }
  })

  return NextResponse.json({ message: "Mensagem enviada com sucesso.", id }, { status: 201 })
}
