import TaskList from "@/components/(home)/task-list";
import TempRRuleForm from "@/components/(home)/temp-rrule-form";

export default function Home() {
  // NOTE: Today view can only have list view and calendar view, because it is not a project
  return (
    <>
      <TaskList />
      <TempRRuleForm />
    </>
  );
}