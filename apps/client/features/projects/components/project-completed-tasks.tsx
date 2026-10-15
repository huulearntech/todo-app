"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProjectCompletedTasks } from "@/features/tasks/hooks/use-project-completed-tasks";
import { useDeleteTask } from "@/features/tasks/hooks/use-delete-task";
import { useLabels } from "@/features/labels/hooks/use-labels";
import CompletedTaskCard from "@/features/tasks/components/completed-task-card";
import { KanbanFilterBar } from "@/features/tasks/components/kanban-filter-bar";
import type { LabelItem } from "@/features/tasks/components/task-attribute-controls/labels-popover";
import { Button } from "@/components/ui/button";
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
  ArrowLeftIcon,
  XIcon,
} from "lucide-react";
import { TaskPriority, type CompletedOccurrenceResponseDto } from "@todo/shared";

const EMPTY_LABELS: LabelItem[] = [];

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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const { data: availableLabels = EMPTY_LABELS } = useLabels();

  // State for permanent deletion dialog
  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleTogglePriority = (priority: TaskPriority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority]
    );
  };

  const handleToggleLabel = (label: LabelItem) => {
    setSelectedLabelIds((prev) =>
      prev.includes(label.id)
        ? prev.filter((id) => id !== label.id)
        : [...prev, label.id]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedPriorities([]);
    setSelectedLabelIds([]);
  };

  // Filter completed occurrences based on search query, priorities and labels
  const filteredOccurrences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return occurrences.filter((occ) => {
      if (q && !occ.title.toLowerCase().includes(q)) {
        return false;
      }
      if (
        selectedPriorities.length > 0 &&
        !selectedPriorities.includes(occ.priority as TaskPriority)
      ) {
        return false;
      }
      if (selectedLabelIds.length > 0) {
        const occLabelIds = new Set(occ.labels?.map((l) => l.id));
        const hasMatchingLabel = selectedLabelIds.some((id) =>
          occLabelIds.has(id)
        );
        if (!hasMatchingLabel) return false;
      }
      return true;
    });
  }, [occurrences, searchQuery, selectedPriorities, selectedLabelIds]);

  // Group filtered completed occurrences by date
  const groupedOccurrences = useMemo(() => {
    const groups: Record<string, CompletedOccurrenceResponseDto[]> = {};

    // Sort by completedAt descending
    const sorted = [...filteredOccurrences].sort((a, b) => {
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return timeB - timeA;
    });

    for (const occ of sorted) {
      const groupKey = getDateGroupKey(occ.completedAt);
      (groups[groupKey] ??= []).push(occ);
    }

    return groups;
  }, [filteredOccurrences]);

  const handleConfirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

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
                className="rounded-xl mt-4 gap-1.5"
                onClick={handleClearFilters}
              >
                <XIcon className="size-3.5" />
                <span>Clear filters</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(groupedOccurrences).map(([groupTitle, items]) => (
                <div key={groupTitle} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="overline-label">
                      {groupTitle}
                    </span>
                    <span className="caption-text font-medium">
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
    </div>
  );
}
