import { z } from "zod/v4"
import { CONTACT_HONEYPOT_FIELD, CONTACT_SUBJECTS, type ContactSubject } from "./constants"

export { CONTACT_HONEYPOT_FIELD }

const contactSubjects = CONTACT_SUBJECTS.map((subject) => subject.value) as [
  ContactSubject,
  ...ContactSubject[],
]

export const contactSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(255),
  phone: z.string().min(10, "Telefone inválido (inclua o DDD)").max(20),
  email: z.email("Email inválido").max(255),
  // Exactly the options shown on the form (R2.7).
  subject: z.enum(contactSubjects),
  message: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres").max(5000),
  // Honeypot: any content means an automated submission, rejected as invalid data (nothing saved).
  [CONTACT_HONEYPOT_FIELD]: z.string().max(0).optional(),
})

// Administrative free-text notes (contacts, appointments, demands): at most 5000 characters.
export const adminNotesSchema = z.string().max(5000, "Observações com no máximo 5000 caracteres")

const ZOOM_HOSTS = ["zoom.us", "zoom.com"]

// Optional Zoom link of a confirmed appointment: empty, or an https URL on a Zoom domain.
export const zoomLinkSchema = z.union([
  z.literal(""),
  z
    .url({ protocol: /^https$/, hostname: z.regexes.domain })
    .max(500)
    .refine((value) => {
      let url: URL
      try {
        url = new URL(value)
      } catch {
        return false
      }
      const host = url.hostname.toLowerCase()
      return (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !url.port &&
        ZOOM_HOSTS.some((zoom) => host === zoom || host.endsWith(`.${zoom}`))
      )
    }, "Informe um link https do Zoom"),
])

export const appointmentSchema = z.object({
  type: z.enum(["presencial", "virtual"]),
  withWhom: z.enum(["assessoria", "juiz"]),
  name: z.string().min(3).max(255),
  oabNumber: z.string().max(50).optional(),
  processNumber: z.string().min(1, "Número do processo é obrigatório").max(50),
  reason: z.string().min(10, "Motivo deve ter no mínimo 10 caracteres").max(5000),
})

export const demandSchema = z.object({
  processNumber: z.string().min(1).max(50),
  demandType: z.enum(["reclamacao", "celeridade", "peticao_urgente"]),
  description: z.string().min(10).max(5000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
})
