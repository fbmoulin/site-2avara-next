import { z } from "zod/v4"

export const contactSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(255),
    phone: z.string().min(10, "Telefone inválido (inclua o DDD)").max(20),
    email: z.email("Email inválido"),
    subject: z.string().min(3).max(100),
    message: z
      .string()
      .min(10, "Mensagem deve ter no mínimo 10 caracteres")
      .max(5000),
  })

export const appointmentSchema = z.object({
  type: z.enum(["presencial", "virtual"]),
  withWhom: z.enum(["assessoria", "juiz"]),
  name: z.string().min(3).max(255),
  oabNumber: z.string().max(50).optional(),
  processNumber: z
    .string()
    .min(1, "Número do processo é obrigatório")
    .max(50),
  reason: z
    .string()
    .min(10, "Motivo deve ter no mínimo 10 caracteres")
    .max(5000),
})

export const demandSchema = z.object({
  processNumber: z.string().min(1).max(50),
  demandType: z.enum(["reclamacao", "celeridade", "peticao_urgente"]),
  description: z.string().min(10).max(5000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
})
