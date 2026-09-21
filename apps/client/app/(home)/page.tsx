// import TaskList from "@/components/(home)/task-list";
import DndKanban from "@/components/(home)/dnd-kanban";

export default function Home() {
  // NOTE: Today view can only have list view and calendar view, because it is not a project
  // TODO: the list can still be sortable, and can drop the items at the bottom to postpone the task to tomorrow.
  return (
    <section>
      {/* <TaskList /> */}
      <DndKanban projectId="9da6157d-8d63-4470-bcdd-f2b5c9064b10" />
    </section>
  );
}