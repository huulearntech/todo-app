"use client";

import { useProjectTasks } from "@/features/tasks/hooks/use-project-tasks";
import { mapTaskToCalendarEvent } from "../utils/calendar-event-mapper";
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types";
import type { TaskResponseDto as Task } from "@todo/shared";

export const EMPTY_CALENDAR_EVENTS: CalendarEvent<Task>[] = [];

export function useProjectCalendarEvents(projectId: string) {
  return useProjectTasks(projectId, {
    select: (tasks) => tasks.map(mapTaskToCalendarEvent),
  });
}
