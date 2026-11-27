"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { ScrollReveal } from "@/components/motion/scroll-reveal"
import { log } from "@/lib/logger"
import { CONTACT_HONEYPOT_FIELD, CONTACT_INFO, CONTACT_SUBJECTS } from "@/lib/constants"
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

const PRIVACY_NOTICE_ID = "contact-privacy-notice"

type FieldName = "name" | "phone" | "email" | "message"
type FieldErrors = Partial<Record<FieldName, string>>

// Same limits as contactSchema (lib/validators.ts); the server validates again (R2.8).
const FIELD_RULES: Record<
  FieldName,
  { hint: string; error: string; valid: (value: string) => boolean }
> = {
  name: {
    hint: "Pelo menos 3 letras.",
    error: "Informe o nome completo, com pelo menos 3 letras.",
    valid: (value) => value.trim().length >= 3 && value.length <= 255,
  },
  phone: {
    hint: "Com DDD. Exemplo: (27) 99999-0000.",
    error: "Informe o telefone com DDD, por exemplo (27) 99999-0000.",
    valid: (value) =>
      value.replace(/\D/g, "").length >= 10 && value.length >= 10 && value.length <= 20,
  },
  email: {
    hint: "Exemplo: nome@exemplo.com.",
    error: "Informe um e-mail válido, por exemplo nome@exemplo.com.",
    valid: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 255,
  },
  message: {
    hint: "Entre 10 e 5000 caracteres.",
    error: "Escreva a mensagem com pelo menos 10 caracteres.",
    valid: (value) => value.trim().length >= 10 && value.length <= 5000,
  },
}
const FIELD_ORDER: FieldName[] = ["name", "phone", "email", "message"]

function validate(formData: FormData): FieldErrors {
  const errors: FieldErrors = {}
  for (const field of FIELD_ORDER) {
    const value = (formData.get(field) as string | null) ?? ""
    if (!FIELD_RULES[field].valid(value)) errors[field] = FIELD_RULES[field].error
  }
  return errors
}

// Hint always visible; the error, when present, is announced with the field (aria-describedby).
function describedBy(field: FieldName, errors: FieldErrors) {
  return errors[field] ? `${field}-hint ${field}-error` : `${field}-hint`
}

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [subject, setSubject] = useState<string | null>(null)

  const [errorMessage, setErrorMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const submitting = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const successHeading = useRef<HTMLHeadingElement>(null)

  // Move focus to the confirmation so keyboard and screen reader users hear it (R2.8).
  useEffect(() => {
    if (status === "success") successHeading.current?.focus()
  }, [status])

  function focusFirstInvalid(errors: FieldErrors) {
    const first = FIELD_ORDER.find((field) => errors[field])
    if (first) formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus()
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting.current) return
    const form = e.currentTarget
    const formData = new FormData(form)
    const errors = validate(formData)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setErrorMessage("Confira os campos destacados.")
      setStatus("error")
      focusFirstInvalid(errors)
      return
    }
    submitting.current = true
    setStatus("loading")
    setErrorMessage("")

    const body = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      subject: subject ?? "outro",
      message: formData.get("message") as string,
      [CONTACT_HONEYPOT_FIELD]: (formData.get(CONTACT_HONEYPOT_FIELD) as string | null) ?? "",
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.status !== 201) {
        log.error("contact_form_error", { status: res.status })
        if (res.status === 400 || res.status === 422) {
          // Point at the fields the server rejected, when it says which ones.
          const answer: unknown = await res.json().catch(() => null)
          const issues =
            answer &&
            typeof answer === "object" &&
            "details" in answer &&
            Array.isArray(answer.details)
              ? (answer.details as { path?: unknown[] }[])
              : []
          const serverErrors: FieldErrors = {}
          for (const issue of issues) {
            const field = issue.path?.[0]
            if (typeof field === "string" && FIELD_ORDER.includes(field as FieldName))
              serverErrors[field as FieldName] = FIELD_RULES[field as FieldName].error
          }
          setFieldErrors(serverErrors)
          focusFirstInvalid(serverErrors)
        }
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
          "Não foi possível confirmar o recebimento. Antes de reenviar, consulte a equipe pelos canais de contato.",
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
      setFieldErrors({})
      setStatus("success")
    } catch {
      log.error("contact_form_network_error")
      setErrorMessage(
        "Não foi possível confirmar o recebimento. Antes de reenviar, consulte a equipe pelos canais de contato.",
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
                  <p className="text-sm">
                    <a
                      href={CONTACT_INFO.phoneHref}
                      className="text-foreground underline underline-offset-2 hover:no-underline"
                    >
                      {CONTACT_INFO.phone}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Mail className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">E-mail</p>
                  <p className="text-sm">
                    <a
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="break-all text-foreground underline underline-offset-2 hover:no-underline"
                    >
                      {CONTACT_INFO.email}
                    </a>
                  </p>
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
                <h3
                  ref={successHeading}
                  tabIndex={-1}
                  className="text-xl font-bold text-foreground focus:outline-none"
                >
                  Mensagem enviada!
                </h3>
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
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                onInput={(event) => {
                  // Clear a field's error as soon as the person edits it.
                  const field = (event.target as HTMLInputElement).name as FieldName
                  if (fieldErrors[field])
                    setFieldErrors((current) => ({ ...current, [field]: undefined }))
                }}
                noValidate
                aria-busy={status === "loading"}
                className="relative space-y-5"
              >
                {/* Honeypot (R2.7): off screen and out of the tab order; only bots fill it. */}
                <div
                  aria-hidden="true"
                  className="absolute -left-[10000px] h-px w-px overflow-hidden"
                >
                  <label htmlFor={CONTACT_HONEYPOT_FIELD}>Deixe este campo em branco</label>
                  <input
                    id={CONTACT_HONEYPOT_FIELD}
                    name={CONTACT_HONEYPOT_FIELD}
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    defaultValue=""
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    minLength={3}
                    maxLength={255}
                    placeholder="Seu nome"
                    required
                    aria-invalid={fieldErrors.name ? true : undefined}
                    aria-describedby={describedBy("name", fieldErrors)}
                    className="bg-background"
                  />
                  <FieldMessages field="name" errors={fieldErrors} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      minLength={10}
                      maxLength={20}
                      placeholder="(27) 99999-0000"
                      required
                      aria-invalid={fieldErrors.phone ? true : undefined}
                      aria-describedby={describedBy("phone", fieldErrors)}
                      className="bg-background"
                    />
                    <FieldMessages field="phone" errors={fieldErrors} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={255}
                      placeholder="seu@email.com"
                      required
                      aria-invalid={fieldErrors.email ? true : undefined}
                      aria-describedby={describedBy("email", fieldErrors)}
                      className="bg-background"
                    />
                    <FieldMessages field="email" errors={fieldErrors} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label id="subject-label">Assunto</Label>
                  <Select value={subject} onValueChange={(val) => setSubject(val)}>
                    <SelectTrigger aria-labelledby="subject-label" className="w-full bg-background">
                      <SelectValue placeholder="Selecione o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_SUBJECTS.map((opt) => (
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
                    aria-invalid={fieldErrors.message ? true : undefined}
                    aria-describedby={describedBy("message", fieldErrors)}
                    className="bg-background"
                  />
                  <FieldMessages field="message" errors={fieldErrors} />
                </div>

                {status === "error" && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <p id={PRIVACY_NOTICE_ID} className="text-sm text-foreground">
                  Seus dados servem só para responder a esta mensagem. Dúvidas sobre proteção de
                  dados:{" "}
                  <a
                    href="mailto:suporte@lexintelligentia.com.br"
                    className="font-medium underline underline-offset-2 hover:no-underline"
                  >
                    suporte@lexintelligentia.com.br
                  </a>
                  .
                </p>

                <Button
                  type="submit"
                  aria-describedby={PRIVACY_NOTICE_ID}
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

function FieldMessages({ field, errors }: { field: FieldName; errors: FieldErrors }) {
  return (
    <>
      <p id={`${field}-hint`} className="text-xs text-foreground/80">
        {FIELD_RULES[field].hint}
      </p>
      {errors[field] && (
        <p id={`${field}-error`} className="text-sm font-medium text-red-700">
          {errors[field]}
        </p>
      )}
    </>
  )
}
