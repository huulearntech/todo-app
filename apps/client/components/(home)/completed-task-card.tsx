import { memo, useMemo } from "react";
import type { CompletedOccurrenceResponseDto } from "@todo/shared";
import { useToggleTaskComplete } from "@/hooks/tasks/use-toggle-task-complete";
import { useDeleteOccurrence } from "@/hooks/tasks/use-delete-occurrence";
import { useLabels } from "@/hooks/labels/use-labels";
import { getColorConfig } from "@/lib/color-palette";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2Icon,
  RotateCcwIcon,
  Trash2Icon,
  MoreHorizontalIcon,
  HashIcon,
  TagIcon,
  RepeatIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CompletedTaskCardProps {
  occurrence: CompletedOccurrenceResponseDto;
  onDeleteTaskPermanently?: (task: { id: string; title: string }) => void;
}

/**
 * CompletedTaskCard represents a completed task occurrence in the completed tasks list.
 * It displays completion timestamp details, restoration controls, and deletion actions.
 */
function CompletedTaskCard({
  occurrence,
  onDeleteTaskPermanently,
}: CompletedTaskCardProps) {
  const toggleCompleteMutation = useToggleTaskComplete();
  const deleteOccurrenceMutation = useDeleteOccurrence();
  const { data: allLabels = [] } = useLabels();

  const labelsMap = useMemo(
    () => new Map(allLabels.map((l) => [l.id, l])),
    [allLabels]
  );

  const isLatest = occurrence.isLatestOccurrence ?? true;

  const handleUncomplete = () => {
    toggleCompleteMutation.mutate({
      task: occurrence,
      checked: false,
      occurrenceId: occurrence.occurrenceId,
    });
  };

  const handleDeleteOccurrence = () => {
    deleteOccurrenceMutation.mutate(occurrence.occurrenceId);
  };

  const completedTime = occurrence.completedAt
    ? new Date(occurrence.completedAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : undefined;

  return (
    <div className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card hover:border-border transition-all duration-150">
      {/* Left: Checkbox & Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <div>
                <Checkbox
                  checked={true}
                  disabled={!isLatest}
                  onCheckedChange={handleUncomplete}
                  className={cn(
                    "rounded-full size-5 border-2 transition-colors",
                    "data-checked:bg-emerald-500 data-checked:border-emerald-500 data-checked:text-white",
                    !isLatest && "cursor-not-allowed opacity-40"
                  )}
                  aria-label={`Uncomplete "${occurrence.title}"`}
                />
              </div>
            }
          />
          <TooltipContent side="top" className="text-xs">
            {isLatest
              ? "Click to mark as incomplete (restore)"
              : "Only the latest occurrence of a recurring task can be uncompleted"}
          </TooltipContent>
        </Tooltip>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium line-through text-muted-foreground truncate">
              {occurrence.title}
            </span>
            {Boolean(occurrence.recurrence) && (
              <RepeatIcon
                className="size-3.5 text-muted-foreground/70 shrink-0"
                aria-label="Recurring task"
              />
            )}
          </div>

          {occurrence.description && (
            <p className="text-xs text-muted-foreground/70 line-through truncate mt-0.5">
              {occurrence.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center flex-wrap gap-2 text-[11px] text-muted-foreground/70 mt-1">
            {occurrence.section?.project?.name && (
              <span className="flex items-center gap-1 font-medium text-foreground/70 truncate max-w-[140px]">
                <HashIcon className="size-3 shrink-0 text-muted-foreground" />
                {occurrence.section.project.name}
              </span>
            )}
            {occurrence.section?.name && (
              <span className="truncate max-w-[120px]">
                / {occurrence.section.name}
              </span>
            )}
            {occurrence.labels && occurrence.labels.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {occurrence.labels.map((l) => {
                  const label = labelsMap.get(l.id);
                  if (!label) return null;
                  const labelConfig = getColorConfig(label.colorKey);
                  return (
                    <span
                      key={l.id}
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${labelConfig.badgeBgClass} ${labelConfig.badgeTextClass}`}
                    >
                      <TagIcon className="size-2.5 shrink-0" />
                      {label.name}
                    </span>
                  );
                })}
              </div>
            )}
            {completedTime && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-medium ml-auto">
                <CheckCircle2Icon className="size-3 shrink-0" />
                Done {completedTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-7 rounded-md opacity-60 group-hover:opacity-100 transition-opacity"
              aria-label="Options"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            disabled={!isLatest}
            onClick={handleUncomplete}
            className="cursor-pointer"
          >
            <RotateCcwIcon className="size-4 mr-2" />
            Restore Task
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDeleteOccurrence}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <Trash2Icon className="size-4 mr-2" />
            Delete Occurrence
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() =>
              onDeleteTaskPermanently?.({
                id: occurrence.id,
                title: occurrence.title,
              })
            }
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2Icon className="size-4 mr-2" />
            Delete Task Permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default memo(CompletedTaskCard);
