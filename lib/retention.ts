import { lt, sql } from "drizzle-orm"
import { db } from "./db"
import { appointments, contactMessages, demands } from "./db/schema"

/** Retention period for personal data received by the portal (SPEC-PORTAL-001, Q-1 / R3.6; 90 days since 21/11/2026). */
export const RETENTION_DAYS = 90

export interface RetentionCounts {
  contactMessages: number
  appointments: number
  demands: number
}

/**
 * Cutoff evaluated by the database clock. `created_at` is `timestamp` without time zone and is
 * filled by `now()` in the session time zone, so comparing with `now()` in the same session keeps
 * both sides consistent regardless of the server's zone.
 */
const cutoff = sql`now() - ${sql.raw(`interval '${RETENTION_DAYS} days'`)}`

/**
 * Deletes contacts, appointments and demands created before the retention cutoff, in a single
 * transaction, and returns how many rows left each table. Never returns row contents.
 */
export async function purgeExpiredRecords(): Promise<RetentionCounts> {
  return db.transaction(async (tx) => {
    const deletedContacts = await tx
      .delete(contactMessages)
      .where(lt(contactMessages.createdAt, cutoff))
      .returning({ id: contactMessages.id })
    const deletedAppointments = await tx
      .delete(appointments)
      .where(lt(appointments.createdAt, cutoff))
      .returning({ id: appointments.id })
    const deletedDemands = await tx
      .delete(demands)
      .where(lt(demands.createdAt, cutoff))
      .returning({ id: demands.id })
    return {
      contactMessages: deletedContacts.length,
      appointments: deletedAppointments.length,
      demands: deletedDemands.length,
    }
  })
}
