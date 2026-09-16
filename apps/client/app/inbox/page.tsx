import AddTaskForm from "@/components/(home)/add-task-form"; // TODO: rename
import TempSortableTaskList from "./temp-sortable-task-list"; // TODO: remove this after implementing drag-and-drop sorting
import TempNestedList from "./temp-nested-list"; // TODO: remove this after implementing drag-and-drop sorting

export default function InboxPage() {
  return (
    <main>
      <h1>Inbox Page</h1>
      <TempSortableTaskList />
      {/* <TempNestedList /> */}
      <AddTaskForm />
    </main>
  );
}