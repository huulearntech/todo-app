"use client";

import { useMemo, ReactNode } from "react";
import Link from "next/link";
import { FlagIcon, CheckIcon, XIcon, CheckCircle2Icon, SearchIcon } from "lucide-react";
import { TaskPriority } from "@todo/shared";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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

import { useTaskFilters } from "@/features/tasks/hooks/use-task-filters";

export interface KanbanFilterBarProps {
  totalCount: number;
  filteredCount: number;
  className?: string;
  completedHref?: string;
  rightAction?: ReactNode;
}

export function KanbanFilterBar({
  totalCount,
  filteredCount,
  className,
  completedHref,
  rightAction,
}: KanbanFilterBarProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedPriorities,
    handleTogglePriority,
    selectedLabelIds,
    handleToggleLabel,
    availableLabels,
    handleClearFilters,
  } = useTaskFilters();

  const isFiltered =
    selectedPriorities.length > 0 ||
    selectedLabelIds.length > 0 ||
    Boolean(searchQuery.trim());

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
        {/* In-place search input */}
        <div className="relative w-48 sm:w-56 shrink-0">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="h-7 text-xs pl-8 pr-7 bg-muted/30 border-border/60 rounded-lg placeholder:text-muted-foreground/70"
          />
          {Boolean(searchQuery) && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>

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
                    onClick={() => handleTogglePriority(opt.value)}
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
          onToggleLabel={handleToggleLabel}
        />

        {/* Clear Filters Button */}
        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-lg shrink-0"
          >
            <XIcon className="size-3.5" />
            <span>Clear filters</span>
          </Button>
        )}
      </div>

      {/* End: Task count and Completed / Action link */}
      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
        <span className="text-xs text-muted-foreground font-medium">
          {isFiltered
            ? `${filteredCount} of ${totalCount} ${
                totalCount === 1 ? "task" : "tasks"
              }`
            : `${totalCount} ${totalCount === 1 ? "task" : "tasks"}`}
        </span>

        {completedHref && (
          <>
            <Separator orientation="vertical" />
            <Button
              variant="link"
              size="sm"
              nativeButton={false}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground font-medium gap-1.5 no-underline hover:underline cursor-pointer"
              render={<Link href={completedHref} />}
            >
              <CheckCircle2Icon className="size-3.5 text-emerald-500" />
              <span> View completed tasks</span>
            </Button>
          </>
        )}

        {rightAction && (
          <>
            <Separator orientation="vertical" />
            {rightAction}
          </>
        )}
      </div>
    </div>
  );
}
