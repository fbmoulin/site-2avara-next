import "server-only"
import { eq } from "drizzle-orm"
import { AdminAccessError, authorizeAdmin } from "./admin-policy"
import { db } from "./db"
import { staffUsers } from "./db/schema"

export type StaffRole = "responsavel" | "assessor" | "estagiario"

export async function authorizeStaff<T extends { id: string }>(
  user: T | null,
): Promise<T & { role: StaffRole }> {
  try {
    const owner = authorizeAdmin(user, process.env.ADMIN_USER_IDS)
    return { ...owner, role: "responsavel" }
  } catch (error) {
    // Invalid bootstrap configuration and missing identity must remain fail-closed.
    if (!(error instanceof AdminAccessError) || error.status !== 403) throw error
  }
  if (!user) throw new AdminAccessError(401)
  let record
  try {
    ;[record] = await db
      .select({ role: staffUsers.role, active: staffUsers.active })
      .from(staffUsers)
      .where(eq(staffUsers.id, user.id))
  } catch {
    throw new AdminAccessError(503)
  }
  if (!record?.active || !["assessor", "estagiario"].includes(record.role))
    throw new AdminAccessError(403)
  return { ...user, role: record.role as StaffRole }
}

export function canAccessAdminPath(role: StaffRole, path: string) {
  if (path === "/admin/usuarios" || path.startsWith("/admin/usuarios/"))
    return role === "responsavel"
  if (role === "estagiario")
    return path === "/admin" || path === "/admin/pauta" || path.startsWith("/admin/pauta/")
  return true
}
