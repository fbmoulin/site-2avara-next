"use client"

import { useRef, useState, type FormEvent } from "react"
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { log } from "@/lib/logger"
import { CONTACT_INFO } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

const SUBJECT_OPTIONS = [
  { value: "informacao", label: "Informação" },
  { value: "agendamento", label: "Agendamento" },
  { value: "sugestao", label: "Sugestão" },
  { value: "reclamacao", label: "Reclamação" },
  { value: "outro", label: "Outro" },
]

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [subject, setSubject] = useState<string | null>(null)

  const [errorMessage, setErrorMessage] = useState("")
  const submitting = useRef(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting.current) return
    const form = e.currentTarget
    submitting.current = true
    setStatus("loading")
    setErrorMessage("")

    const formData = new FormData(form)
    const body = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      subject: subject ?? "outro",
      message: formData.get("message") as string,
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.status !== 201) {
        log.error("contact_form_error", { status: res.status })
        const message =
          res.status === 400 || res.status === 422
            ? "Confira os dados: nome com pelo menos 3 caracteres, telefone com DDD, e-mail válido e mensagem com pelo menos 10 caracteres."
            : res.status === 429
              ? "Você atingiu o limite de envios. Aguarde alguns minutos antes de tentar novamente."
              : "O serviço está temporariamente indisponível. Seus dados foram preservados. Tente novamente mais tarde."
        setErrorMessage(message)
        setStatus("error")
        return
      }
      const receipt: unknown = await res.json()
      if (
        !receipt ||
        typeof receipt !== "object" ||
        !("message" in receipt) ||
        typeof receipt.message !== "string" ||
        !("id" in receipt) ||
        typeof receipt.id !== "string"
      ) {
        setErrorMessage(
          "Não foi possível confirmar o recebimento. Antes de reenviar, consulte a equipe pelos canais de contato."
        )
        setStatus("error")
        return
      }
      // The server confirmed persistence. A UI reset must not turn that into a send failure.
      try {
        form.reset()
      } catch {
        log.warn("contact_form_reset_failed")
      }
      setSubject(null)
      setStatus("success")
    } catch {
      log.error("contact_form_network_error")
      setErrorMessage(
        "Não foi possível confirmar o recebimento. Antes de reenviar, consulte a equipe pelos canais de contato."
      )
      setStatus("error")
    } finally {
      submitting.current = false
    }
  }

  return (
    <section id="contato" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <ScrollReveal variant="fade-up">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold tracking-wider text-amber-500 uppercase">
              Atendimento
            </p>
            <h2 className="flex items-center justify-center gap-3 text-3xl font-bold text-foreground md:text-4xl">
              <Mail className="size-8 text-amber-500" />
              Entre em Contato
            </h2>
            <p className="mt-4 text-muted-foreground">
              Envie sua mensagem ou dúvida. Nossa equipe retornará em breve.
            </p>
          </div>
        </ScrollReveal>

        <div id="localizacao" className="grid gap-12 lg:grid-cols-2">
          {/* Left: contact info + map */}
          <ScrollReveal variant="fade-up" delay={0.1} className="space-y-8">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <MapPin className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Endereço</p>
                  <p className="text-sm text-muted-foreground">{CONTACT_INFO.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Phone className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Telefone</p>
                  <p className="text-sm text-muted-foreground">{CONTACT_INFO.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Mail className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">E-mail</p>
                  <p className="text-sm text-muted-foreground">{CONTACT_INFO.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Horário</p>
                  <p className="text-sm text-muted-foreground">Seg-Sex: 12h às 18h</p>
                </div>
              </div>
            </div>

            {/* Google Maps */}
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3741.!2d-40.41!3d-20.35!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDIxJzAzLjAiUyA0MMKwMjQnMzguMCJX!5e0!3m2!1sen!2sbr!4v1"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização da 2ª Vara Cível de Cariacica"
              />
            </div>
          </ScrollReveal>

          {/* Right: form */}
          <ScrollReveal
            variant="fade-up"
            delay={0.2}
            className="rounded-xl border border-border bg-muted p-6 md:p-8"
          >
            {status === "success" ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center justify-center gap-4 py-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle className="size-16 text-green-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground">Mensagem enviada!</h3>
                <p className="text-sm text-muted-foreground">
                  Sua mensagem de contato foi recebida para análise da equipe. O envio não confirma
                  data ou horário de atendimento.
                </p>
                <Button
                  onClick={() => setStatus("idle")}
                  className="mt-4 bg-amber-500 text-foreground hover:bg-amber-400"
                >
                  Enviar outra mensagem
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} aria-busy={status === "loading"} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    minLength={3}
                    maxLength={255}
                    placeholder="Seu nome"
                    required
                    className="bg-background"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      minLength={10}
                      maxLength={20}
                      placeholder="(27) 99999-0000"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label id="subject-label">Assunto</Label>
                  <Select value={subject} onValueChange={(val) => setSubject(val)}>
                    <SelectTrigger aria-labelledby="subject-label" className="w-full bg-background">
                      <SelectValue placeholder="Selecione o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Descreva sua solicitação..."
                    rows={5}
                    minLength={10}
                    maxLength={5000}
                    required
                    className="bg-background"
                  />
                </div>

                {status === "error" && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-amber-500 text-foreground hover:bg-amber-400 disabled:opacity-50"
                  size="lg"
                >
                  {status === "loading" ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="size-4" />
                      Enviar Mensagem
                    </span>
                  )}
                </Button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
