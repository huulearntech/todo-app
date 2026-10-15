"use client";

import { FlagIcon, CheckIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskPriority } from "@todo/shared";

export interface PriorityMenuProps {
  value: TaskPriority;
  isExplicit?: boolean;
  onChange: (priority: TaskPriority, isExplicit: boolean) => void;
  className?: string;
}

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
    colorClass: "text-red-600 dark:text-red-400 fill-red-500/20",
    badgeBg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  },
  {
    value: TaskPriority.MEDIUM,
    level: "P2",
    name: "Priority 2 (Medium)",
    colorClass: "text-amber-600 dark:text-amber-400 fill-amber-500/20",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    value: TaskPriority.LOW,
    level: "P3",
    name: "Priority 3 (Low)",
    colorClass: "text-blue-600 dark:text-blue-400 fill-blue-500/20",
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
];

export function PriorityMenu({
  value,
  isExplicit = false,
  onChange,
  className,
}: PriorityMenuProps) {
  const currentOption = priorityOptions.find((p) => p.value === value);
  const showActive = isExplicit && currentOption;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-7 gap-1.5 px-2.5 rounded-lg text-xs font-normal border-border/60 transition-colors",
              showActive
                ? currentOption.badgeBg
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              className
            )}
          >
            <FlagIcon
              className={cn(
                "size-3.5",
                showActive ? currentOption.colorClass : "text-muted-foreground"
              )}
            />
            <span>{showActive ? currentOption.level : "Priority"}</span>
          </Button>
        }
      />

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-48 p-1 rounded-xl shadow-xl border-border/80 bg-popover"
      >
        {priorityOptions.map((opt) => {
          const isSelected = isExplicit && value === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value, true)}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FlagIcon className={cn("size-3.5", opt.colorClass)} />
                <span className="font-medium">{opt.name}</span>
              </div>
              {isSelected && <CheckIcon className="size-3.5 text-primary stroke-[2.5]" />}
            </DropdownMenuItem>
          );
        })}

        {isExplicit && (
          <DropdownMenuItem
            onClick={() => onChange(TaskPriority.LOW, false)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground rounded-lg cursor-pointer border-t border-border/40 mt-1"
          >
            <FlagIcon className="size-3.5 text-muted-foreground" />
            <span>Clear priority</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
