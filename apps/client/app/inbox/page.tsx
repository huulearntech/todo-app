import AddTaskForm from "@/components/(home)/add-task-form"; // TODO: rename
// import TempSortableTaskList from "./temp-sortable-task-list"; // TODO: remove this after implementing drag-and-drop sorting
import TempSortableTaskList from "./temp-sortable-task-list copy"; // TODO: remove this after implementing drag-and-drop sorting
import AddSectionForm from "../projects/add-section-form";
import DndKanban from "@/components/(home)/dnd-kanban";

export default function InboxPage() {
  return (
    <main className="w-full">
      <h1>Inbox Page</h1>
      <TempSortableTaskList />
      {/* <AddTaskForm /> */}
      <DndKanban />
      <AddSectionForm projectId="9da6157d-8d63-4470-bcdd-f2b5c9064b10" />
    </main>
  );
}