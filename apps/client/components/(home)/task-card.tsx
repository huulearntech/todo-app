import { memo } from "react";
import { TaskResponseDto as Task } from "@todo/shared";

import {
  Item,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"

import {
  AlarmClockIcon,
  CalendarRangeIcon,
  HashIcon,
  RepeatIcon,
  TagIcon
} from "lucide-react";
import { useEditTaskDialogStore } from "@/providers/MyStoreProvider";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { taskLabelService } from "@/services/task-label.service";
import { taskService } from "@/services/task.service";
import { toast } from "@/components/ui/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "../ui/checkbox";

import { cn } from "cn";

const priorityCheckboxStyles: Record<string, string> = {
  high: "border-red-500 dark:border-red-500 not-data-checked:hover:bg-red-500/10 data-checked:bg-red-500 data-checked:border-red-500 dark:data-checked:bg-red-500 dark:data-checked:border-red-500",
  medium: "border-amber-500 dark:border-amber-500 not-data-checked:hover:bg-amber-500/10 data-checked:bg-amber-500 data-checked:border-amber-500 dark:data-checked:bg-amber-500 dark:data-checked:border-amber-500",
  low: "border-blue-500 dark:border-blue-500 not-data-checked:hover:bg-blue-500/10 data-checked:bg-blue-500 data-checked:border-blue-500 dark:data-checked:bg-blue-500 dark:data-checked:border-blue-500",
};

function TaskCardInner({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  // TODO: aad reminder to the task entity
  const mockTask = {
    reminder: "1 hour before",
  };

  const handleCheckedChange = async (checked: boolean) => {
    try {
      if (checked) {
        const scheduledDate = task.timeRange?.start ?? undefined;
        const result = await taskService.completeTaskOccurrence(task.id, {
          scheduledDate,
        });
        toast.add({
          title: result.isRecurringAdvanced
            ? "Occurrence completed"
            : "Task completed",
          description: result.isRecurringAdvanced
            ? `Next occurrence scheduled for ${
                result.nextDueTime
                  ? new Date(result.nextDueTime).toLocaleDateString()
                  : "future date"
              }.`
            : `"${task.title}" marked as completed.`,
          type: "success",
        });
      } else {
        await taskService.uncompleteTaskOccurrence(task.id);
        toast.add({
          title: "Occurrence restored",
          description: `"${task.title}" marked as incomplete.`,
          type: "info",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["productivity"] });
    } catch {
      toast.add({
        title: "Error",
        description: "Failed to update task status",
        type: "error",
      });
    }
  };

  const { data: labels = [] } = useQuery({
    queryKey: ["task-labels", task.id],
    queryFn: taskLabelService.getMyTaskLabels,
    select: (labels) => labels.filter(label => task.labels.some(taskLabel => taskLabel.id === label.id)),
    staleTime: 1000 * 60 * 5,
  });

  const setTask = useEditTaskDialogStore((state) => state.setTask);
  const setDialogIsOpen = useEditTaskDialogStore((state) => state.setDialogIsOpen);

  const taskDueLocalTime = task.timeRange?.end ? new Date(task.timeRange.end).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  }) : undefined;

  return (
    <Item
      variant="outline"
      className="group relative text-card-foreground border-border/80 hover:border-primary/50 shadow-xs transition-colors rounded-xl p-2.5 cursor-pointer select-none"
      onClick={() => {
        setTask(task);
        setDialogIsOpen(true);
      }}
    >
      <ItemHeader>
        <div className="space-y-1.5">
          <ItemTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {task.title}
          </ItemTitle>

          {task.description && (
            <ItemDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </ItemDescription>
          )}

        </div>
        <Checkbox
          checked={!!task.completedAt}
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
                <CalendarRangeIcon className="text-primary/70" />
                <span title={taskDueLocalTime} className="text-xs font-medium">
                  {taskDueLocalTime}
                </span>
              </div>
            )}

            {task.recurrence && (
              <div className="flex items-center gap-1 text-muted-foreground bg-muted/40 p-1 rounded-md" title="Recurring task">
                <RepeatIcon className="text-emerald-500" />
              </div>
            )}

            {mockTask.reminder && (
              <div className="flex items-center gap-1 text-muted-foreground bg-muted/40 p-1 rounded-md" title="Reminder set">
                <AlarmClockIcon className="text-amber-500" />
              </div>
            )}

            {labels.length > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="flex items-center gap-1 text-muted-foreground bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md">
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
            <div
              className="flex items-center gap-1 text-xs ml-auto shrink-0"
              // TODO: project color
              // style={{ color: task.section.project.color }}
            >
              <span className="truncate max-w-[80px] font-medium">{task.section.project.name}</span>
              <HashIcon className="size-3 opacity-60" />
            </div>
          )}
        </ItemFooter>
    </Item>
  );
}
// TODO : Fix AI bullshit
export default memo(TaskCardInner);