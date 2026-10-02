"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskLabelService } from "@/services/task-label.service";
import TaskCard from "@/components/(home)/task-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/reui/badge";
import { TagIcon, CheckCircle2Icon } from "lucide-react";

export default function TempTaskList({ labelId }: { labelId: string }) {
  const { data: labels = [] } = useQuery({
    queryKey: ["task-labels"],
    queryFn: taskLabelService.getMyTaskLabels,
  });

  const label = labels.find((l) => l.id === labelId);

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks", { labelId }],
    queryFn: () => taskService.getMyTasks({ taskLabelIds: [labelId] }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 w-full">
        <div className="flex items-center gap-3.5 pb-3 border-b border-border/60">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-4 w-56 rounded-md" />
          </div>
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm">
        Failed to load tasks for this label.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full py-2">
      {/* Label Detail Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <TagIcon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {label?.name || "Label Tasks"}
              </h1>
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </Badge>
            </div>
            {label?.description ? (
              <p className="text-sm text-muted-foreground mt-0.5">
                {label.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/50 italic mt-0.5">
                No description provided for this label.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border/70 text-center bg-card/40 my-2">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
            <CheckCircle2Icon className="size-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No tasks found with this label
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Assign the <span className="font-medium text-foreground">"{label?.name || "this"}"</span> label to tasks in your projects to see them listed here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 w-full">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}