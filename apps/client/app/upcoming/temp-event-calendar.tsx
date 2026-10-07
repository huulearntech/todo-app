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
import { addDays } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusIcon } from 'lucide-react'
import { useMutation, useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task.service"
import { useAddTaskDialogStore, useEditTaskDialogStore } from "@/providers/MyStoreProvider"
import { TaskResponseDto as Task } from "@todo/shared"
import { UpdateTaskOutput } from "@todo/shared/browser"

import { TaskPriority } from "@todo/shared";

const taskPriorityColorMap: Record<TaskPriority, string> = {
  high: "var(--color-red-500)",
  medium: "var(--color-amber-500)",
  low: "var(--color-blue-500)",
}

function mapTaskToCalendarEvent(task: Task): CalendarEvent<Task> {
  const start = task.timeRange ? new Date(task.timeRange.start) : new Date();
  const end = task.timeRange ? new Date(task.timeRange.end) : addDays(start, 1);

  const recurrence: EventCalendarRecurrenceRule | undefined = task.recurrence
    ? {
        ...task.recurrence,
        until: task.recurrence.until ? new Date(task.recurrence.until) : undefined,
        byWeekday: task.recurrence.byWeekday?.map((w) =>
          w.ordinal !== undefined
            ? { day: w.day as EventCalendarWeekday, ordinal: w.ordinal }
            : (w.day as EventCalendarWeekday)
        ),
        weekStart: task.recurrence.weekStart as EventCalendarWeekday | undefined,
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
  const setEditTaskDialogOpen = useEditTaskDialogStore((state) => state.setDialogIsOpen);
  const setTaskBeingEdited = useEditTaskDialogStore((state) => state.setTask);

  const apiRef = useRef<EventCalendarApi<Task> | null>(null);
  const isDragUpdatingRef = useRef(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", { projectId }],
    queryFn: () => taskService.getTasksByProjectId(projectId),
  });

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
  const updateEventMutation = useMutation({
    mutationFn: (updated: EventCalendarProposedUpdate<Task>) => {
      const { start, end, event: { title, data } } = updated;
      if (!data) {
        throw new Error("Event data is missing for the updated event.");
      }

      // NOTE: The ReUI calendar uses TZDate, convert to Date before toISOString()
      const startStr = new Date(start).toISOString();
      const endStr = new Date(end).toISOString();

      const taskToUpdate: UpdateTaskOutput = {
        title,
        description: data.description,
        timeRange: { start: startStr, end: endStr },
        priority: data.priority,
        sectionId: data.sectionId,
        labels: data.labels,
      };

      return taskService.updateTask(updated.event.id, taskToUpdate);
    },
    onMutate: async (updated, context) => {
      const previousTasks = context.client.getQueryData<Task[]>(["tasks", { projectId }]);

      const startStr = new Date(updated.start).toISOString();
      const endStr = new Date(updated.end).toISOString();

      // Synchronously update the cache to prevent any microtask lag
      context.client.setQueryData<Task[]>(["tasks", { projectId }], (oldTasks) =>
        oldTasks?.map((task) =>
          task.id === updated.event.id
            ? {
                ...task,
                timeRange: { start: startStr, end: endStr },
              }
            : task
        ) || []
      );

      // Cancel any ongoing queries in the background without blocking cache update
      await context.client.cancelQueries({ queryKey: ["tasks", { projectId }] });

      return { previousTasks };
    },
    onSuccess: (updatedTask, _variables, _onMutateResult, context) => {
      // Sync cache with server response without triggering a full refetch
      context.client.setQueryData<Task[]>(["tasks", { projectId }], (oldTasks) =>
        oldTasks?.map((task) =>
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        ) || []
      );
    },
    onError: (_error, _updatedEvent, onMutateResult, context) => {
      // Rollback to previous tasks on error
      if (onMutateResult?.previousTasks) {
        context.client.setQueryData<Task[]>(["tasks", { projectId }], onMutateResult.previousTasks);
        if (apiRef.current) {
          apiRef.current.setEvents(onMutateResult.previousTasks.map(mapTaskToCalendarEvent));
        }
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
              <Button size="sm" onClick={() => setAddTaskDialogOpen(true)}>
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