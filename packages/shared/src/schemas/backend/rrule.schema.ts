import { z } from "zod";

export enum Weekday {
  MO = "MO",
  TU = "TU",
  WE = "WE",
  TH = "TH",
  FR = "FR",
  SA = "SA",
  SU = "SU"
}

export enum RecurrenceFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly"
}

const weekdaySchema = z.object({
  day: z.enum(Weekday),
  ordinal: z.int()
    .min(-53).max(53)
    .refine((val) => val !== 0, { message: "Ordinal cannot be zero." })
    .optional(),
});

const monthDaySchema = z.int()
  .min(-31).max(31)
  .refine((val) => val !== 0, { message: "Month day cannot be zero." });

// NOTE: look at file apps/client/components/reui/event-calendar/event-calendar-types.tsx for the original typescript interface for this schema
// TODO: need more work on this
export const rruleSchema = z.object({
  freq: z.enum(RecurrenceFrequency),
  interval: z.int().positive().optional(),
  count: z.int().positive().optional(),
  until: z.iso.datetime({ offset: true }).optional(),
  byWeekday: weekdaySchema.array().optional(),
  byMonthDay: monthDaySchema.array().optional(),
  byMonth: z.int().min(1).max(12).array().optional(),
  weekStart: z.enum(Weekday).optional(),
  // exDates:    z.array(z.date()).optional(),
  // rDates:     z.array(z.date()).optional()
}).superRefine((value, ctx) => {
  // RFC 5545: COUNT and UNTIL are mutually exclusive.
  if (value.count !== undefined && value.until !== undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['until'],
      message: 'COUNT and UNTIL cannot be used together.',
    });
  }

  // Numeric BYDAY is meaningful for MONTHLY/YEARLY in the subset
  // we're exposing through the application.
  const hasOrdinalByWeekday = value.byWeekday?.some((weekday) => 'ordinal' in weekday && weekday.ordinal !== undefined);

  if (
    hasOrdinalByWeekday &&
    value.freq !== RecurrenceFrequency.MONTHLY &&
    value.freq !== RecurrenceFrequency.YEARLY
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['byWeekday'],
      message: 'Ordinal weekdays are only supported for monthly or yearly recurrence.',
    });
  }

  // Don't allow BYMONTHDAY for weekly recurrence.
  if (
    value.byMonthDay?.length &&
    value.freq === RecurrenceFrequency.WEEKLY
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['byMonthDay'],
      message: 'BYMONTHDAY cannot be used with weekly recurrence.',
    });
  }
});

export type RRule = z.infer<typeof rruleSchema>;
// export interface RecurrenceRule extends RRuleDto {}