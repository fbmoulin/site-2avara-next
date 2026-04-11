"use server"

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

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardStats() {
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
  await db
    .update(appointments)
    .set({
      status: "confirmed",
      confirmedDate: new Date(confirmedDate),
      zoomLink,
      confirmedBy,
      confirmedAt: new Date(),
    })
    .where(eq(appointments.id, id))

  revalidatePath("/admin/agendamentos")
  revalidatePath("/admin")
}

export async function rejectAppointment(id: string, notes: string) {
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
  await db.insert(articles).values({
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    author: data.author,
    category: data.category,
    imageUrl: data.imageUrl || null,
    isPublished: false,
    isFeatured: false,
  })

  revalidatePath("/admin/artigos")
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
  await db
    .update(articles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(articles.id, id))

  revalidatePath("/admin/artigos")
}

export async function toggleArticlePublish(id: string, isPublished: boolean) {
  await db
    .update(articles)
    .set({
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))

  revalidatePath("/admin/artigos")
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export async function getNewsItems() {
  return db.select().from(news).orderBy(desc(news.publishedAt))
}

export async function toggleNewsActive(id: string, isActive: boolean) {
  await db
    .update(news)
    .set({ isActive })
    .where(eq(news.id, id))

  revalidatePath("/admin/noticias")
}
