"use client"

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react"
import { MessageSquare, Send, X, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  role: "user" | "assistant"
  content: string
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Olá! Sou o assistente virtual da 2ª Vara Cível de Cariacica. Como posso ajudá-lo hoje?",
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  function handleClear() {
    setMessages([INITIAL_MESSAGE])
    setInput("")
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: "user", content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: updatedMessages,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error("Erro na resposta do servidor.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue

          const data = trimmedLine.slice(6)
          if (data === "[DONE]") break

          try {
            const parsed = JSON.parse(data) as { content?: string; error?: string }
            if (parsed.error) {
              assistantContent += parsed.error
            } else if (parsed.content) {
              assistantContent += parsed.content
            }
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantContent,
              }
              return updated
            })
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente mais tarde.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-amber-500 text-slate-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-amber-500/40 animate-pulse-ring" />
        )}
        <MessageSquare className="size-6 relative z-10" />
      </button>

      {/* Chat panel */}
      <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 right-6 z-40 flex h-[500px] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-amber-500/5 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Assistente Virtual
              </h2>
              <p className="text-xs text-muted-foreground">2ª Vara Cível</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Limpar conversa"
              >
                <Trash2 className="size-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Fechar chat"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-amber-500/10 text-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t px-3 py-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-900 transition-colors hover:bg-amber-400 disabled:opacity-50"
              aria-label="Enviar mensagem"
            >
              <Send className="size-4" />
            </button>
          </form>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  )
}
