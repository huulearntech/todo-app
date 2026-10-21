"use client";

import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTaskFilters } from "@/features/tasks/hooks/use-task-filters";

export interface ProjectCompletedEmptyStateProps {
  backHref: string;
  backLabel: string;
}

export function ProjectCompletedEmptyState({
  backHref,
  backLabel,
}: ProjectCompletedEmptyStateProps) {
  return (
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
        className="rounded-xl mt-4 cursor-pointer"
        nativeButton={false}
        render={<Link href={backHref} />}
      >
        {backLabel}
      </Button>
    </div>
  );
}

export function ProjectCompletedFilteredEmptyState() {
  const { handleClearFilters } = useTaskFilters();

  return (
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
        className="rounded-xl mt-4 cursor-pointer"
        onClick={handleClearFilters}
      >
        Clear all filters
      </Button>
    </div>
  );
}
