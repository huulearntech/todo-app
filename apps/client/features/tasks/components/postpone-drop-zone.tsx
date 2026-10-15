"use client";

import { useDroppable } from "@dnd-kit/core";
import { CalendarDaysIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const POSTPONE_DROP_ZONE_ID = "postpone-to-tomorrow";

/**
 * Droppable target zone at the bottom of the list where tasks can be dropped
 * to postpone their due date to tomorrow.
 * Designed to match the dimensions and border radius of a TaskCard.
 */
export function PostponeDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: POSTPONE_DROP_ZONE_ID,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-dashed p-3 min-h-[52px] transition-all duration-200 select-none cursor-pointer mt-1",
        isOver
          ? "border-primary bg-primary/10 text-primary scale-[1.01] shadow-xs"
          : "border-border/60 hover:border-primary/40 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
      )}
    >
      <div
        className={cn(
          "flex size-7 items-center justify-center rounded-lg transition-colors shrink-0",
          isOver
            ? "bg-primary text-primary-foreground shadow-xs"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        <CalendarDaysIcon className="size-3.5" />
      </div>
      <div className="flex flex-col text-left min-w-0">
        <span
          className={cn(
            "text-xs font-medium tracking-tight transition-colors truncate",
            isOver ? "text-primary font-semibold" : "text-foreground"
          )}
        >
          {isOver ? "Release to postpone to tomorrow" : "Postpone to tomorrow"}
        </span>
        <span className="text-[11px] text-muted-foreground truncate">
          Drag any task here to reschedule
        </span>
      </div>
    </div>
  );
}
