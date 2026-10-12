"use client";

import DndKanban from "@/components/(home)/dnd-kanban";
import { UpcomingEventCalendar } from "@/app/upcoming/upcoming-event-calendar";
import { useProjectView } from "./project-view-context";

export default function ProjectContent({ projectId }: { projectId: string }) {
  const { view } = useProjectView();

  return (
    <main className="flex-1 min-h-0 min-w-0 h-full flex flex-col overflow-hidden">
      {view === "kanban" ? (
        <DndKanban projectId={projectId} />
      ) : (
        <div className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto p-4 sm:p-6">
          <UpcomingEventCalendar projectId={projectId} />
        </div>
      )}
    </main>
  );
}
