import { z } from "zod/v4"
import { NextRequest } from "next/server"
import { streamChatResponse } from "@/lib/openai"
import { chatRateLimit, checkRateLimit } from "@/lib/rate-limit"

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(20).default([]),
})

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0].trim() ?? "anonymous"
  const { success } = await checkRateLimit(chatRateLimit, ip)
  if (!success) {
    return Response.json(
      { error: "Muitas solicitações. Aguarde alguns minutos." },
      { status: 429 }
    )
  }

  let body
  try { body = await request.json() } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 })
  }

  const result = chatSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 })
  }

  const { message, history: safeHistory } = result.data

  let stream
  try {
    stream = await streamChatResponse(message, safeHistory)
  } catch {
    return Response.json(
      { error: "Serviço de chat temporariamente indisponível." },
      { status: 503 }
    )
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            )
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Erro no processamento." })}\n\n`
          )
        )
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
