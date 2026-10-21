"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProjectCompletedTasks, EMPTY_COMPLETED_OCCURRENCES } from "@/features/tasks/hooks/use-project-completed-tasks";
import CompletedTaskCard from "@/features/tasks/components/completed-task-card";
import { KanbanFilterBar } from "@/features/tasks/components/kanban-filter-bar";
import {
  useTaskFilters,
  TaskFiltersProvider,
} from "@/features/tasks/hooks/use-task-filters";
import { groupOccurrencesByDate } from "@/features/tasks/utils/task-date-grouping";
import {
  ProjectCompletedEmptyState,
  ProjectCompletedFilteredEmptyState,
} from "./project-completed-empty-state";
import { Button } from "@/components/ui/button";
import { ProjectCompletedTasksSkeleton } from "./project-completed-tasks-skeleton";
import { ArrowLeftIcon } from "lucide-react";
import type { CompletedOccurrenceResponseDto } from "@todo/shared";

export interface ProjectCompletedTasksProps {
  projectId: string;
  backHref: string;
  backLabel?: string;
}

export interface ProjectCompletedTasksContentProps {
  groupedOccurrences: Record<string, CompletedOccurrenceResponseDto[]>;
  hasAnyOccurrences: boolean;
  backHref: string;
  backLabel: string;
}

export function ProjectCompletedTasksContent({
  groupedOccurrences,
  hasAnyOccurrences,
  backHref,
  backLabel,
}: ProjectCompletedTasksContentProps) {
  if (!hasAnyOccurrences) {
    return (
      <ProjectCompletedEmptyState
        backHref={backHref}
        backLabel={backLabel}
      />
    );
  }

  const hasFilteredOccurrences = Object.values(groupedOccurrences).some(
    (items) => items.length > 0
  );

  if (!hasFilteredOccurrences) {
    return <ProjectCompletedFilteredEmptyState />;
  }

  return (
    <>
      {Object.entries(groupedOccurrences).map(([dateGroup, items]) => (
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
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ProjectCompletedTasksInner({
  projectId,
  backHref,
  backLabel = "Back to active tasks",
}: ProjectCompletedTasksProps) {
  const { data: occurrences = EMPTY_COMPLETED_OCCURRENCES, isLoading, error } =
    useProjectCompletedTasks(projectId);

  const { matchesFilters } = useTaskFilters();

  // Filter completed occurrences based on search query, priorities and labels
  const filteredOccurrences = useMemo(() => {
    return occurrences.filter((occ) => matchesFilters(occ));
  }, [occurrences, matchesFilters]);

  // Group filtered completed occurrences by date
  const groupedOccurrences = useMemo(() => {
    return groupOccurrencesByDate(filteredOccurrences);
  }, [filteredOccurrences]);

  if (isLoading) {
    return <ProjectCompletedTasksSkeleton />;
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
        totalCount={occurrences.length}
        filteredCount={filteredOccurrences.length}
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
          <ProjectCompletedTasksContent
            groupedOccurrences={groupedOccurrences}
            hasAnyOccurrences={occurrences.length > 0}
            backHref={backHref}
            backLabel={backLabel}
          />
        </div>
      </main>
    </div>
  );
}

export default function ProjectCompletedTasks(props: ProjectCompletedTasksProps) {
  return (
    <TaskFiltersProvider>
      <ProjectCompletedTasksInner {...props} />
    </TaskFiltersProvider>
  );
}
