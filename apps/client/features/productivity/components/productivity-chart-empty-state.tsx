"use client";

import { CheckCircle2Icon } from "lucide-react";

export function ProductivityChartEmptyState() {
  return (
    <div className="h-[320px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
      <CheckCircle2Icon className="size-12 text-muted/60 mb-2" />
      <p className="text-base font-medium">No tasks completed in the last 7 days</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
        Complete tasks in your projects to see your activity timeline and project breakdowns here.
      </p>
    </div>
  );
}
