import TaskList from "@/components/(home)/task-list";

export default function Home() {
  // NOTE: Today view can only have list view and calendar view, because it is not a project
  // TODO: the list can still be sortable, and can drop the items at the bottom to postpone the task to tomorrow.
  return (
    <section>
      <TaskList />
    </section>
  );
}