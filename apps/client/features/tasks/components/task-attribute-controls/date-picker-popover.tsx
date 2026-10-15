"use client";

import { useState } from "react";
import { format, addDays, startOfWeek, addWeeks, parseISO, isValid } from "date-fns";
import {
  CalendarIcon,
  XIcon,
  SunIcon,
  SunriseIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DatePickerPopoverProps {
  value: { start: string; end: string } | null;
  displayText?: string;
  onChange: (
    timeRange: { start: string; end: string } | null,
    displayText?: string
  ) => void;
  className?: string;
}

export function DatePickerPopover({
  value,
  displayText,
  onChange,
  className,
}: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false);

  // Derive current selected JS date from value.start if available
  const selectedDate: Date | undefined = (() => {
    if (!value?.start) return undefined;
    const d = parseISO(value.start);
    return isValid(d) ? d : undefined;
  })();

  const selectedTime = selectedDate ? format(selectedDate, "HH:mm") : "09:00";

  const handleApplyDate = (date: Date | undefined, timeStr?: string) => {
    if (!date) {
      onChange(null, undefined);
      setOpen(false);
      return;
    }

    const t = timeStr || selectedTime;
    const [hours, minutes] = t.split(":").map(Number);
    const start = new Date(date);
    start.setHours(isNaN(hours) ? 9 : hours, isNaN(minutes) ? 0 : minutes, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

    const formattedDisplay = format(start, "MMM d, h:mm a");
    onChange(
      {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      formattedDisplay
    );
    setOpen(false);
  };

  const handlePreset = (type: "today" | "tomorrow" | "weekend" | "next_week") => {
    const now = new Date();
    let target = new Date();
    switch (type) {
      case "today":
        target = now;
        break;
      case "tomorrow":
        target = addDays(now, 1);
        break;
      case "weekend": {
        // Next Saturday
        const day = now.getDay();
        const diff = day <= 5 ? 6 - day : 6;
        target = addDays(now, diff);
        break;
      }
      case "next_week": {
        // Next Monday
        target = addDays(startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }), 0);
        break;
      }
    }
    handleApplyDate(target);
  };

  const label =
    displayText ||
    (selectedDate ? format(selectedDate, "MMM d, h:mm a") : "Due date");
  const hasValue = Boolean(value?.start);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-7 gap-1.5 px-2.5 rounded-lg text-xs font-normal border-border/60 transition-colors",
              hasValue
                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              className
            )}
          >
            <CalendarIcon
              className={cn("size-3.5", hasValue ? "text-primary" : "text-muted-foreground")}
            />
            <span className="truncate max-w-[140px]">{label}</span>
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null, undefined);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onChange(null, undefined);
                  }
                }}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-primary/20 text-primary/70 hover:text-primary"
                title="Clear date"
              >
                <XIcon className="size-3" />
              </span>
            )}
          </Button>
        }
      />

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto p-2.5 flex flex-col gap-2 rounded-xl shadow-xl border-border/80 bg-popover"
      >
        {/* Quick presets */}
        <div className="grid grid-cols-2 gap-1 pb-1 border-b border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("today")}
            className="justify-start gap-2 h-7 text-xs px-2 font-normal"
          >
            <SunriseIcon className="size-3.5 text-amber-500" />
            <span>Today</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("tomorrow")}
            className="justify-start gap-2 h-7 text-xs px-2 font-normal"
          >
            <SunIcon className="size-3.5 text-blue-500" />
            <span>Tomorrow</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("weekend")}
            className="justify-start gap-2 h-7 text-xs px-2 font-normal"
          >
            <CalendarDaysIcon className="size-3.5 text-indigo-500" />
            <span>This weekend</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("next_week")}
            className="justify-start gap-2 h-7 text-xs px-2 font-normal"
          >
            <CalendarIcon className="size-3.5 text-purple-500" />
            <span>Next week</span>
          </Button>
        </div>

        {/* Calendar Picker */}
        <div className="p-0 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                handleApplyDate(date);
              }
            }}
          />
        </div>

        {/* Time Input & Clear action */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon className="size-3.5" />
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => {
                if (selectedDate) {
                  handleApplyDate(selectedDate, e.target.value);
                }
              }}
              className="h-7 w-24 text-xs px-1.5 py-0"
            />
          </div>

          {hasValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(null, undefined);
                setOpen(false);
              }}
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
            >
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
