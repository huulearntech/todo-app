"use client";

import { CheckCircle2Icon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TodayTasksEmptyStateProps {
  onAddTask: () => void;
}

export function TodayTasksEmptyState({ onAddTask }: TodayTasksEmptyStateProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center select-none">
        <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
          <CheckCircle2Icon className="size-8 stroke-[1.75]" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
          All caught up for today
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 mb-6 leading-relaxed">
          Enjoy your free time, or add a task to plan ahead.
        </p>
        <Button
          type="button"
          onClick={onAddTask}
          className="gap-2 font-medium shadow-xs cursor-pointer"
        >
          <Plus className="size-4" />
          Add task
        </Button>
      </div>
    </div>
  );
}
