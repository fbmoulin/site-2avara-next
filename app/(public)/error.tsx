"use client"

import { RouteError } from "@/components/route-error"

// Public pages (R3.4): rendered inside the public layout, which keeps the menu, the footer and the
// page's only <main>.
export default function PublicError({ error, retry }: { error: unknown; retry: () => void }) {
  return <RouteError error={error} retry={retry} area="public" />
}
