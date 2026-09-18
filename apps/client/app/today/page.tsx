// import TaskList from "@/components/(home)/task-list";
import DndKanban from "@/components/(home)/dnd-kanban";

export default function TodayPage() {
  // NOTE: Today view can only have list view and calendar view, because it is not a project
  return (
    <section>
      {/* <TaskList /> */}
      <DndKanban />
    </section>
  );
}