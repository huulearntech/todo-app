import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function UpcomingCalendarSkeleton() {
  return (
    <div className="flex-1 min-h-0 min-w-0 h-full w-full flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden">
      <Card className="w-full h-full flex-1 min-h-0 flex flex-col py-0 shadow-xs border-border/70 overflow-hidden bg-card">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Header Navigation Toolbar Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>

          {/* Calendar Grid Columns Skeleton */}
          <div className="flex-1 min-h-0 grid grid-cols-7 gap-px bg-border/40 p-px overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 p-2 bg-card min-h-0">
                <Skeleton className="h-5 w-16 rounded-md mb-2" />
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
