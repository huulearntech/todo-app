"use client";

import TaskList from "@/features/tasks/components/task-list";
import { TodayDateLabel } from "@/features/home/components/today-date-label";
import { useDueTodayTasks } from "@/features/tasks/hooks/use-due-today-tasks";

export default function AuthenticatedHome() {
  const { pendingTasks } = useDueTodayTasks();
  const count = pendingTasks.length;

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-baseline justify-between pb-3 border-b border-border/40">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Today
          </h1>
          <TodayDateLabel />
        </div>
        {count > 0 && (
          <span className="text-xs font-medium text-muted-foreground select-none">
            {count} {count === 1 ? "task" : "tasks"}
          </span>
        )}
      </div>

      <TaskList />
    </div>
  );
}

