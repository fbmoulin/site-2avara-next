import { track } from "@vercel/analytics"

// Vercel Web Analytics events (SPEC-PORTAL-001 R3.8). No cookies and no personal data: event
// names and fixed values only. Tracking never interferes with the page: a failure is ignored.
export const ANALYTICS_EVENTS = {
  zoomTutorialPlay: "zoom_tutorial_play",
  contactFormSent: "contact_form_sent",
  homeShortcut: "home_shortcut",
} as const

// The four shortcuts planned for the first screen (R3.7, T029). Ready for when they exist.
export const HOME_SHORTCUTS = [
  "tenho_audiencia",
  "consultar_processo",
  "pauta_da_semana",
  "falar_com_a_vara",
] as const
export type HomeShortcut = (typeof HOME_SHORTCUTS)[number]

function safeTrack(name: string, properties?: Record<string, string>) {
  try {
    track(name, properties)
  } catch {
    // Analytics is optional: never break navigation, the video or the contact confirmation.
  }
}

/** The Zoom tutorial video of the "Audiências Virtuais" card started playing. */
export function trackZoomTutorialPlay() {
  safeTrack(ANALYTICS_EVENTS.zoomTutorialPlay)
}

/** The server confirmed (201) a contact message. Only the subject category, never the content. */
export function trackContactFormSent(subject: string) {
  safeTrack(ANALYTICS_EVENTS.contactFormSent, { subject })
}

/** One of the four first-screen shortcuts was used (T029; not wired yet). */
export function trackHomeShortcut(shortcut: HomeShortcut) {
  safeTrack(ANALYTICS_EVENTS.homeShortcut, { shortcut })
}
