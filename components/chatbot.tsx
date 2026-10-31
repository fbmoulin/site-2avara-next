"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { MessageSquare, X, Trash2 } from "lucide-react"
import {
  ASSISTANT_OPTIONS,
  ASSISTANT_WELCOME,
  type AssistantOption,
  type AssistantReply,
} from "@/lib/assistant"

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [reply, setReply] = useState<AssistantReply>(ASSISTANT_WELCOME)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const pending = useRef<AbortController | null>(null)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    pending.current?.abort()
    pending.current = null
    setLoading(false)
    setIsOpen(false)
    toggleRef.current?.focus()
  }, [])

  useEffect(() => {
    window.addEventListener("open-assistant", open)
    return () => {
      window.removeEventListener("open-assistant", open)
      pending.current?.abort()
    }
  }, [open])
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  async function choose(option: AssistantOption) {
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option }),
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (!response.ok) {
        setError(
          response.status === 429
            ? "Aguarde alguns minutos antes de tentar novamente."
            : "Não foi possível carregar a orientação. Utilize a seção Contato."
        )
        return
      }
      const data: AssistantReply = await response.json()
      if (!controller.signal.aborted) setReply(data)
    } catch {
      if (!controller.signal.aborted)
        setError("Não foi possível carregar a orientação. Utilize a seção Contato.")
    } finally {
      if (pending.current === controller) {
        pending.current = null
        setLoading(false)
      }
    }
  }

  return (
    <>
      <button
        ref={toggleRef}
        onClick={() => (isOpen ? close() : open())}
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-amber-500 text-slate-900 shadow-lg"
        aria-label={isOpen ? "Fechar guia de atendimento" : "Abrir guia de atendimento"}
        aria-expanded={isOpen}
        aria-controls="assistant-panel"
      >
        <MessageSquare className="size-6" />
      </button>
      {isOpen && (
        <div
          id="assistant-panel"
          ref={panelRef}
          role="dialog"
          aria-labelledby="assistant-title"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape") close()
          }}
          className="fixed bottom-24 right-6 z-40 flex max-h-[calc(100dvh-7rem)] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-y-auto rounded-xl border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 id="assistant-title" className="font-semibold">
              Guia de atendimento
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  pending.current?.abort()
                  pending.current = null
                  setLoading(false)
                  setError("")
                  setReply(ASSISTANT_WELCOME)
                }}
                aria-label="Voltar às orientações iniciais"
                className="p-2"
              >
                <Trash2 className="size-4" />
              </button>
              <button onClick={close} aria-label="Fechar guia" className="p-2">
                <X className="size-4" />
              </button>
            </div>
          </div>
          <div className="space-y-4 p-4">
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="text-sm leading-relaxed"
            >
              {reply.text}
            </div>
            {reply.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => {
                  if (link.href.startsWith("/")) close()
                }}
                target={link.href.startsWith("https:") ? "_blank" : undefined}
                rel={link.href.startsWith("https:") ? "noopener noreferrer" : undefined}
                className="block rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-900"
              >
                {link.label}
              </a>
            ))}
            <div
              role="group"
              className="flex flex-col gap-2"
              aria-label="Opções de orientação"
              aria-busy={loading}
            >
              {ASSISTANT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => choose(option.id)}
                  disabled={loading}
                  className="rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50"
                >
                  {option.label}
                </button>
              ))}
            </div>
            {loading && (
              <p role="status" className="text-sm">
                Carregando orientação...
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}{" "}
                <Link className="underline" href="/#contato" onClick={close}>
                  Abrir contato
                </Link>
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
