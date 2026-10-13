import { rrulestr } from 'rrule';
import { formatRRuleString, type RRule } from '@todo/shared';
import { DateTime } from 'luxon';

/**
 * Calculates the next occurrence date after the specified anchor date,
 * respecting the user's wall-clock timezone.
 *
 * @param rule - The structured RRULE POJO.
 * @param anchor - The date after which to find the next occurrence.
 * @param dtstart - The original start time of the task series to preserve time-of-day.
 * @param timezone - The IANA timezone name (e.g. 'Asia/Ho_Chi_Minh', 'America/New_York').
 * @returns The next Date occurrence in UTC, or null if the series has ended.
 */
export function calculateNextOccurrence(
  rule: RRule,
  anchor: Date,
  dtstart?: Date | null,
  timezone = 'UTC',
): Date | null {
  const zone = timezone || 'UTC';
  const start = dtstart ?? anchor;

  const dtstartLocal = DateTime.fromJSDate(start, { zone });
  const anchorLocal = DateTime.fromJSDate(anchor, { zone });

  if (!dtstartLocal.isValid || !anchorLocal.isValid) {
    return null;
  }

  // Convert to floating UTC date where UTC year/month/day/hour/minute/sec match local wall time
  const floatingDtstart = new Date(
    Date.UTC(
      dtstartLocal.year,
      dtstartLocal.month - 1,
      dtstartLocal.day,
      dtstartLocal.hour,
      dtstartLocal.minute,
      dtstartLocal.second,
      dtstartLocal.millisecond,
    ),
  );

  const floatingAnchor = new Date(
    Date.UTC(
      anchorLocal.year,
      anchorLocal.month - 1,
      anchorLocal.day,
      anchorLocal.hour,
      anchorLocal.minute,
      anchorLocal.second,
      anchorLocal.millisecond,
    ),
  );

  const rruleString = formatRRuleString(rule);
  const parsedRule = rrulestr(rruleString, {
    dtstart: floatingDtstart,
  });

  const nextFloating = parsedRule.after(floatingAnchor);
  if (!nextFloating) {
    return null;
  }

  // Convert floating UTC date components back into the specified timezone
  const nextLocal = DateTime.fromObject(
    {
      year: nextFloating.getUTCFullYear(),
      month: nextFloating.getUTCMonth() + 1,
      day: nextFloating.getUTCDate(),
      hour: nextFloating.getUTCHours(),
      minute: nextFloating.getUTCMinutes(),
      second: nextFloating.getUTCSeconds(),
      millisecond: nextFloating.getUTCMilliseconds(),
    },
    { zone },
  );

  return nextLocal.toJSDate();
}
