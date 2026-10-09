"use client";

import { useState, useMemo } from "react";
import { TagIcon, CheckIcon, SearchIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface LabelItem {
  id: string;
  name: string;
  colorHexCode?: string;
}

export interface LabelsPopoverProps {
  selectedLabels: LabelItem[];
  availableLabels: LabelItem[];
  onToggleLabel: (label: LabelItem) => void;
  className?: string;
}

export function LabelsPopover({
  selectedLabels,
  availableLabels,
  onToggleLabel,
  className,
}: LabelsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIds = useMemo(
    () => new Set(selectedLabels.map((l) => l.id)),
    [selectedLabels]
  );

  const filteredLabels = useMemo(() => {
    if (!search.trim()) return availableLabels;
    const q = search.toLowerCase();
    return availableLabels.filter((l) => l.name.toLowerCase().includes(q));
  }, [availableLabels, search]);

  const hasLabels = selectedLabels.length > 0;
  const triggerLabel = !hasLabels
    ? "Labels"
    : selectedLabels.length === 1
    ? `%${selectedLabels[0].name}`
    : `%${selectedLabels[0].name} +${selectedLabels.length - 1}`;

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
              hasLabels
                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              className
            )}
          >
            <TagIcon
              className={cn("size-3.5", hasLabels ? "text-primary" : "text-muted-foreground")}
            />
            <span className="truncate max-w-[140px]">{triggerLabel}</span>
          </Button>
        }
      />

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-56 p-2 flex flex-col gap-2 rounded-xl shadow-xl border-border/80 bg-popover"
      >
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a label..."
            className="h-7 text-xs pl-8 pr-2 bg-muted/30 border-border/60"
          />
        </div>

        <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
          {filteredLabels.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No labels found
            </div>
          ) : (
            filteredLabels.map((label) => {
              const isSelected = selectedIds.has(label.id);
              return (
                <button
                  type="button"
                  key={label.id}
                  onClick={() => onToggleLabel(label)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left",
                    isSelected
                      ? "bg-accent/60 text-accent-foreground font-medium"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="size-2 rounded-full shrink-0 border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: label.colorHexCode || "#888888" }}
                    />
                    <span className="truncate">{label.name}</span>
                  </div>
                  {isSelected && (
                    <CheckIcon className="size-3.5 text-primary stroke-[2.5] shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
