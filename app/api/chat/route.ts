import { NextRequest } from "next/server"
import { streamChatResponse, type ChatMessage } from "@/lib/openai"
import { chatRateLimit, checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous"
  const { success } = await checkRateLimit(chatRateLimit, ip)
  if (!success) {
    return Response.json(
      { error: "Muitas solicitações. Aguarde alguns minutos." },
      { status: 429 }
    )
  }

  const { message, history } = (await request.json()) as {
    message: string
    history: ChatMessage[]
  }

  if (!message || typeof message !== "string" || message.length > 2000) {
    return Response.json(
      { error: "Mensagem inválida (máx. 2000 caracteres)." },
      { status: 400 }
    )
  }

  const safeHistory = (Array.isArray(history) ? history : [])
    .filter((h: ChatMessage) => h.role === "user" || h.role === "assistant")
    .slice(-20)
    .map((h: ChatMessage) => ({
      role: h.role as "user" | "assistant",
      content: typeof h.content === "string" ? h.content.slice(0, 2000) : "",
    }))

  const stream = await streamChatResponse(message, safeHistory)

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
