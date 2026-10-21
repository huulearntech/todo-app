"use client";

import { useEffect, useRef, useState } from "react"
import {
  EventCalendar,
  type EventCalendarApi,
} from "@/components/reui/event-calendar/event-calendar"
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content"
import {
  EventCalendarNav,
  EventCalendarToolbar,
} from "@/components/reui/event-calendar/event-calendar-nav"
import {
  mapTaskToCalendarEvent,
  DEFAULT_CALENDAR_SETTINGS,
  type CalendarSettings,
} from "../utils/calendar-event-mapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusIcon } from "lucide-react"
import type { TaskResponseDto as Task } from "@todo/shared"
import {
  useProjectCalendarEvents,
  EMPTY_CALENDAR_EVENTS,
} from "../hooks/use-project-calendar-events"
import { useEnsureTaskSection } from "@/features/sections/hooks/use-ensure-task-section"
import { useUpdateCalendarEvent } from "@/features/tasks/hooks/use-update-calendar-event"
import { useModalStore } from "@/providers/MyStoreProvider"

export function UpcomingEventCalendar({ projectId }: { projectId: string }) {
  const openModal = useModalStore((state) => state.openModal);

  const apiRef = useRef<EventCalendarApi<Task> | null>(null);
  const isDragUpdatingRef = useRef(false);

  const { data: calendarEvents = EMPTY_CALENDAR_EVENTS } =
    useProjectCalendarEvents(projectId);
  const { getOrCreateSectionId } = useEnsureTaskSection(projectId);

  const handleNewTask = async () => {
    const targetSectionId = await getOrCreateSectionId();
    if (targetSectionId) {
      openModal({ type: "add-task", projectId, sectionId: targetSectionId });
    }
  };

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

  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_CALENDAR_SETTINGS)

  const patch = (partial: Partial<CalendarSettings>) =>
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

              openModal({ type: "edit-task", task: occurence.event.data });
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