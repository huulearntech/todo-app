import TaskList from "@/components/(home)/task-list";
import { TodayDateLabel } from "@/components/(home)/today-date-label";
import { CalendarDaysIcon } from "lucide-react";

export default function AuthenticatedHome() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 space-y-6">
      <div className="flex flex-col gap-1.5 border-b border-border/50 pb-4">
        <div className="flex items-center gap-1.5 text-primary font-medium text-xs tracking-wider uppercase">
          <CalendarDaysIcon className="size-3.5" />
          <span>Today</span>
        </div>
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Today
          </h1>
          <TodayDateLabel />
        </div>
      </div>

      <TaskList />
    </div>
  );
}
