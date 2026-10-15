import {
  RecurrenceFrequency,
  Weekday,
  type RRule,
} from "@todo/shared";
import { format, parseISO, isValid } from "date-fns";

export const WEEKDAY_CONFIG = [
  { value: Weekday.MO, short: "Mo", full: "Monday" },
  { value: Weekday.TU, short: "Tu", full: "Tuesday" },
  { value: Weekday.WE, short: "We", full: "Wednesday" },
  { value: Weekday.TH, short: "Th", full: "Thursday" },
  { value: Weekday.FR, short: "Fr", full: "Friday" },
  { value: Weekday.SA, short: "Sa", full: "Saturday" },
  { value: Weekday.SU, short: "Su", full: "Sunday" },
] as const;

export const ORDINAL_CONFIG = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth" },
  { value: -1, label: "Last" },
] as const;

export const MONTH_CONFIG = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

/** Generates human-readable recurrence description */
export function describeRRule(rule: Partial<RRule>): string {
  if (!rule.freq) return "No repeat pattern defined";

  const interval = rule.interval ?? 1;
  let text = "";

  switch (rule.freq) {
    case RecurrenceFrequency.DAILY:
      text = interval === 1 ? "Every day" : `Every ${interval} days`;
      break;

    case RecurrenceFrequency.WEEKLY: {
      const days = rule.byWeekday?.map((w) => {
        const found = WEEKDAY_CONFIG.find((cfg) => cfg.value === w.day);
        return found ? found.short : w.day;
      });
      const daysList = days && days.length > 0 ? ` on ${days.join(", ")}` : "";
      text = interval === 1 ? `Every week${daysList}` : `Every ${interval} weeks${daysList}`;
      break;
    }

    case RecurrenceFrequency.MONTHLY: {
      const every = interval === 1 ? "Monthly" : `Every ${interval} months`;
      if (rule.byWeekday && rule.byWeekday.length > 0) {
        const item = rule.byWeekday[0];
        const ord = ORDINAL_CONFIG.find((o) => o.value === item.ordinal)?.label ?? item.ordinal;
        const day = WEEKDAY_CONFIG.find((d) => d.value === item.day)?.full ?? item.day;
        text = `${every} on the ${ord} ${day}`;
      } else if (rule.byMonthDay && rule.byMonthDay.length > 0) {
        text = `${every} on day ${rule.byMonthDay[0]}`;
      } else {
        text = every;
      }
      break;
    }

    case RecurrenceFrequency.YEARLY: {
      const every = interval === 1 ? "Yearly" : `Every ${interval} years`;
      const monthNum = rule.byMonth?.[0] ?? 1;
      const monthName = MONTH_CONFIG.find((m) => m.value === monthNum)?.label ?? `Month ${monthNum}`;

      if (rule.byWeekday && rule.byWeekday.length > 0) {
        const item = rule.byWeekday[0];
        const ord = ORDINAL_CONFIG.find((o) => o.value === item.ordinal)?.label ?? item.ordinal;
        const day = WEEKDAY_CONFIG.find((d) => d.value === item.day)?.full ?? item.day;
        text = `${every} on the ${ord} ${day} of ${monthName}`;
      } else if (rule.byMonthDay && rule.byMonthDay.length > 0) {
        text = `${every} on ${monthName} ${rule.byMonthDay[0]}`;
      } else {
        text = `${every} in ${monthName}`;
      }
      break;
    }
  }

  if (rule.count) {
    text += `, ${rule.count} ${rule.count === 1 ? "time" : "times"}`;
  } else if (rule.until) {
    try {
      const untilDate = parseISO(rule.until);
      if (isValid(untilDate)) {
        text += `, until ${format(untilDate, "MMM d, yyyy")}`;
      }
    } catch {
      // ignore
    }
  }

  return text;
}

export function createDefaultRRule(value?: Partial<RRule>): RRule {
  return {
    freq: value?.freq ?? RecurrenceFrequency.DAILY,
    interval: value?.interval ?? 1,
    count: value?.count,
    until: value?.until,
    byWeekday: value?.byWeekday ?? [],
    byMonthDay: value?.byMonthDay,
    byMonth: value?.byMonth ?? [1],
    weekStart: value?.weekStart ?? Weekday.MO,
  };
}
