"use client"

import { RouteError } from "@/components/route-error"

// Panel pages (R3.4): inside the panel layout, which keeps the sidebar and the <main>.
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  return <RouteError error={error} retry={retry} area="admin" />
}
