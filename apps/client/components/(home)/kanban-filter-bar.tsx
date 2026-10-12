"use client";

import { useMemo } from "react";
import { FlagIcon, CheckIcon, XIcon } from "lucide-react";
import { TaskPriority } from "@todo/shared";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TaskSearchBar from "./task-search-bar";
import {
  LabelsPopover,
  type LabelItem,
} from "./task-attribute-controls/labels-popover";

const priorityOptions: Array<{
  value: TaskPriority;
  level: string;
  name: string;
  colorClass: string;
  badgeBg: string;
}> = [
  {
    value: TaskPriority.HIGH,
    level: "P1",
    name: "Priority 1 (High)",
    colorClass: "text-red-600 dark:text-red-400",
    badgeBg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  },
  {
    value: TaskPriority.MEDIUM,
    level: "P2",
    name: "Priority 2 (Medium)",
    colorClass: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    value: TaskPriority.LOW,
    level: "P3",
    name: "Priority 3 (Low)",
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
];

export interface KanbanFilterBarProps {
  totalCount: number;
  filteredCount: number;
  selectedPriorities: TaskPriority[];
  onTogglePriority: (priority: TaskPriority) => void;
  selectedLabelIds: string[];
  onToggleLabel: (label: LabelItem) => void;
  availableLabels: LabelItem[];
  onClearFilters: () => void;
  className?: string;
}

export function KanbanFilterBar({
  totalCount,
  filteredCount,
  selectedPriorities,
  onTogglePriority,
  selectedLabelIds,
  onToggleLabel,
  availableLabels,
  onClearFilters,
  className,
}: KanbanFilterBarProps) {
  const isFiltered =
    selectedPriorities.length > 0 || selectedLabelIds.length > 0;

  // Derive selected label items from available labels + selectedLabelIds
  const selectedLabels = useMemo(() => {
    if (selectedLabelIds.length === 0) return [];
    const idSet = new Set(selectedLabelIds);
    return availableLabels.filter((l) => idSet.has(l.id));
  }, [availableLabels, selectedLabelIds]);

  // Priority trigger label and styling
  const hasPriorities = selectedPriorities.length > 0;
  const singlePriority =
    selectedPriorities.length === 1
      ? priorityOptions.find((p) => p.value === selectedPriorities[0])
      : null;

  const priorityTriggerText = !hasPriorities
    ? "Priority"
    : singlePriority
    ? singlePriority.level
    : `Priority (${selectedPriorities.length})`;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 border-b border-border/40 bg-background/50 backdrop-blur-xs shrink-0 gap-3 min-w-0 overflow-x-auto",
        className
      )}
    >
      {/* Start: Filter controls */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <TaskSearchBar className="w-48 sm:w-56 shrink-0" />

        {/* Priority Filter Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 gap-1.5 px-2.5 rounded-lg text-xs font-normal border-border/60 transition-colors shrink-0",
                  hasPriorities
                    ? singlePriority
                      ? singlePriority.badgeBg
                      : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <FlagIcon
                  className={cn(
                    "size-3.5",
                    hasPriorities
                      ? singlePriority
                        ? singlePriority.colorClass
                        : "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <span>{priorityTriggerText}</span>
              </Button>
            }
          />
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-52 p-1.5 rounded-xl shadow-xl border-border/80 bg-popover"
          >
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Filter by Priority
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              {priorityOptions.map((opt) => {
                const isSelected = selectedPriorities.includes(opt.value);
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => onTogglePriority(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer",
                      isSelected
                        ? "bg-accent/60 text-accent-foreground font-medium"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FlagIcon className={cn("size-3.5", opt.colorClass)} />
                      <span>{opt.name}</span>
                    </div>
                    {isSelected && (
                      <CheckIcon className="size-3.5 text-primary stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Labels Filter Popover */}
        <LabelsPopover
          selectedLabels={selectedLabels}
          availableLabels={availableLabels}
          onToggleLabel={onToggleLabel}
        />

        {/* Clear Filters Button */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-lg shrink-0"
          >
            <XIcon className="size-3.5" />
            <span>Clear filters</span>
          </Button>
        )}
      </div>

      {/* End: Plain unstyled task count */}
      <div className="text-xs text-muted-foreground font-medium shrink-0 ml-auto">
        {isFiltered
          ? `${filteredCount} of ${totalCount} ${
              totalCount === 1 ? "task" : "tasks"
            }`
          : `${totalCount} ${totalCount === 1 ? "task" : "tasks"}`}
      </div>
    </div>
  );
}
