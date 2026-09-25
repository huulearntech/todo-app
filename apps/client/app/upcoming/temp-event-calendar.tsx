"use client"

import { useRef, useState } from "react"
import {
  EventCalendar,
  type EventCalendarApi,
  type EventCalendarRenderEventProps,
} from "@/components/reui/event-calendar/event-calendar"
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content"
import {
  EventCalendarNav,
  EventCalendarToolbar,
} from "@/components/reui/event-calendar/event-calendar-nav"
import type {
  CalendarEvent,
  CalendarView,
  EventCalendarInteractions,
  EventCalendarProposedUpdate,
  EventCalendarResource,
  EventCalendarViewSettings,
} from "@/components/reui/event-calendar/event-calendar-types"
import { addDays } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusIcon } from 'lucide-react'
import { useMutation, useQuery } from "@tanstack/react-query"
import { taskService } from "@/services/task.service"
import { useAddTaskDialogStore, useEditTaskDialogStore } from "@/providers/MyStoreProvider"
import { Task } from "@/types/task.type"
import { UpdateTaskOutput } from "@todo/shared/browser"


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

export function TempEventCalendar() {
  const projectId = "9da6157d-8d63-4470-bcdd-f2b5c9064b10";

  const setAddTaskDialogOpen  = useAddTaskDialogStore((state) => state.setDialogIsOpen);
  const setEditTaskDialogOpen = useEditTaskDialogStore((state) => state.setDialogIsOpen);
  const setTaskBeingEdited    = useEditTaskDialogStore((state) => state.setTask);

  const { data: events = [] } = useQuery({
    queryKey: ["tasks", { projectId }],
    queryFn: () => taskService.getTasksByProjectId(projectId),
    select: (tasks) => {
      const calendarEvents: CalendarEvent<Task>[] = tasks.map((task) => {
        const start = task.timeRange ? new Date(task.timeRange.start) : new Date();
        const end = task.timeRange ? new Date(task.timeRange.end) : addDays(start, 1);

        return {
          id: task.id,
          title: task.title,
          start,
          end, // end of this is exclusive. This causes a bit of confusion.
          allDay: !task.timeRange, // If no timeRange, consider it an all-day event.
          data: {
            ...task,
          } as Task,
          // resourceId: task.ownerId, // Assuming ownerId can be used as resourceId
        };
      });
      return calendarEvents;
    },
  });

  // Optimistic update mutation for updating an event
  const updateEventMutation = useMutation({
    mutationFn: (updated: EventCalendarProposedUpdate<Task>) => {
      const { start, end, event: { title, data }} = updated;
      if (!data) {
        throw new Error("Event data is missing for the updated event.");
      }

      const taskToUpdate: UpdateTaskOutput = {
        title,
        description: data.description,
        timeRange: { start: start.toISOString(), end: end.toISOString() },
        priority: data.priority,
        sectionId: data.sectionId,
        // labels: data.labels || [],
      };

      return taskService.updateTask(updated.event.id, taskToUpdate);
    },
    onMutate: async (updated, context) => {
      // Optimistically update the cache
      await context.client.cancelQueries({ queryKey: ["tasks", { projectId }] });

      const previousEvents = context.client.getQueryData<Task[]>(["tasks", { projectId }]);

      if (previousEvents) {
        context.client.setQueryData<Task[]>(["tasks", { projectId }], (oldTasks) =>
          oldTasks?.map((task) =>
            task.id === updated.event.id
              ? {
                  ...task,
                  title: updated.event.title,
                  timeRange: { start: updated.start.toISOString(), end: updated.end.toISOString() },
                }
              : task
          ) || []
        );
      }

      return { previousEvents };
    },
    onError: (_error, _updatedEvent, onMutateResult, context) => {
      // Rollback to previous events on error
      if (onMutateResult?.previousEvents) {
        context.client.setQueryData<Task[]>(["tasks", { projectId }], onMutateResult.previousEvents);
      }
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      // Refetch tasks after mutation
      context.client.invalidateQueries({ queryKey: ["tasks", { projectId }] });
    },
  });
    

  // TODO: might want to display event with no due date as all-day event.
  const apiRef = useRef<EventCalendarApi<Task> | null>(null)
  const [settings, setSettings] = useState<DemoSettings>(DEFAULT_SETTINGS)

  const patch = (partial: Partial<DemoSettings>) =>
    setSettings((current) => ({ ...current, ...partial }))

  return (
      <Card className="w-full py-0">
        <CardContent className="p-0">
          <EventCalendar
            events={events}
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
              updateEventMutation.mutate(update);
            }}
          >
            <div className="flex flex-wrap items-center gap-2 pe-2">
              <EventCalendarNav className="min-w-0 flex-1" />
              <EventCalendarToolbar>
                <Button size="sm" onClick={() => setAddTaskDialogOpen(true)}>
                  <PlusIcon  className="size-4" aria-hidden="true" />
                  New event
                </Button>
              </EventCalendarToolbar>
            </div>
            <EventCalendarContent />
          </EventCalendar>
        </CardContent>
      </Card>
  )
}