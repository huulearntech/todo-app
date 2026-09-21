import DndKanban from "@/components/(home)/dnd-kanban";
import TempEditTaskDialog from "./temp-edit-task-dialog";
import AddTaskForm from "@/components/(home)/add-task-form";

export default function InboxPage() {
  return (
    <main className="overflow-x-hidden min-h-0 h-full min-w-0 flex flex-col">
      <DndKanban projectId="9da6157d-8d63-4470-bcdd-f2b5c9064b10" />
      <TempEditTaskDialog />
      <AddTaskForm />
    </main>
  );
}