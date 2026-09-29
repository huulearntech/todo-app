"use client";

import { TaskResponseDto as Task } from "@todo/shared";

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemFooter,
  ItemTitle,
} from "@/components/ui/item"

import { Checkbox } from "@/components/ui/checkbox";

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

export default function TaskItemListView({ task }: { task: Task }) {
  const mockTask = {
    recurrence: "Daily",
    reminder: "1 hour before",
  };

  const { data: labels = [] } = useQuery({
    queryKey: ["task-labels", task.id],
    queryFn: taskLabelService.getMyTaskLabels,
    select: (labels) => labels.filter(label => task.labels.some(taskLabel => taskLabel.id === label.id)),
  });

  const setTask = useEditTaskDialogStore((state) => state.setTask);
  const setDialogIsOpen = useEditTaskDialogStore((state) => state.setDialogIsOpen);


  const taskDueLocalTime = task.timeRange?.end ? new Date(task.timeRange.end).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }) : undefined;

  return (
    <Item
      variant="outline"
      onClick={() => {
        setTask(task);
        setDialogIsOpen(true);
      }}
    >
      {/* <ItemMedia>
            <Checkbox className="cursor-pointer size-5 rounded-full border-2 border-blue-500 data-checked:bg-blue-500 data-checked:border-blue-500" />
          </ItemMedia> */}
      <ItemContent>
        <ItemTitle> {task.title} </ItemTitle>
        <ItemDescription> {task.description} </ItemDescription>

        <ItemFooter className="[&_svg]:size-4">
          <div className="flex items-center gap-3">
            {taskDueLocalTime && (
              <div className="flex items-center gap-1">
                <CalendarRangeIcon />
                <span
                  title={taskDueLocalTime}
                  className="text-xs text-muted-foreground"
                >{taskDueLocalTime}</span>
              </div>
            )}

            {mockTask.recurrence && (
              <div className="flex items-center gap-1">
                <RefreshCwIcon />
              </div>
            )}

            {mockTask.reminder && (
              <div className="flex items-center gap-1">
                <AlarmClockIcon />
              </div>
            )}

            {labels.length > 0 && (
              <Tooltip>
                <TooltipTrigger render={<TagIcon />} />
                <TooltipContent>
                  <ul className="flex flex-col gap-1">
                    {labels.map((label) => (
                      <li key={label.id} className="text-xs">
                        {label.name}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{task.section.project.name}</span>
            <HashIcon />
          </div>
        </ItemFooter>
      </ItemContent>
    </Item>
  );
}