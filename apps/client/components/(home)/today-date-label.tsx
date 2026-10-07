"use client";

import { useSyncExternalStore } from "react";

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

export function TodayDateLabel() {
  const formattedDate = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (!formattedDate) {
    return <span className="inline-block h-4 w-20 animate-pulse rounded bg-muted/50 align-baseline" />;
  }

  return (
    <span className="text-xs sm:text-sm font-normal text-muted-foreground tracking-normal align-baseline">
      {formattedDate}
    </span>
  );
}
