import { NextRequest } from "next/server"
import { streamChatResponse, type ChatMessage } from "@/lib/openai"

export async function POST(request: NextRequest) {
  const { message, history } = (await request.json()) as {
    message: string
    history: ChatMessage[]
  }

  if (!message || typeof message !== "string") {
    return Response.json({ error: "Mensagem é obrigatória." }, { status: 400 })
  }

  const stream = await streamChatResponse(message, history || [])

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
