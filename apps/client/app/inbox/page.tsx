import DndKanban from "@/features/tasks/components/dnd-kanban";
import { requireUser } from "@/lib/server/auth";

export default async function InboxPage() {
  const user = await requireUser("/inbox");

  return <DndKanban projectId={user.defaultProjectId} />;
}