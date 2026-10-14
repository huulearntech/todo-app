import { memo } from "react";
import type { TaskResponseDto as Task } from "@todo/shared";

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
  HashIcon,
  RepeatIcon,
  TagIcon,
} from "lucide-react";
import { useEditTaskDialogStore } from "@/providers/MyStoreProvider";
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
}

function formatReminderTooltip(
  reminders?: Array<{ minuteOffset?: number | null; type?: string }>
): string {
  if (!reminders || reminders.length === 0) return "";
  return reminders
    .map((r) => {
      if (r.minuteOffset === null || r.minuteOffset === undefined) return "";
      if (r.minuteOffset === 0) return "At time of task";
      if (r.minuteOffset % 1440 === 0) {
        const d = r.minuteOffset / 1440;
        return `${d} ${d === 1 ? "day" : "days"} before`;
      }
      if (r.minuteOffset % 60 === 0) {
        const h = r.minuteOffset / 60;
        return `${h} ${h === 1 ? "hour" : "hours"} before`;
      }
      return `${r.minuteOffset}m before`;
    })
    .filter(Boolean)
    .join(", ");
}

/**
 * TaskCard represents an active (uncompleted) task in Kanban boards and task lists.
 * For completed tasks, use `CompletedTaskCard`.
 */
function TaskCard({ task }: TaskCardProps) {
  const hasReminders = Boolean(task.reminders && task.reminders.length > 0);
  const reminderText = hasReminders ? formatReminderTooltip(task.reminders) : "";

  const toggleCompleteMutation = useToggleTaskComplete();
  const { data: labels = [] } = useTaskLabels(task);

  const handleCheckedChange = (checked: boolean) => {
    toggleCompleteMutation.mutate({
      task,
      checked,
    });
  };

  const setTask = useEditTaskDialogStore((state) => state.setTask);
  const setDialogIsOpen = useEditTaskDialogStore((state) => state.setDialogIsOpen);

  const taskDueLocalTime = task.timeRange?.end
    ? new Date(task.timeRange.end).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      })
    : undefined;

  return (
    <Item
      variant="outline"
      className="group relative text-card-foreground bg-card border-border/80 hover:border-primary/50 shadow-xs transition-all rounded-xl p-2.5 cursor-pointer select-none"
      onClick={() => {
        setTask(task);
        setDialogIsOpen(true);
      }}
    >
      <ItemHeader>
        <div className="space-y-1.5 flex-1 min-w-0 pr-2">
          <ItemTitle className="item-title group-hover:text-primary transition-colors line-clamp-2">
            {task.title}
          </ItemTitle>

          {task.description && (
            <ItemDescription className="helper-text line-clamp-2 leading-relaxed">
              {task.description}
            </ItemDescription>
          )}
        </div>

        <Checkbox
          checked={false}
          onCheckedChange={handleCheckedChange}
          className={cn(
            "rounded-full size-6 border-2 dark:bg-transparent transition-colors",
            "data-checked:text-white dark:data-checked:text-background",
            priorityCheckboxStyles[task.priority] ?? priorityCheckboxStyles.low
          )}
          onClick={(e) => e.stopPropagation()}
        />
      </ItemHeader>

      <ItemFooter className="pt-1.5 [&_svg]:size-3.5 flex items-center justify-between gap-2 border-t border-border/30 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {taskDueLocalTime && (
            <div className="flex items-center gap-1 text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md">
              <CalendarRangeIcon />
              <span title={taskDueLocalTime} className="caption-text font-medium">
                {taskDueLocalTime}
              </span>
            </div>
          )}

          {task.recurrence && (
            <div
              className="flex items-center gap-1 text-muted-foreground p-1 rounded-md"
              title="Recurring task"
            >
              <RepeatIcon />
            </div>
          )}

          {hasReminders && (
            <div
              className="flex items-center gap-1 text-amber-600 dark:text-amber-400 p-1 rounded-md"
              title={`Email reminder: ${reminderText}`}
            >
              <AlarmClockIcon className="size-3.5" />
            </div>
          )}

          {labels.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground px-1.5 py-0.5 rounded-md">
              <TagIcon />
              <span className="caption-text font-medium">{labels.length}</span>
            </div>
          )}
        </div>

        {task.section?.project?.name && (
          <div className="flex items-center gap-1 text-xs ml-auto shrink-0">
            <span className="caption-text truncate max-w-[80px] font-medium">
              {task.section.project.name}
            </span>
            <HashIcon className="size-3 opacity-60" />
          </div>
        )}
      </ItemFooter>
    </Item>
  );
}

export default memo(TaskCard);