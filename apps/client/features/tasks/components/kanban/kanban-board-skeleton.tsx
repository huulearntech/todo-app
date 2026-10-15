"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function KanbanBoardSkeleton() {
  return (
    <div className="flex-1 min-h-0 min-w-0 h-full w-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/40">
        <Skeleton className="h-9 w-64 rounded-xl" />
      </div>
      <div className="flex-1 p-4 flex gap-4 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-80 shrink-0 space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
