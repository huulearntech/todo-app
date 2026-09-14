import AddTaskForm from "@/components/(home)/add-task-form";
import TaskList from "@/components/(home)/task-list";
import DndKanban from "@/components/(home)/dnd-kanban";

export default function Home() {
  return (
    <section>
      <AddTaskForm />

      {/* <TaskList /> */}
      <DndKanban />
    </section>
  );
}