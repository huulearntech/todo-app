"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProjectCompletedTasks } from "@/features/tasks/hooks/use-project-completed-tasks";
import { useDeleteTask } from "@/features/tasks/hooks/use-delete-task";
import CompletedTaskCard from "@/features/tasks/components/completed-task-card";
import { KanbanFilterBar } from "@/features/tasks/components/kanban-filter-bar";
import { useTaskFilters } from "@/features/tasks/hooks/use-task-filters";
import { groupOccurrencesByDate } from "@/features/tasks/utils/task-date-grouping";
import { DeleteTaskAlertDialog } from "@/features/tasks/components/delete-task-alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2Icon, ArrowLeftIcon } from "lucide-react";
import type { CompletedOccurrenceResponseDto } from "@todo/shared";

export interface ProjectCompletedTasksProps {
  projectId: string;
  backHref: string;
  backLabel?: string;
}

export default function ProjectCompletedTasks({
  projectId,
  backHref,
  backLabel = "Back to active tasks",
}: ProjectCompletedTasksProps) {
  const { data: occurrences = [], isLoading, error } = useProjectCompletedTasks(projectId);
  const deleteTaskMutation = useDeleteTask();

  const {
    searchQuery,
    setSearchQuery,
    selectedPriorities,
    handleTogglePriority,
    selectedLabelIds,
    handleToggleLabel,
    handleClearFilters,
    availableLabels,
    matchesFilters,
  } = useTaskFilters();

  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Filter completed occurrences based on search query, priorities and labels
  const filteredOccurrences = useMemo(() => {
    return occurrences.filter((occ) => matchesFilters(occ));
  }, [occurrences, matchesFilters]);

  // Group filtered completed occurrences by date
  const groupedOccurrences = useMemo(() => {
    return groupOccurrencesByDate(filteredOccurrences);
  }, [filteredOccurrences]);

  if (isLoading) {
    return (
      <div className="relative flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden flex flex-col">
        <main className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto">
          <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden flex flex-col">
        <main className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto">
          <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-6">
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm">
              Failed to load completed tasks for this project. Please try refreshing the page.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden flex flex-col">
      {/* Pinned Filter Bar */}
      <KanbanFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={occurrences.length}
        filteredCount={filteredOccurrences.length}
        selectedPriorities={selectedPriorities}
        onTogglePriority={handleTogglePriority}
        selectedLabelIds={selectedLabelIds}
        onToggleLabel={handleToggleLabel}
        availableLabels={availableLabels}
        onClearFilters={handleClearFilters}
        rightAction={
          <Button
            variant="link"
            size="sm"
            nativeButton={false}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-medium gap-1.5 no-underline hover:underline cursor-pointer"
            render={<Link href={backHref} />}
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>{backLabel}</span>
          </Button>
        }
      />

      {/* Scrollable Content */}
      <main className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto">
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
          {occurrences.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center py-16">
              <div className="p-3.5 rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
                <CheckCircle2Icon className="size-8" />
              </div>
              <h3 className="empty-state-title">
                No completed tasks yet
              </h3>
              <p className="empty-state-description">
                When you complete tasks or occurrences in this project, they will appear here.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl mt-4"
                nativeButton={false}
                render={<Link href={backHref} />}
              >
                {backLabel}
              </Button>
            </div>
          ) : filteredOccurrences.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center py-16">
              <h3 className="empty-state-title">
                No completed tasks match your filters
              </h3>
              <p className="empty-state-description">
                Try adjusting or clearing your search, priority, or label filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl mt-4"
                onClick={handleClearFilters}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            Object.entries(groupedOccurrences).map(([dateGroup, items]) => (
              <section key={dateGroup} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 px-1">
                  <h2 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    {dateGroup}
                  </h2>
                  <span className="text-[11px] text-muted-foreground/60 font-medium">
                    ({items.length})
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {items.map((occ: CompletedOccurrenceResponseDto) => (
                    <CompletedTaskCard
                      key={occ.occurrenceId}
                      occurrence={occ}
                      onDeleteTaskPermanently={(task) => setTaskToDelete(task)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {/* Permanent Delete Task Dialog */}
      <DeleteTaskAlertDialog
        task={taskToDelete}
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        onConfirm={(task) => deleteTaskMutation.mutate(task.id)}
      />
    </div>
  );
}
