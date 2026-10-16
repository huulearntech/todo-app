import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ProductivitySkeleton() {
  return (
    <div className="w-full section-stack">
      {/* Hero Header Skeleton */}
      <div className="page-header-row">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-8 w-56 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
      </div>

      {/* Goal Targets Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>

      {/* Main Chart Section Skeleton */}
      <Card className="rounded-2xl border border-border/70 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-44 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl self-start sm:self-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-[360px] w-full rounded-xl" />
      </Card>
    </div>
  );
}
