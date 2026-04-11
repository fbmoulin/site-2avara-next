import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    answeredAt: timestamp("answered_at"),
    answeredBy: varchar("answered_by", { length: 255 }),
    notes: text("notes"),
  },
  (table) => [
    index("contact_status_idx").on(table.status),
    index("contact_created_idx").on(table.createdAt),
  ]
)

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 20 }).notNull(),
    withWhom: varchar("with_whom", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    oabNumber: varchar("oab_number", { length: 50 }),
    processNumber: varchar("process_number", { length: 50 }).notNull(),
    reason: text("reason").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pre_reserved"),
    preferredDate: timestamp("preferred_date"),
    confirmedDate: timestamp("confirmed_date"),
    zoomLink: varchar("zoom_link", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    confirmedAt: timestamp("confirmed_at"),
    confirmedBy: varchar("confirmed_by", { length: 255 }),
    notes: text("notes"),
  },
  (table) => [
    index("appointment_status_idx").on(table.status),
    index("appointment_process_idx").on(table.processNumber),
  ]
)

export const demands = pgTable(
  "demands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    processNumber: varchar("process_number", { length: 50 }).notNull(),
    demandType: varchar("demand_type", { length: 30 }).notNull(),
    description: text("description").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    priority: varchar("priority", { length: 10 }).notNull().default("normal"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: varchar("resolved_by", { length: 255 }),
    resolutionNotes: text("resolution_notes"),
  },
  (table) => [
    index("demand_status_idx").on(table.status),
    index("demand_process_idx").on(table.processNumber),
  ]
)

export const news = pgTable(
  "news",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    link: varchar("link", { length: 500 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    publishedAt: timestamp("published_at"),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [uniqueIndex("news_external_id_idx").on(table.externalId)]
)

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    author: varchar("author", { length: 255 })
      .notNull()
      .default("2ª Vara Cível de Cariacica"),
    category: varchar("category", { length: 100 })
      .notNull()
      .default("Artigo Jurídico"),
    imageUrl: varchar("image_url", { length: 500 }),
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("articles_slug_idx").on(table.slug)]
)
