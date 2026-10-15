"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

function subscribe() {
  return () => {};
}

function getSnapshot(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getServerSnapshot(): string {
  return "";
}

export function TodayDateLabel({ className }: { className?: string } = {}) {
  const formattedDate = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (!formattedDate) {
    return <span className={cn("inline-block h-4 w-20 animate-pulse rounded bg-muted/50 align-baseline", className)} />;
  }

  return (
    <span className={cn("text-xs sm:text-sm font-normal text-muted-foreground tracking-normal align-baseline", className)}>
      {formattedDate}
    </span>
  );
}
