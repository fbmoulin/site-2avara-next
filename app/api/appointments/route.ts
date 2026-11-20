import { retiredRouteHandlers } from "@/lib/retired-route"

// Retired (SPEC-PORTAL-001 R1.5). Old records stay in the database and in the admin panel.
export const { GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS } = retiredRouteHandlers()
