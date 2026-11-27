"use client"

import { RouteError } from "@/components/route-error"

// Login, access status pages and failures of the panel layout itself (R3.4). Replaces the content
// that would have the <main>, so it renders its own.
export default function AdminGroupError({ error, retry }: { error: unknown; retry: () => void }) {
  return <RouteError error={error} retry={retry} area="admin" withMain />
}
