"use client";

import DndKanban from "@/features/tasks/components/dnd-kanban";
import { UpcomingEventCalendar } from "@/features/upcoming/components/upcoming-event-calendar";
import { useProjectView } from "@/features/projects/components/project-view-context";

export default function ProjectContent({ projectId }: { projectId: string }) {
  const { view } = useProjectView();

  return view === "kanban" ? (
    <DndKanban projectId={projectId} />
  ) : (
    <UpcomingEventCalendar projectId={projectId} />
  );
}
