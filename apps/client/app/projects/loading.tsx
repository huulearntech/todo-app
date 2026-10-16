import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { ProjectListSkeleton } from "@/features/projects/components/project-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <StandardPageLayout>
      {/* Header Skeleton */}
      <div className="page-header-row">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-36 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Search Input Skeleton */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Project Cards Skeleton */}
      <ProjectListSkeleton />
    </StandardPageLayout>
  );
}
