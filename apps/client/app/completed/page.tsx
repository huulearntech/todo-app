"use client";

import { useMemo, useState } from "react";
import { useCompletedTasks } from "@/hooks/tasks/use-completed-tasks";
import { useDeleteTask } from "@/hooks/tasks/use-delete-task";
import CompletedTaskCard from "@/components/(home)/completed-task-card";
import { Badge } from "@/components/reui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2Icon,
  CalendarCheck2Icon,
} from "lucide-react";
import type { CompletedOccurrenceResponseDto } from "@todo/shared";

function getDateGroupKey(dateString?: string | null): string {
  if (!dateString) return "Earlier";
  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return "Earlier this week";
  if (diffDays < 14) return "Last week";

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function CompletedTasksPage() {
  const { data: occurrences = [], isLoading, error } = useCompletedTasks();
  const deleteTaskMutation = useDeleteTask();

  // State for permanent deletion dialog
  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Group completed occurrences by date
  const groupedOccurrences = useMemo(() => {
    const groups: Record<string, CompletedOccurrenceResponseDto[]> = {};

    // Sort by completedAt descending
    const sorted = [...occurrences].sort((a, b) => {
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return timeB - timeA;
    });

    for (const occ of sorted) {
      const groupKey = getDateGroupKey(occ.completedAt);
      (groups[groupKey] ??= []).push(occ);
    }

    return groups;
  }, [occurrences]);

  const handleConfirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto">
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3.5 pb-4 border-b border-border/60">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-md" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto">
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-6">
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm">
            Failed to load completed tasks. Please try refreshing the page.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-0 min-w-0 h-full overflow-y-auto">
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <CalendarCheck2Icon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Completed
                </h1>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                >
                  {occurrences.length}{" "}
                  {occurrences.length === 1 ? "task" : "tasks"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Review history, restore incomplete tasks, or delete completed records.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {occurrences.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border/70 text-center bg-card/40 my-4">
            <div className="p-3.5 rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
              <CheckCircle2Icon className="size-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No completed tasks yet
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
              When you complete tasks or occurrences from your projects or today&apos;s
              list, they will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(groupedOccurrences).map(([groupTitle, items]) => (
              <div key={groupTitle} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {groupTitle}
                  </span>
                  <span className="text-xs text-muted-foreground/60 font-medium">
                    ({items.length})
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {items.map((occ) => (
                    <CompletedTaskCard
                      key={occ.occurrenceId}
                      occurrence={occ}
                      onDeleteTaskPermanently={setTaskToDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Dialog for Permanent Task Deletion */}
        <AlertDialog
          open={Boolean(taskToDelete)}
          onOpenChange={(open) => {
            if (!open) setTaskToDelete(null);
          }}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task Permanently</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete &ldquo;
                {taskToDelete?.title}&rdquo;? This will remove the task, all its
                occurrences, and reminder history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteTask}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
