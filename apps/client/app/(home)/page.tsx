import TaskList from "@/components/(home)/task-list";
import { CalendarDaysIcon } from "lucide-react";

export default function Home() {
  // FIX: be aware of this shit. This AI have no damn idea about
  // timezone mismatching nor server and client shit.
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 space-y-6">
      <div className="flex flex-col gap-1 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wide uppercase">
          <CalendarDaysIcon className="size-4" />
          <span>Today</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {todayFormatted}
        </h1>
      </div>

      <TaskList />
    </div>
  );
}