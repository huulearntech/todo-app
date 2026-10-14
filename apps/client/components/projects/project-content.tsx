"use client";

import DndKanban from "@/components/(home)/dnd-kanban";
import { UpcomingEventCalendar } from "@/components/upcoming/upcoming-event-calendar";
import { useProjectView } from "@/components/projects/project-view-context";

export default function ProjectContent({ projectId }: { projectId: string }) {
  const { view } = useProjectView();

  return view === "kanban" ? (
    <DndKanban projectId={projectId} />
  ) : (
    <UpcomingEventCalendar projectId={projectId} />
  );
}
