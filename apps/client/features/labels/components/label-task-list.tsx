"use client";

import { useLabels } from "@/features/labels/hooks/use-labels";
import { useLabelTasks } from "@/features/tasks/hooks/use-label-tasks";
import TaskCard from "@/features/tasks/components/task-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/reui/badge";
import { TagIcon, CheckCircle2Icon } from "lucide-react";
import { getColorConfig } from "@/lib/color-palette";

export function LabelTaskListSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center gap-3.5 pb-3 border-b border-border/60">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function LabelTaskList({ labelId }: { labelId: string }) {
  const { data: labels = [], isLoading: isLoadingLabels } = useLabels();
  const label = labels.find((l) => l.id === labelId);

  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error,
  } = useLabelTasks(labelId);

  if (isLoadingLabels || (isLoadingTasks && !label)) {
    return <LabelTaskListSkeleton />;
  }

  if (!label) {
    return (
      <div className="p-4 rounded-xl border border-muted bg-muted/20 text-muted-foreground text-sm font-medium">
        Label not found.
      </div>
    );
  }

  const labelConfig = getColorConfig(label.colorKey);

  if (isLoadingTasks) {
    return <LabelTaskListSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm font-medium">
        Failed to load tasks for this label.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full py-2">
      {/* Label Detail Header */}
      <div className="page-header-row">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl shrink-0 border ${labelConfig.badgeBgClass} ${labelConfig.badgeBorderClass} ${labelConfig.badgeTextClass}`}
          >
            <TagIcon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="page-title">
                {label?.name || "Label Tasks"}
              </h1>
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              >
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </Badge>
            </div>
            {label?.description && (
              <p className="page-subtitle">
                {label.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border/60 bg-accent/10 p-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/40 mb-3 text-muted-foreground">
            <CheckCircle2Icon className="size-6" />
          </div>
          <p className="empty-state-title">
            No tasks with this label
          </p>
          <p className="empty-state-description">
            Tasks tagged with "{label.name}" will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="list-stack">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}