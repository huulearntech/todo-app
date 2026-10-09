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
import { useProjectTasks } from "@/hooks/tasks/use-project-tasks"
import { useSections } from "@/hooks/sections/use-sections"
import { useCreateSection } from "@/hooks/sections/use-create-section"
import { useUpdateCalendarEvent } from "@/hooks/tasks/use-update-calendar-event"
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

export function TempEventCalendar({ projectId }: { projectId: string }) {
  const setAddTaskDialogOpen = useAddTaskDialogStore((state) => state.setDialogIsOpen);
  const setSectionId = useAddTaskDialogStore((state) => state.setSectionId);
  const setProjectId = useAddTaskDialogStore((state) => state.setProjectId);
  const setEditTaskDialogOpen = useEditTaskDialogStore((state) => state.setDialogIsOpen);
  const setTaskBeingEdited = useEditTaskDialogStore((state) => state.setTask);

  const createSectionMutation = useCreateSection();

  const apiRef = useRef<EventCalendarApi<Task> | null>(null);
  const isDragUpdatingRef = useRef(false);

  const { data: tasks = [] } = useProjectTasks(projectId);
  const { data: sections = [] } = useSections(projectId);

  const handleNewTask = async () => {
    let targetSectionId = sections[0]?.id || tasks[0]?.sectionId;

    if (!targetSectionId) {
      try {
        const response = await createSectionMutation.mutateAsync({
          projectId,
          name: "Tasks",
        });
        targetSectionId = response.data.id;
      } catch (error) {
        console.error("Failed to ensure section for project:", error);
        toast.add({
          title: "Error",
          description: "Could not find or create a section for this project.",
          type: "error",
        });
        return;
      }
    }

    setProjectId(projectId);
    setSectionId(targetSectionId);
    setAddTaskDialogOpen(true);
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
    <Card className="w-full py-0">
      <CardContent className="p-0">
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
          className="h-[640px] w-full"
          onSlotClick={(slot) => {
            if (apiRef.current) {
              apiRef.current.setView("day");
              apiRef.current.goTo(slot.date);
            }
          }}
          onEventClick={(occurence) => {
            if (!occurence.event.data) {
              console.error("Event data is missing for the clicked event:", occurence.event);
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
          <div className="flex flex-wrap items-center gap-2 pe-2">
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
  )
}