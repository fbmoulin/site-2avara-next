import { Analytics } from "@vercel/analytics/next"

/**
 * Vercel Web Analytics (R3.8), public pages only: app/(admin) never renders it. Without cookies.
 * The script and its endpoint are same-origin (/_vercel/insights/*), already allowed by the
 * public CSP ('self'). Rendered only on Vercel builds: locally the script does not exist and the
 * development build would load an external debug script that the CSP blocks. Collection starts
 * when Web Analytics is enabled in the Vercel project (manual step).
 */
export function WebAnalytics() {
  if (process.env.VERCEL !== "1") return null
  return <Analytics />
}
