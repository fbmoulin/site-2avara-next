import { expect, test } from "bun:test"
import { currentWeek, scheduleSchema, type Hearing } from "../lib/hearing-schedule"

const hearing: Hearing = {
  date: "2026-10-27",
  time: "14:00",
  type: "Instrução e julgamento",
  modality: "Híbrida",
  reference: "",
}
const parse = (hearings: Hearing[], weekStart = "2026-10-26") =>
  scheduleSchema.safeParse({ weekStart, hearings })

test("publication week changes at Monday midnight in Sao Paulo, not UTC", () => {
  expect(currentWeek(new Date("2026-10-26T02:59:59Z"))).toBe("2026-10-19")
  expect(currentWeek(new Date("2026-10-26T03:00:00Z"))).toBe("2026-10-26")
  expect(currentWeek(new Date("2027-01-01T12:00:00Z"))).toBe("2026-12-28")
})
test("three hourly hearings and exceptional weekdays are accepted", () => {
  expect(parse([14, 15, 16].map((hour) => ({ ...hearing, time: `${hour}:00` }))).success).toBe(true)
  expect(parse([{ ...hearing, date: "2026-10-30", time: "10:00" }]).success).toBe(true)
  expect(parse([]).success).toBe(true)
})
test("overbooked, duplicate and overlapping slots are rejected regardless of order", () => {
  for (const times of [
    ["14:00", "15:00", "16:00", "17:00"],
    ["14:00", "14:00"],
    ["15:00", "14:30"],
  ]) {
    expect(parse(times.map((time) => ({ ...hearing, time }))).success).toBe(false)
  }
})
test("invalid dates, wrong weeks, invalid modalities and extra fields fail closed", () => {
  expect(parse([hearing], "2026-10-27").success).toBe(false)
  for (const date of ["2026-02-30", "2026-10-25", "2026-11-02"])
    expect(parse([{ ...hearing, date }]).success).toBe(false)
  expect(parse([{ ...hearing, time: "24:00" }]).success).toBe(false)
  expect(
    scheduleSchema.safeParse({
      weekStart: "2026-10-26",
      hearings: [{ ...hearing, zoomPassword: "private" }],
    }).success,
  ).toBe(false)
  expect(
    scheduleSchema.safeParse({
      weekStart: "2026-10-26",
      hearings: [{ ...hearing, modality: "Invalid" }],
    }).success,
  ).toBe(false)
})
