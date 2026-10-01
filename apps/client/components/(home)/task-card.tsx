import { memo } from "react";
import { TaskResponseDto as Task } from "@todo/shared";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from "@/components/ui/item"

import {
  AlarmClockIcon,
  CalendarRangeIcon,
  HashIcon,
  RefreshCwIcon,
  TagIcon
} from "lucide-react";
import { useEditTaskDialogStore } from "@/providers/MyStoreProvider";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { taskLabelService } from "@/services/task-label.service";
import { useQuery } from "@tanstack/react-query";

function TaskCardInner({ task }: { task: Task }) {
  const mockTask = {
    reminder: "1 hour before",
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
      className="group relative bg-card text-card-foreground hover:bg-accent/40 border-border/80 hover:border-primary/50 shadow-xs transition-colors rounded-xl p-2.5 cursor-pointer select-none"
      onClick={() => {
        setTask(task);
        setDialogIsOpen(true);
      }}
    >
      <ItemContent className="space-y-1.5">
        <ItemTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {task.title}
        </ItemTitle>
        {task.description && (
          <ItemDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </ItemDescription>
        )}

        <ItemFooter className="pt-1.5 [&_svg]:size-3.5 flex items-center justify-between gap-2 border-t border-border/30 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {taskDueLocalTime && (
              <div className="flex items-center gap-1 text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md">
                <CalendarRangeIcon className="text-primary/70" />
                <span title={taskDueLocalTime} className="text-[11px] font-medium">
                  {taskDueLocalTime}
                </span>
              </div>
            )}

            {task.recurrence && (
              <div className="flex items-center gap-1 text-muted-foreground bg-muted/40 p-1 rounded-md" title="Recurring task">
                <RefreshCwIcon className="text-emerald-500" />
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
                      <span className="text-[11px] font-medium">{labels.length}</span>
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
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 ml-auto shrink-0">
              <span className="truncate max-w-[80px] font-medium">{task.section.project.name}</span>
              <HashIcon className="size-3 opacity-60" />
            </div>
          )}
        </ItemFooter>
      </ItemContent>
    </Item>
  );
}

export default memo(TaskCardInner);