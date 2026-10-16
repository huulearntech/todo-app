import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { AppearanceSkeleton } from "@/features/profile/components/appearance-settings";

export function ProfileSkeleton() {
  return (
    <div className="section-stack animate-pulse">
      {/* Header Skeleton */}
      <div className="page-header-row">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
      </div>

      {/* Profile Card Skeleton */}
      <Card className="rounded-2xl border border-border/60 p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          <Skeleton className="size-20 md:size-24 rounded-full shrink-0" />
          <div className="flex-1 w-full space-y-4 pt-1">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance Card Skeleton */}
      <AppearanceSkeleton />
    </div>
  );
}
