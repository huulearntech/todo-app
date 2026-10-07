import { rrulestr } from 'rrule';
import { formatRRuleString, type RRule } from '@todo/shared';

/**
 * Calculates the next occurrence date after the specified anchor date.
 *
 * @param rule - The structured RRULE POJO.
 * @param anchor - The date after which to find the next occurrence.
 * @param dtstart - The original start time of the task series to preserve time-of-day.
 * @returns The next Date occurrence, or null if the recurrence rule has ended (e.g. COUNT/UNTIL).
 */
export function calculateNextOccurrence(
  rule: RRule,
  anchor: Date,
  dtstart?: Date | null,
): Date | null {
  const rruleString = formatRRuleString(rule);
  const parsedRule = rrulestr(rruleString, {
    dtstart: dtstart ?? anchor,
  });
  return parsedRule.after(anchor);
}
