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
import {
  mapTaskToCalendarEvent,
  DEFAULT_CALENDAR_SETTINGS,
  type CalendarSettings,
} from "../utils/calendar-event-mapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusIcon } from "lucide-react"
import { useProjectTasks, EMPTY_TASKS } from "@/features/tasks/hooks/use-project-tasks"
import { useSections, EMPTY_SECTIONS } from "@/features/sections/hooks/use-sections"
import type { TaskResponseDto as Task } from "@todo/shared"
import { useCreateSection } from "@/features/sections/hooks/use-create-section"
import { useUpdateCalendarEvent } from "@/features/tasks/hooks/use-update-calendar-event"
import { toast } from "@/components/ui/toast"
import { useModalStore } from "@/providers/MyStoreProvider"


export function UpcomingEventCalendar({ projectId }: { projectId: string }) {
  const openModal = useModalStore((state) => state.openModal);

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

    openModal({ type: "add-task", projectId, sectionId: targetSectionId });
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