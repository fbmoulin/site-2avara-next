import { notFound } from "next/navigation"

// Any other /admin/... address: the panel's own 404 (not-found.tsx), after proxy.ts and the
// panel layout have checked the session, instead of the root 404 outside the panel (R3.4).
export default function UnknownAdminPage() {
  notFound()
}
