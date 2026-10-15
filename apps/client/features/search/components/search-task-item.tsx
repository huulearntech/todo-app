"use client";

import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { AutocompleteItem } from "@/components/reui/autocomplete";
import { TaskPriority, type SearchTaskResultDto } from "@todo/shared";
import { getColorConfig } from "@/lib/color-palette";
import { cn } from "@/lib/utils";

export type SearchTaskItemData = { itemType: "task" } & SearchTaskResultDto;

export interface SearchTaskItemProps {
  task: SearchTaskItemData;
  onSelect: (task: SearchTaskItemData) => void;
}

export function SearchTaskItem({ task, onSelect }: SearchTaskItemProps) {
  const isCompleted = Boolean(task.completedAt);
  const priorityColor =
    task.priority === TaskPriority.HIGH
      ? "text-red-500"
      : task.priority === TaskPriority.MEDIUM
      ? "text-orange-500"
      : task.priority === TaskPriority.LOW
      ? "text-blue-500"
      : "text-muted-foreground/50";

  return (
    <AutocompleteItem
      value={task}
      onClick={() => onSelect(task)}
      className="group flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-accent/60 transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isCompleted ? (
          <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
        ) : (
          <CircleIcon
            className={cn(
              "size-3.5 shrink-0 transition-transform group-hover:scale-110",
              priorityColor
            )}
          />
        )}
        <span
          className={cn(
            "truncate text-sm font-medium",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </span>
      </div>

      {task.projectName && (
        <div className="flex items-center gap-1.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground bg-muted/60">
          <span
            className={`size-2 rounded-full shrink-0 ${getColorConfig(task.projectColorKey).dotClass}`}
          />
          <span className="max-w-[100px] truncate">
            {task.projectName}
          </span>
        </div>
      )}
    </AutocompleteItem>
  );
}
