import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-baseline justify-between pb-3 border-b border-border/40">
        <div className="flex items-baseline gap-2.5">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <Skeleton className="h-4 w-14 rounded-md" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
