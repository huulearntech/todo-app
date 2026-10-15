// TODO: on creating task with no section, consider make task be able to have no section (!?)

"use client";

import { useEffect, useMemo, useRef, useState } from "react"
import {
  EventCalendar,
  type EventCalendarApi,
} from "@/components/reui/event-calendar/event-calendar"
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content"
import {
  EventCalendarNav,
  EventCalendarToolbar,
} from "@/components/reui/event-calendar/event-calendar-nav"
import type {
  CalendarEvent,
  EventCalendarInteractions,
  EventCalendarProposedUpdate,
  EventCalendarRecurrenceRule,
  EventCalendarViewSettings,
  EventCalendarWeekday,
} from "@/components/reui/event-calendar/event-calendar-types"
import { addDays, startOfDay } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusIcon } from 'lucide-react'
import { useProjectTasks, EMPTY_TASKS } from "@/features/tasks/hooks/use-project-tasks"
import { useSections } from "@/features/projects/hooks/use-sections"
import type { SectionResponseDto } from "@todo/shared"

const EMPTY_SECTIONS: SectionResponseDto[] = [];
import { useCreateSection } from "@/features/projects/hooks/use-create-section"
import { useUpdateCalendarEvent } from "@/features/tasks/hooks/use-update-calendar-event"
import { toast } from "@/components/ui/toast"
import { useAddTaskDialogStore, useEditTaskDialogStore } from "@/providers/MyStoreProvider"
import { TaskResponseDto as Task } from "@todo/shared"

import { TaskPriority } from "@todo/shared";

const taskPriorityColorMap: Record<TaskPriority, string> = {
  high: "var(--color-red-500)",
  medium: "var(--color-amber-500)",
  low: "var(--color-blue-500)",
}

function mapTaskToCalendarEvent(task: Task): CalendarEvent<Task> {
  const fallbackDate = startOfDay(new Date());
  const start = task.timeRange ? new Date(task.timeRange.start) : fallbackDate;
  const end = task.timeRange ? new Date(task.timeRange.end) : addDays(start, 1);

  const rawRecurrence =
    task.recurrence && typeof task.recurrence === "object" && "rrule" in task.recurrence && (task.recurrence as { rrule?: EventCalendarRecurrenceRule }).rrule
      ? { ...task.recurrence, ...(task.recurrence as { rrule?: EventCalendarRecurrenceRule }).rrule }
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

/** Everything the settings panel drives, as one resettable object. */
interface DemoSettings {
  viewSettings: EventCalendarViewSettings
  interactions: EventCalendarInteractions
  weekStartsOn: 0 | 1
  dayStartHour: number
  dayEndHour: number
  interval: number
  snapDuration: number
  eventTooltip: boolean
  showDayAddButton: boolean
  localeId: string
  timeZoneId: string
}

const DEFAULT_SETTINGS: DemoSettings = {
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
}

export function UpcomingEventCalendar({ projectId }: { projectId: string }) {
  const openAddTaskDialog = useAddTaskDialogStore((state) => state.openDialog);
  const setEditTaskDialogOpen = useEditTaskDialogStore((state) => state.setDialogIsOpen);
  const setTaskBeingEdited = useEditTaskDialogStore((state) => state.setTask);

  const createSectionMutation = useCreateSection();

  const apiRef = useRef<EventCalendarApi<Task> | null>(null);
  const isDragUpdatingRef = useRef(false);

  const { data: tasks = EMPTY_TASKS } = useProjectTasks(projectId);
  const { data: sections = EMPTY_SECTIONS } = useSections(projectId);

  const handleNewTask = async () => {
    let targetSectionId = sections[0]?.id || tasks[0]?.sectionId;

    if (!targetSectionId) {
      try {
        const response = await createSectionMutation.mutateAsync({
          projectId,
          name: "Tasks",
        });
        targetSectionId = response.data.id;
      } catch {
        toast.add({
          title: "Error",
          description: "Could not find or create a section for this project.",
          type: "error",
        });
        return;
      }
    }

    openAddTaskDialog({ projectId, sectionId: targetSectionId });
  };

  // NOTE: This part might be optimizable
  const calendarEvents = useMemo(() => {
    return tasks.map(mapTaskToCalendarEvent);
  }, [tasks]);

  // Synchronize external tasks (query fetch, project switch, Add/Edit dialogs) into the calendar
  useEffect(() => {
    if (isDragUpdatingRef.current) {
      isDragUpdatingRef.current = false;
      return;
    }
    if (apiRef.current) {
      apiRef.current.setEvents(calendarEvents);
    }
  }, [calendarEvents]);

  // Optimistic update mutation for updating an event
  const updateEventMutation = useUpdateCalendarEvent(projectId, {
    onRollback: (previousTasks) => {
      if (apiRef.current) {
        apiRef.current.setEvents(previousTasks.map(mapTaskToCalendarEvent));
      }
    },
  });

  const [settings, setSettings] = useState<DemoSettings>(DEFAULT_SETTINGS)

  const patch = (partial: Partial<DemoSettings>) =>
    setSettings((current) => ({ ...current, ...partial }))

  return (
    <div className="flex-1 min-h-0 min-w-0 h-full w-full flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden">
      <Card className="w-full h-full flex-1 min-h-0 flex flex-col py-0 shadow-xs border-border/70 overflow-hidden bg-card">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          <EventCalendar
            defaultEvents={calendarEvents}
            defaultView="week"
            views={["month", "week", "day"]}
            apiRef={apiRef}
            viewSettings={settings.viewSettings}
            onViewSettingsChange={(viewSettings) => patch({ viewSettings })}
            interactions={settings.interactions}
            onInteractionsChange={(interactions) => patch({ interactions })}
            weekStartsOn={1}
            interval={settings.interval}
            snapDuration={settings.snapDuration}
            eventTooltip={settings.eventTooltip}
            showDayAddButton={settings.showDayAddButton}
            offDays
            className="flex-1 min-h-0 h-full w-full"
            onSlotClick={(slot) => {
              if (apiRef.current) {
                apiRef.current.setView("day");
                apiRef.current.goTo(slot.date);
              }
            }}
            onEventClick={(occurence) => {
              if (!occurence.event.data) {
                return;
              }

              setEditTaskDialogOpen(true);
              setTaskBeingEdited(occurence.event.data);
            }}
            onEventUpdate={(update) => {
              isDragUpdatingRef.current = true;
              updateEventMutation.mutate(update);
            }}
          >
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border/60">
              <EventCalendarNav className="min-w-0 flex-1" />
              <EventCalendarToolbar>
                <Button size="sm" onClick={handleNewTask}>
                  <PlusIcon className="size-4" aria-hidden="true" />
                  New task
                </Button>
              </EventCalendarToolbar>
            </div>
            <EventCalendarContent />
          </EventCalendar>
        </CardContent>
      </Card>
    </div>
  )
}