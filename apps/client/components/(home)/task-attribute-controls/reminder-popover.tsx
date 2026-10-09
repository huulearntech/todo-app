"use client";

import { useState } from "react";
import { AlarmClockIcon, CheckIcon, XIcon, PlusIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ReminderPopoverProps {
  minuteOffset: number | null | undefined;
  onChange: (offset: number | null) => void;
  hasDueDate?: boolean;
  className?: string;
}

const PRESET_REMINDERS: Array<{
  minuteOffset: number;
  label: string;
}> = [
  { minuteOffset: 0, label: "At time of task" },
  { minuteOffset: 10, label: "10 minutes before" },
  { minuteOffset: 15, label: "15 minutes before" },
  { minuteOffset: 30, label: "30 minutes before" },
  { minuteOffset: 60, label: "1 hour before" },
  { minuteOffset: 120, label: "2 hours before" },
  { minuteOffset: 1440, label: "1 day before" },
];

function getReminderLabel(minutes: number): string {
  if (minutes === 0) return "At time of task";
  if (minutes % 1440 === 0) {
    const d = minutes / 1440;
    return `${d}d before`;
  }
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return `${h}h before`;
  }
  return `${minutes}m before`;
}

export function ReminderPopover({
  minuteOffset,
  onChange,
  hasDueDate = true,
  className,
}: ReminderPopoverProps) {
  const isSet = minuteOffset !== null && minuteOffset !== undefined;
  const [customValue, setCustomValue] = useState("");
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customValue.trim(), 10);
    if (!isNaN(val) && val >= 0) {
      onChange(val);
      setCustomValue("");
      setIsCustomOpen(false);
    }
  };

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
              isSet
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              className
            )}
            title={
              !hasDueDate
                ? "Reminder requires a due date to be scheduled"
                : isSet
                ? `Email reminder: ${getReminderLabel(minuteOffset)}`
                : "Add reminder"
            }
          >
            <AlarmClockIcon
              className={cn(
                "size-3.5",
                isSet
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            />
            <span>{isSet ? getReminderLabel(minuteOffset) : "Reminder"}</span>
          </Button>
        }
      />

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-56 p-1 rounded-xl shadow-xl border-border/80 bg-popover"
      >
        <div className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Email Reminder
        </div>

        {!hasDueDate && (
          <div className="mx-1 mb-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
            Please set a due date or start time first to enable email reminders.
          </div>
        )}

        {PRESET_REMINDERS.map((preset) => {
          const isSelected = isSet && minuteOffset === preset.minuteOffset;
          return (
            <DropdownMenuItem
              key={preset.minuteOffset}
              disabled={!hasDueDate}
              onClick={() => {
                if (!hasDueDate) return;
                onChange(preset.minuteOffset);
                setIsCustomOpen(false);
              }}
              className={cn(
                "flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer",
                !hasDueDate && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2">
                <AlarmClockIcon
                  className={cn(
                    "size-3.5",
                    isSelected ? "text-amber-500" : "text-muted-foreground"
                  )}
                />
                <span>{preset.label}</span>
              </div>
              {isSelected && (
                <CheckIcon className="size-3.5 text-primary stroke-[2.5]" />
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-1" />

        {isCustomOpen && hasDueDate ? (
          <form
            onSubmit={handleApplyCustom}
            className="flex items-center gap-1.5 p-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              type="number"
              min={0}
              placeholder="Minutes..."
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="h-7 text-xs px-2"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              variant="default"
              className="h-7 text-xs px-2.5 shrink-0"
              disabled={!customValue.trim() || isNaN(Number(customValue))}
            >
              Set
            </Button>
          </form>
        ) : (
          <DropdownMenuItem
            disabled={!hasDueDate}
            onClick={(e) => {
              if (!hasDueDate) return;
              e.preventDefault();
              setIsCustomOpen(true);
            }}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg cursor-pointer text-muted-foreground hover:text-foreground",
              !hasDueDate && "opacity-50 cursor-not-allowed"
            )}
          >
            <PlusIcon className="size-3.5" />
            <span>Custom minutes before...</span>
          </DropdownMenuItem>
        )}

        {isSet && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={() => {
                onChange(null);
                setIsCustomOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive rounded-lg cursor-pointer"
            >
              <XIcon className="size-3.5" />
              <span>Clear reminder</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
