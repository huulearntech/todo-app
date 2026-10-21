"use client";

import { CheckCircle2Icon } from "lucide-react";

export interface LabelTaskEmptyStateProps {
  labelName: string;
}

export function LabelTaskEmptyState({ labelName }: LabelTaskEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border/60 bg-accent/10 p-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent/40 mb-3 text-muted-foreground">
        <CheckCircle2Icon className="size-6" />
      </div>
      <p className="empty-state-title">
        No tasks with this label
      </p>
      <p className="empty-state-description">
        Tasks tagged with &ldquo;{labelName}&rdquo; will appear here automatically.
      </p>
    </div>
  );
}
