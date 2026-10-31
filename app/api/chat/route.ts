import { z } from "zod/v4"
import { ASSISTANT_WELCOME, getAssistantReply } from "@/lib/assistant"
import { chatRateLimit, checkRateLimit } from "@/lib/rate-limit"
import { readJsonBody, RequestBodyError } from "@/lib/request-body"

const optionSchema = z.object({ option: z.enum(["services", "contact", "virtual"]) }).strict()
const legacySchema = z.object({ message: z.string().trim().min(1).max(2000) })

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous"
  const limit = await checkRateLimit(chatRateLimit, ip)
  if (!limit.success) {
    return Response.json(
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
    body = await readJsonBody(request, 8192)
  } catch (error) {
    const invalid = error instanceof RequestBodyError ? error : new RequestBodyError(400)
    return Response.json({ error: invalid.message }, { status: invalid.status })
  }
  const result = optionSchema.safeParse(body)
  if (result.success) {
    return Response.json(getAssistantReply(result.data.option), {
      headers: { "Cache-Control": "no-store" },
    })
  }
  // Cached clients may still send text/history. Never forward or echo either.
  if (
    body &&
    typeof body === "object" &&
    !("option" in body) &&
    legacySchema.safeParse(body).success
  ) {
    return new Response(
      `data: ${JSON.stringify({ content: ASSISTANT_WELCOME.text + " Para solicitar atendimento, acesse o formulário na seção Contato deste site." })}\n\ndata: [DONE]\n\n`,
      {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" },
      }
    )
  }
  return Response.json({ error: "Escolha uma opção válida." }, { status: 400 })
}
