"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "cn";
import { CheckCircle2Icon } from "lucide-react";

interface ShowCompletedToggleProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  count?: number;
  className?: string;
}

export function ShowCompletedToggle({
  id = "show-completed-toggle",
  checked,
  onCheckedChange,
  count,
  className,
}: ShowCompletedToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground select-none transition-colors",
        checked && "text-foreground font-medium",
        className
      )}
    >
      <Switch
        id={id}
        size="sm"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-xs flex items-center gap-1.5"
      >
        <CheckCircle2Icon className="size-3.5 opacity-70" />
        <span>Show completed</span>
        {count !== undefined && count > 0 && (
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-normal text-muted-foreground">
            {count}
          </span>
        )}
      </Label>
    </div>
  );
}
