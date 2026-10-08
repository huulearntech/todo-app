import { memo } from "react";
import type {
  CompletedOccurrenceResponseDto,
  TaskResponseDto as Task,
} from "@todo/shared";

import {
  Item,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";

import {
  AlarmClockIcon,
  CalendarRangeIcon,
  CheckCircle2Icon,
  HashIcon,
  RepeatIcon,
  TagIcon,
} from "lucide-react";
import { useEditTaskDialogStore } from "@/providers/MyStoreProvider";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { useToggleTaskComplete } from "@/hooks/tasks/use-toggle-task-complete";
import { useTaskLabels } from "@/hooks/labels/use-task-labels";
import { Checkbox } from "../ui/checkbox";

import { cn } from "cn";

const priorityCheckboxStyles: Record<string, string> = {
  high: "border-red-500 dark:border-red-500 not-data-checked:hover:bg-red-500/10 data-checked:bg-red-500 data-checked:border-red-500 dark:data-checked:bg-red-500 dark:data-checked:border-red-500",
  medium: "border-amber-500 dark:border-amber-500 not-data-checked:hover:bg-amber-500/10 data-checked:bg-amber-500 data-checked:border-amber-500 dark:data-checked:bg-amber-500 dark:data-checked:border-amber-500",
  low: "border-blue-500 dark:border-blue-500 not-data-checked:hover:bg-blue-500/10 data-checked:bg-blue-500 data-checked:border-blue-500 dark:data-checked:bg-blue-500 dark:data-checked:border-blue-500",
};

interface TaskCardProps {
  task: Task;
  occurrence?: CompletedOccurrenceResponseDto;
}

function TaskCardInner({ task, occurrence }: TaskCardProps) {
  // TODO: add reminder to the task entity
  const mockTask = {
    reminder: "1 hour before",
  };

  const isCompleted = Boolean(occurrence || task.completedAt);
  const isLatestOccurrence = occurrence?.isLatestOccurrence ?? true;

  const toggleCompleteMutation = useToggleTaskComplete();
  const { data: labels = [] } = useTaskLabels(task);

  const handleCheckedChange = (checked: boolean) => {
    toggleCompleteMutation.mutate({
      task,
      checked,
      occurrenceId: occurrence?.occurrenceId,
    });
  };

  const setTask = useEditTaskDialogStore((state) => state.setTask);
  const setDialogIsOpen = useEditTaskDialogStore(
    (state) => state.setDialogIsOpen,
  );

  const taskDueLocalTime = task.timeRange?.end
    ? new Date(task.timeRange.end).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      })
    : undefined;

  const completedLocalTime = occurrence?.completedAt
    ? new Date(occurrence.completedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      })
    : task.completedAt
      ? new Date(task.completedAt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
        })
      : undefined;

  const checkboxNode = (
    <Checkbox
      checked={isCompleted}
      disabled={isCompleted && !isLatestOccurrence}
      onCheckedChange={handleCheckedChange}
      className={cn(
        "rounded-full size-6 border-2 dark:bg-transparent transition-colors",
        "data-checked:text-white dark:data-checked:text-background",
        isCompleted && !isLatestOccurrence && "cursor-not-allowed opacity-40",
        priorityCheckboxStyles[task.priority] ?? priorityCheckboxStyles.low,
      )}
      onClick={(e) => e.stopPropagation()}
    />
  );

  return (
    <Item
      variant="outline"
      className={cn(
        "group relative text-card-foreground border-border/80 hover:border-primary/50 shadow-xs transition-all rounded-xl p-2.5 cursor-pointer select-none",
        isCompleted &&
          "opacity-60 bg-muted/20 hover:opacity-85 border-border/60 hover:border-border",
      )}
      onClick={() => {
        setTask(task);
        setDialogIsOpen(true);
      }}
    >
      <ItemHeader>
        <div className="space-y-1.5 flex-1 min-w-0 pr-2">
          <ItemTitle
            className={cn(
              "text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2",
              isCompleted &&
                "line-through text-muted-foreground group-hover:text-muted-foreground",
            )}
          >
            {task.title}
          </ItemTitle>

          {task.description && (
            <ItemDescription
              className={cn(
                "text-xs text-muted-foreground line-clamp-2 leading-relaxed",
                isCompleted && "line-through opacity-70",
              )}
            >
              {task.description}
            </ItemDescription>
          )}
        </div>

        {isCompleted && !isLatestOccurrence ? (
          <Tooltip>
            <TooltipTrigger render={<span>{checkboxNode}</span>} />
            <TooltipContent className="rounded-lg text-xs">
              Only the latest completed occurrence can be restored.
            </TooltipContent>
          </Tooltip>
        ) : (
          checkboxNode
        )}
      </ItemHeader>

      <ItemFooter className="pt-1.5 [&_svg]:size-3.5 flex items-center justify-between gap-2 border-t border-border/30 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {isCompleted && completedLocalTime ? (
            <div
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md"
              title={`Completed on ${completedLocalTime}`}
            >
              <CheckCircle2Icon />
              <span className="text-xs font-medium">Done {completedLocalTime}</span>
            </div>
          ) : taskDueLocalTime ? (
            <div className="flex items-center gap-1 text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md">
              <CalendarRangeIcon />
              <span title={taskDueLocalTime} className="text-xs font-medium">
                {taskDueLocalTime}
              </span>
            </div>
          ) : null}

          {task.recurrence && (
            <div
              className="flex items-center gap-1 text-muted-foreground p-1 rounded-md"
              title="Recurring task"
            >
              <RepeatIcon />
            </div>
          )}

          {mockTask.reminder && !isCompleted && (
            <div
              className="flex items-center gap-1 text-muted-foreground p-1 rounded-md"
              title="Reminder set"
            >
              <AlarmClockIcon />
            </div>
          )}

          {labels.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="flex items-center gap-1 text-muted-foreground px-1.5 py-0.5 rounded-md">
                    <TagIcon />
                    <span className="text-xs font-medium">{labels.length}</span>
                  </div>
                }
              />
              <TooltipContent className="rounded-lg text-xs">
                <ul className="flex flex-col gap-1 p-0.5">
                  {labels.map((label) => (
                    <li key={label.id} className="text-xs font-medium">
                      {label.name}
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {task.section?.project?.name && (
          <div className="flex items-center gap-1 text-xs ml-auto shrink-0">
            <span className="truncate max-w-[80px] font-medium">
              {task.section.project.name}
            </span>
            <HashIcon className="size-3 opacity-60" />
          </div>
        )}
      </ItemFooter>
    </Item>
  );
}

export default memo(TaskCardInner);