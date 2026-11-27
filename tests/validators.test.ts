import { describe, expect, test } from "bun:test"
import { CONTACT_SUBJECTS } from "../lib/constants"
import { BatchSchema, CLIENT_ERRORS_MAX_BYTES, pathnameOnly } from "../lib/client-errors"
import { adminNotesSchema, contactSchema, zoomLinkSchema } from "../lib/validators"

// SPEC-PORTAL-001 R2.7: server-side validation of every input.
const contact = {
  name: "Pessoa Teste",
  phone: "27999999999",
  email: "teste@example.com",
  subject: "outro",
  message: "Mensagem fictícia para teste local.",
}

describe("contact subject", () => {
  test.each(CONTACT_SUBJECTS.map((subject) => subject.value))(
    "accepts the form option %s",
    (subject) => {
      expect(contactSchema.safeParse({ ...contact, subject }).success).toBe(true)
    },
  )
  test("accepts exactly the options listed on the form", () => {
    expect(contactSchema.shape.subject.options).toEqual(
      CONTACT_SUBJECTS.map((subject) => subject.value),
    )
  })
  test.each(["Teste E2E Playwright", "", "OUTRO", "outro ", "<script>"])(
    "rejects %p",
    (subject) => {
      expect(contactSchema.safeParse({ ...contact, subject }).success).toBe(false)
    },
  )
})

describe("contact honeypot", () => {
  test("empty or absent honeypot passes", () => {
    expect(contactSchema.safeParse(contact).success).toBe(true)
    expect(contactSchema.safeParse({ ...contact, website: "" }).success).toBe(true)
  })
  test("filled honeypot is rejected", () => {
    expect(contactSchema.safeParse({ ...contact, website: "https://spam.example" }).success).toBe(
      false,
    )
  })
})

describe("Zoom link", () => {
  test.each([
    "",
    "https://zoom.us/j/123",
    "https://us02web.zoom.us/j/123?pwd=abc",
    "https://app.zoom.com/x",
  ])("accepts %p", (link) => expect(zoomLinkSchema.safeParse(link).success).toBe(true))
  test.each([
    "http://zoom.us/j/123",
    "https://evilzoom.us/j/1",
    "https://zoom.us.evil.com/j/1",
    "https://user:pass@zoom.us/j/1",
    "https://zoom.us:8443/j/1",
    "javascript:alert(1)",
    "zoom.us/j/1",
    `https://zoom.us/j/${"1".repeat(500)}`,
  ])("rejects %p", (link) => expect(zoomLinkSchema.safeParse(link).success).toBe(false))
})

describe("administrative notes", () => {
  test("up to 5000 characters", () => {
    expect(adminNotesSchema.safeParse("a".repeat(5000)).success).toBe(true)
    expect(adminNotesSchema.safeParse("a".repeat(5001)).success).toBe(false)
  })
})

describe("client error reports", () => {
  const entry = {
    level: "error",
    event: "window_onerror",
    timestamp: "2026-11-27T12:00:00.000Z",
    url: "https://2avaraciveldecariacica.org/pauta?nome=Maria#x",
    session_id: "s",
    data: { message: "boom", lineno: 1, email: "maria@example.com", cpf: "000" },
  }
  test("keeps only the allowed detail keys", () => {
    const parsed = BatchSchema.parse({ errors: [entry] })
    expect(Object.keys(parsed.errors[0].data!)).toEqual(["message", "lineno"])
  })
  test("only the pathname of a URL is kept", () => {
    expect(pathnameOnly(entry.url)).toBe("/pauta")
    expect(pathnameOnly("/noticias?x=1")).toBe("/noticias")
    expect(pathnameOnly(undefined)).toBeUndefined()
  })
  test("detail values are bounded and batches have at most 10 entries", () => {
    expect(
      BatchSchema.safeParse({ errors: [{ ...entry, data: { message: "a".repeat(501) } }] }).success,
    ).toBe(false)
    expect(BatchSchema.safeParse({ errors: Array(11).fill(entry) }).success).toBe(false)
    expect(CLIENT_ERRORS_MAX_BYTES).toBe(8192)
  })
})
