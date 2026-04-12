"use server"

import { z } from "zod/v4"
import { db } from "@/lib/db"
import {
  contactMessages,
  appointments,
  demands,
  articles,
  news,
} from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/auth"

async function requireAdmin() {
  const user = await getUser()
  if (!user) throw new Error("Não autorizado")
  return user
}

const uuidSchema = z.string().uuid()
const CONTACT_STATUSES = ["pending", "answered", "archived"] as const
const APPOINTMENT_STATUSES = ["pre_reserved", "confirmed", "completed", "cancelled"] as const
const DEMAND_STATUSES = ["pending", "in_analysis", "resolved", "archived"] as const

const createArticleSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(2000),
  content: z.string().min(1),
  author: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  imageUrl: z.string().max(500).optional(),
})

const updateArticleSchema = z.object({
  title: z.string().max(255).optional(),
  slug: z.string().max(255).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(2000).optional(),
  content: z.string().optional(),
  author: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  imageUrl: z.string().max(500).optional(),
})

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardStats() {
  await requireAdmin()
  const [pendingContacts] = await db
    .select({ count: count() })
    .from(contactMessages)
    .where(eq(contactMessages.status, "pending"))

  const [pendingAppointments] = await db
    .select({ count: count() })
    .from(appointments)
    .where(eq(appointments.status, "pre_reserved"))

  const [openDemands] = await db
    .select({ count: count() })
    .from(demands)
    .where(eq(demands.status, "pending"))

  const [totalArticles] = await db
    .select({ count: count() })
    .from(articles)

  return {
    pendingContacts: pendingContacts.count,
    pendingAppointments: pendingAppointments.count,
    openDemands: openDemands.count,
    totalArticles: totalArticles.count,
  }
}

export async function getRecentActivity() {
  await requireAdmin()

  const recentContacts = await db
    .select({
      id: contactMessages.id,
      name: contactMessages.name,
      status: contactMessages.status,
      createdAt: contactMessages.createdAt,
    })
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(5)

  const recentAppointments = await db
    .select({
      id: appointments.id,
      name: appointments.name,
      status: appointments.status,
      createdAt: appointments.createdAt,
    })
    .from(appointments)
    .orderBy(desc(appointments.createdAt))
    .limit(5)

  const recentDemands = await db
    .select({
      id: demands.id,
      processNumber: demands.processNumber,
      status: demands.status,
      createdAt: demands.createdAt,
    })
    .from(demands)
    .orderBy(desc(demands.createdAt))
    .limit(5)

  const activity = [
    ...recentContacts.map((c) => ({
      type: "contato" as const,
      description: c.name,
      status: c.status,
      createdAt: c.createdAt,
    })),
    ...recentAppointments.map((a) => ({
      type: "agendamento" as const,
      description: a.name,
      status: a.status,
      createdAt: a.createdAt,
    })),
    ...recentDemands.map((d) => ({
      type: "demanda" as const,
      description: d.processNumber,
      status: d.status,
      createdAt: d.createdAt,
    })),
  ]

  activity.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return activity.slice(0, 10)
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export async function getContacts(status?: string) {
  await requireAdmin()
  if (status && status !== "all" && !(CONTACT_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Status inválido")
  }

  const query = db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(50)

  if (status && status !== "all") {
    return query.where(eq(contactMessages.status, status))
  }

  return query
}

export async function updateContactStatus(
  id: string,
  status: string,
  answeredBy: string,
  notes: string
) {
  await requireAdmin()
  uuidSchema.parse(id)
  if (!(CONTACT_STATUSES as readonly string[]).includes(status)) throw new Error("Status inválido")

  await db
    .update(contactMessages)
    .set({
      status,
      answeredBy,
      notes,
      answeredAt: new Date(),
    })
    .where(eq(contactMessages.id, id))

  revalidatePath("/admin/contatos")
  revalidatePath("/admin")
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function getAppointments(status?: string) {
  await requireAdmin()
  if (status && status !== "all" && !(APPOINTMENT_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Status inválido")
  }

  const query = db
    .select()
    .from(appointments)
    .orderBy(desc(appointments.createdAt))
    .limit(50)

  if (status && status !== "all") {
    return query.where(eq(appointments.status, status))
  }

  return query
}

export async function confirmAppointment(
  id: string,
  confirmedDate: string,
  zoomLink: string,
  confirmedBy: string
) {
  await requireAdmin()
  uuidSchema.parse(id)

  await db
    .update(appointments)
    .set({
      status: "confirmed",
      confirmedDate: (() => {
        const d = new Date(confirmedDate)
        if (isNaN(d.getTime())) throw new Error("Data de confirmação inválida")
        return d
      })(),
      zoomLink,
      confirmedBy,
      confirmedAt: new Date(),
    })
    .where(eq(appointments.id, id))

  revalidatePath("/admin/agendamentos")
  revalidatePath("/admin")
}

export async function rejectAppointment(id: string, notes: string) {
  await requireAdmin()
  uuidSchema.parse(id)

  await db
    .update(appointments)
    .set({
      status: "cancelled",
      notes,
    })
    .where(eq(appointments.id, id))

  revalidatePath("/admin/agendamentos")
  revalidatePath("/admin")
}

// ---------------------------------------------------------------------------
// Demands
// ---------------------------------------------------------------------------

export async function getDemands(status?: string) {
  await requireAdmin()
  if (status && status !== "all" && !(DEMAND_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Status inválido")
  }

  const query = db
    .select()
    .from(demands)
    .orderBy(desc(demands.createdAt))
    .limit(50)

  if (status && status !== "all") {
    return query.where(eq(demands.status, status))
  }

  return query
}

export async function resolveDemand(
  id: string,
  resolvedBy: string,
  resolutionNotes: string
) {
  await requireAdmin()
  uuidSchema.parse(id)

  await db
    .update(demands)
    .set({
      status: "resolved",
      resolvedBy,
      resolutionNotes,
      resolvedAt: new Date(),
    })
    .where(eq(demands.id, id))

  revalidatePath("/admin/demandas")
  revalidatePath("/admin")
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export async function getArticles() {
  await requireAdmin()

  return db.select().from(articles).orderBy(desc(articles.createdAt))
}

export async function createArticle(data: {
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  category: string
  imageUrl?: string
}) {
  await requireAdmin()
  const validated = createArticleSchema.parse(data)

  await db.insert(articles).values({
    title: validated.title,
    slug: validated.slug,
    excerpt: validated.excerpt,
    content: validated.content,
    author: validated.author,
    category: validated.category,
    imageUrl: validated.imageUrl || null,
    isPublished: false,
    isFeatured: false,
  })

  revalidatePath("/admin/artigos")
  revalidatePath("/artigos")
  revalidatePath("/")
}

export async function updateArticle(
  id: string,
  data: {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    author?: string
    category?: string
    imageUrl?: string
  }
) {
  await requireAdmin()
  uuidSchema.parse(id)
  const validated = updateArticleSchema.parse(data)

  await db
    .update(articles)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(articles.id, id))

  revalidatePath("/admin/artigos")
  revalidatePath("/artigos")
  revalidatePath("/")
}

export async function toggleArticlePublish(id: string, isPublished: boolean) {
  await requireAdmin()
  uuidSchema.parse(id)

  await db
    .update(articles)
    .set({
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))

  revalidatePath("/admin/artigos")
  revalidatePath("/artigos")
  revalidatePath("/")
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export async function getNewsItems() {
  await requireAdmin()

  return db.select().from(news).orderBy(desc(news.publishedAt))
}

export async function toggleNewsActive(id: string, isActive: boolean) {
  await requireAdmin()
  uuidSchema.parse(id)

  await db
    .update(news)
    .set({ isActive })
    .where(eq(news.id, id))

  revalidatePath("/admin/noticias")
  revalidatePath("/noticias")
  revalidatePath("/")
}
