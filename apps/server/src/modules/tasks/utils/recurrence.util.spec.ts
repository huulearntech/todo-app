import { calculateNextOccurrence } from './recurrence.util';
import { RecurrenceFrequency, Weekday, type RRule } from '@todo/shared';
import { DateTime } from 'luxon';

describe('calculateNextOccurrence with timezone awareness', () => {
  it('correctly handles BYDAY across UTC midnight (Asia/Ho_Chi_Minh Monday 06:00)', () => {
    // Asia/Ho_Chi_Minh is UTC+7.
    // Monday 06:00 AM VN = Sunday 23:00 UTC.
    // 2026-10-12 is Monday. In UTC, that is 2026-10-11T23:00:00.000Z.
    const vnDtstart = DateTime.fromISO('2026-10-12T06:00:00', {
      zone: 'Asia/Ho_Chi_Minh',
    }).toJSDate();

    const rule: RRule = {
      freq: RecurrenceFrequency.WEEKLY,
      interval: 1,
      byWeekday: [{ day: Weekday.MO }],
    };

    const next = calculateNextOccurrence(
      rule,
      vnDtstart,
      vnDtstart,
      'Asia/Ho_Chi_Minh',
    );

    expect(next).not.toBeNull();
    const nextInVn = DateTime.fromJSDate(next!, { zone: 'Asia/Ho_Chi_Minh' });
    // Next occurrence must be next Monday (2026-10-19) at 06:00 AM VN, NOT Tuesday
    expect(nextInVn.toFormat('yyyy-MM-dd HH:mm')).toBe('2026-10-19 06:00');
    expect(nextInVn.weekdayLong).toBe('Monday');
  });

  it('preserves local wall time across Daylight Saving Time transitions (America/New_York)', () => {
    // US Spring forward in 2026 is Sunday, March 8 (2:00 AM -> 3:00 AM).
    // Task daily at 09:00 AM America/New_York.
    const startBeforeDst = DateTime.fromISO('2026-03-07T09:00:00', {
      zone: 'America/New_York',
    }).toJSDate();

    const rule: RRule = {
      freq: RecurrenceFrequency.DAILY,
      interval: 1,
    };

    // March 7 -> March 8
    const occ1 = calculateNextOccurrence(
      rule,
      startBeforeDst,
      startBeforeDst,
      'America/New_York',
    );
    expect(occ1).not.toBeNull();
    const occ1InNy = DateTime.fromJSDate(occ1!, { zone: 'America/New_York' });
    expect(occ1InNy.toFormat('yyyy-MM-dd HH:mm')).toBe('2026-03-08 09:00');

    // March 8 -> March 9 (across DST transition)
    const occ2 = calculateNextOccurrence(
      rule,
      occ1!,
      startBeforeDst,
      'America/New_York',
    );
    expect(occ2).not.toBeNull();
    const occ2InNy = DateTime.fromJSDate(occ2!, { zone: 'America/New_York' });
    expect(occ2InNy.toFormat('yyyy-MM-dd HH:mm')).toBe('2026-03-09 09:00');
  });

  it('correctly handles monthly recurrence on the 31st (skipping February)', () => {
    // Jan 31, 2026 at 10:00 UTC
    const jan31 = DateTime.fromISO('2026-01-31T10:00:00Z').toJSDate();

    const rule: RRule = {
      freq: RecurrenceFrequency.MONTHLY,
      interval: 1,
      byMonthDay: [31],
    };

    const next = calculateNextOccurrence(rule, jan31, jan31, 'UTC');
    expect(next).not.toBeNull();
    const nextUtc = DateTime.fromJSDate(next!, { zone: 'UTC' });
    // February has 28 days in 2026, so next 31st is March 31
    expect(nextUtc.toFormat('yyyy-MM-dd HH:mm')).toBe('2026-03-31 10:00');
  });
});
