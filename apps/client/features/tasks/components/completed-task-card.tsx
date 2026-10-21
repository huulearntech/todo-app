import { memo, useMemo } from "react";
import type { CompletedOccurrenceResponseDto } from "@todo/shared";
import { useToggleTaskComplete } from "@/features/tasks/hooks/use-toggle-task-complete";
import { useDeleteOccurrence } from "@/features/tasks/hooks/use-delete-occurrence";
import { useLabels, EMPTY_LABELS } from "@/features/labels/hooks/use-labels";
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
import { useModalStore } from "@/providers/MyStoreProvider";

export interface CompletedTaskCardProps {
  occurrence: CompletedOccurrenceResponseDto;
}

function formatCompletedAt(dateString?: string | null): string | undefined {
  if (!dateString) return undefined;
  const date = new Date(dateString);
  const now = new Date();
  const includeYear = date.getFullYear() !== now.getFullYear();

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * CompletedTaskCard represents a completed task occurrence in the completed tasks list.
 * It displays completion date & time, restoration controls, label tooltips, and deletion actions.
 */
function CompletedTaskCard({
  occurrence,
}: CompletedTaskCardProps) {
  const openModal = useModalStore((state) => state.openModal);
  const toggleCompleteMutation = useToggleTaskComplete();
  const deleteOccurrenceMutation = useDeleteOccurrence();
  const { data: allLabels = EMPTY_LABELS } = useLabels();

  const labelsMap = useMemo(
    () => new Map(allLabels.map((l) => [l.id, l])),
    [allLabels]
  );

  const resolvedLabels = useMemo(() => {
    if (!occurrence.labels || occurrence.labels.length === 0) return [];
    return occurrence.labels
      .map((l) => labelsMap.get(l.id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l));
  }, [occurrence.labels, labelsMap]);

  const visibleLabel = resolvedLabels[0];
  const remainingLabels = resolvedLabels.slice(1);

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

  const completedDateTime = formatCompletedAt(occurrence.completedAt);

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
                    "border-emerald-600 bg-emerald-600 text-white",
                    "data-checked:bg-emerald-600 data-checked:border-emerald-600 data-checked:text-white",
                    "dark:border-emerald-500 dark:bg-emerald-600",
                    "dark:data-checked:bg-emerald-600 dark:data-checked:border-emerald-500 dark:data-checked:text-white",
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
            <span className="item-title truncate">
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
            <p className="helper-text truncate mt-0.5">
              {occurrence.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center flex-wrap gap-2 caption-text text-muted-foreground/70 mt-1">
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

            {visibleLabel && (() => {
              const labelConfig = getColorConfig(visibleLabel.colorKey);
              return (
                <span
                  key={visibleLabel.id}
                  className={cn(
                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0",
                    labelConfig.badgeBgClass,
                    labelConfig.badgeTextClass
                  )}
                >
                  <TagIcon className="size-2.5 shrink-0" />
                  <span className="truncate max-w-[90px]">{visibleLabel.name}</span>
                </span>
              );
            })()}

            {remainingLabels.length > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground hover:bg-muted/80 cursor-default shrink-0">
                      +{remainingLabels.length}
                    </span>
                  }
                />
                <TooltipContent className="flex flex-col gap-1 p-2 text-xs">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Additional Labels
                  </span>
                  {remainingLabels.map((l) => (
                    <span key={l.id} className="flex items-center gap-1.5 font-medium">
                      <TagIcon className="size-3 text-muted-foreground shrink-0" />
                      {l.name}
                    </span>
                  ))}
                </TooltipContent>
              </Tooltip>
            )}

            {completedDateTime && (
              <span
                className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium ml-auto shrink-0"
                title={`Completed on ${completedDateTime}`}
              >
                <CheckCircle2Icon className="size-3 shrink-0" />
                {completedDateTime}
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
              openModal({
                type: "delete-task",
                task: {
                  id: occurrence.id,
                  title: occurrence.title,
                },
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
