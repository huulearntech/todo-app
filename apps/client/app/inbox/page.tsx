import DndKanban from "@/components/(home)/dnd-kanban";

export default function InboxPage() {
  return (
    <main className="overflow-x-hidden min-h-0 h-full min-w-0 flex flex-col">
      <DndKanban projectId="9da6157d-8d63-4470-bcdd-f2b5c9064b10" />
    </main>
  );
}