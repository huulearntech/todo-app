import DndKanban from "@/features/tasks/components/dnd-kanban";
import { requireUser } from "@/lib/server/auth";

export default async function InboxPage() {
  const user = await requireUser("/inbox");

  if (!user.defaultProjectId) {
    return (
      <div className="flex-1 min-h-0 min-w-0 h-full flex items-center justify-center p-6 text-sm text-muted-foreground">
        No default project found for your inbox.
      </div>
    );
  }

  return <DndKanban projectId={user.defaultProjectId} />;
}