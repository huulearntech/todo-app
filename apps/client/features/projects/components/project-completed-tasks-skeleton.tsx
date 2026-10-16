import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCompletedTasksSkeleton() {
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
