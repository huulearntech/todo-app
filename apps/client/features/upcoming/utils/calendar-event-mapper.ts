import type {
  CalendarEvent,
  EventCalendarInteractions,
  EventCalendarRecurrenceRule,
  EventCalendarViewSettings,
  EventCalendarWeekday,
} from "@/components/reui/event-calendar/event-calendar-types";
import { addDays, startOfDay } from "date-fns";
import { TaskResponseDto as Task, TaskPriority } from "@todo/shared";

export const taskPriorityColorMap: Record<TaskPriority, string> = {
  high: "var(--color-red-500)",
  medium: "var(--color-amber-500)",
  low: "var(--color-blue-500)",
};

export function mapTaskToCalendarEvent(task: Task): CalendarEvent<Task> {
  const fallbackDate = startOfDay(new Date());
  const start = task.timeRange ? new Date(task.timeRange.start) : fallbackDate;
  const end = task.timeRange ? new Date(task.timeRange.end) : addDays(start, 1);

  const rawRecurrence =
    task.recurrence &&
    typeof task.recurrence === "object" &&
    "rrule" in task.recurrence &&
    (task.recurrence as { rrule?: EventCalendarRecurrenceRule }).rrule
      ? {
          ...task.recurrence,
          ...(task.recurrence as { rrule?: EventCalendarRecurrenceRule }).rrule,
        }
      : task.recurrence;

  const recurrence: EventCalendarRecurrenceRule | undefined = rawRecurrence
    ? {
        ...rawRecurrence,
        until: rawRecurrence.until ? new Date(rawRecurrence.until) : undefined,
        byWeekday: rawRecurrence.byWeekday?.map((w: any) =>
          typeof w === "string"
            ? (w as EventCalendarWeekday)
            : w.ordinal !== undefined
              ? { day: w.day as EventCalendarWeekday, ordinal: w.ordinal }
              : (w.day as EventCalendarWeekday)
        ),
        weekStart: rawRecurrence.weekStart as EventCalendarWeekday | undefined,
      }
    : undefined;

  return {
    id: task.id,
    title: task.title,
    start,
    end,
    allDay: !task.timeRange,
    color: task.priority ? taskPriorityColorMap[task.priority] : undefined,
    data: task,
    recurrence,
  };
}

export interface CalendarSettings {
  viewSettings: EventCalendarViewSettings;
  interactions: EventCalendarInteractions;
  weekStartsOn: 0 | 1;
  dayStartHour: number;
  dayEndHour: number;
  interval: number;
  snapDuration: number;
  eventTooltip: boolean;
  showDayAddButton: boolean;
  localeId: string;
  timeZoneId: string;
}

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  viewSettings: {
    weekends: true,
    weekNumbers: false,
    nowIndicator: true,
    offDays: false,
  },
  interactions: { drag: true, resize: true, selectSlot: true },
  weekStartsOn: 0,
  dayStartHour: 0,
  dayEndHour: 24,
  interval: 60,
  snapDuration: 15,
  eventTooltip: false,
  showDayAddButton: false,
  localeId: "en",
  timeZoneId: "local",
};
