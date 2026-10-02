import {
  type RRule,
  Weekday,
} from "../schemas/backend/rrule.schema.js"
import { TZDate } from "@date-fns/tz"

export const WEEKDAYS: Weekday[] = [
  Weekday.SU,
  Weekday.MO,
  Weekday.TU,
  Weekday.WE,
  Weekday.TH,
  Weekday.FR,
  Weekday.SA,
]

class EventCalendarRecurrenceError extends Error {
  constructor(part: string) {
    super(
      `Unsupported recurrence part: ${part}. Use the getOccurrences prop to plug a full RRULE engine for exotic rules.`
    )
    this.name = "EventCalendarRecurrenceError"
  }
}

/**
 * Parses a raw RRULE line (with or without the "RRULE:" prefix) into the
 * structured subset. Pass the display time zone so Z-less UNTIL values are
 * interpreted as wall time in that zone rather than the machine zone.
 */
function parseRRuleString(
  input: string,
  timeZone?: string
): RRule {
  const body = input.trim().replace(/^RRULE:/i, "")
  const rule: Partial<RRule> = {}

  for (const pair of body.split(";")) {
    if (!pair) continue
    const [rawKey, rawValue] = pair.split("=")
    const key = rawKey?.toUpperCase()
    const value = rawValue ?? ""

    switch (key) {
      case "FREQ": {
        const freq = value.toLowerCase()
        if (
          freq !== "daily" &&
          freq !== "weekly" &&
          freq !== "monthly" &&
          freq !== "yearly"
        ) {
          throw new EventCalendarRecurrenceError(`FREQ=${value}`)
        }
        rule.freq = freq as RRule["freq"]
        break
      }
      case "INTERVAL":
        rule.interval = Math.max(1, parseInt(value, 10) || 1)
        break
      case "COUNT":
        rule.count = Math.max(1, parseInt(value, 10) || 1)
        break
      case "UNTIL":
        rule.until = parseRRuleDate(value, timeZone).toISOString()
        break
      case "BYDAY":
        rule.byWeekday = value.split(",").map((token) => {
          // RFC 5545 3.1: enumerated values are case-insensitive, and FREQ is
          // already folded above - rejecting "mo" here would be inconsistent
          const match = /^(-?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/.exec(
            token.trim().toUpperCase()
          )
          if (!match) throw new EventCalendarRecurrenceError(`BYDAY=${token}`)
          const day = match[2] as Weekday
          return match[1] ? { day, ordinal: parseInt(match[1], 10) } : { day }
        })
        break
      case "BYMONTHDAY":
        rule.byMonthDay = value.split(",").map((v) => {
          const day = parseInt(v, 10)
          // NaN would survive parsing, match no day in any month and leave the
          // event permanently invisible with no error anywhere
          if (Number.isNaN(day)) {
            throw new EventCalendarRecurrenceError(`BYMONTHDAY=${v}`)
          }
          return day
        })
        break
      case "BYMONTH":
        rule.byMonth = value.split(",").map((v) => parseInt(v, 10))
        break
      case "WKST": {
        const day = value.trim().toUpperCase() as Weekday
        if (!WEEKDAYS.includes(day)) {
          throw new EventCalendarRecurrenceError(`WKST=${value}`)
        }
        rule.weekStart = day
        break
      }
      default:
        throw new EventCalendarRecurrenceError(key ?? pair)
    }
  }

  if (!rule.freq) throw new EventCalendarRecurrenceError("missing FREQ")
  return rule as RRule
}

function parseRRuleDate(value: string, timeZone?: string): Date {
  // RFC 5545 basic formats: YYYYMMDD or YYYYMMDDTHHMMSS(Z). The T and Z
  // designators are case-insensitive too (RFC 5545 3.1), so fold before matching.
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(
    value.trim().toUpperCase()
  )
  if (!match) throw new EventCalendarRecurrenceError(`UNTIL=${value}`)
  const [, y, m, d, hh = "23", mm = "59", ss = "59", z] = match
  // Z-less values (including date-only ones, which mean end of that day
  // inclusive) are wall time in the display zone, not the machine zone.
  const date = z
    ? new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}Z`)
    : timeZone
      ? new Date(new TZDate(+y, +m - 1, +d, +hh, +mm, +ss, timeZone).getTime())
      : new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`)
  if (Number.isNaN(date.getTime())) {
    throw new EventCalendarRecurrenceError(`UNTIL=${value}`)
  }
  return date
}

/** Serializes the structured subset back to an RRULE line (without prefix). */
function formatRRuleString(rule: RRule): string {
  const parts: string[] = [`FREQ=${rule.freq.toUpperCase()}`]
  if (rule.interval && rule.interval > 1)
    parts.push(`INTERVAL=${rule.interval}`)
  if (rule.count) parts.push(`COUNT=${rule.count}`)
  if (rule.until) {
    const u = new Date(rule.until)
    if (Number.isNaN(u.getTime())) {
      throw new EventCalendarRecurrenceError(`UNTIL=${rule.until}`)
    }
    const pad = (n: number) => String(n).padStart(2, "0")
    parts.push(
      `UNTIL=${u.getUTCFullYear()}${pad(u.getUTCMonth() + 1)}${pad(u.getUTCDate())}T${pad(u.getUTCHours())}${pad(u.getUTCMinutes())}${pad(u.getUTCSeconds())}Z`
    )
  }
  if (rule.byWeekday?.length) {
    parts.push(
      `BYDAY=${rule.byWeekday
        .map((d) => (typeof d === "string" ? d : `${d.ordinal}${d.day}`))
        .join(",")}`
    )
  }
  if (rule.byMonthDay?.length)
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(",")}`)
  if (rule.byMonth?.length) parts.push(`BYMONTH=${rule.byMonth.join(",")}`)
  if (rule.weekStart) parts.push(`WKST=${rule.weekStart}`)
  return parts.join(";")
}


export {
  EventCalendarRecurrenceError,
  formatRRuleString,
  parseRRuleString,
}