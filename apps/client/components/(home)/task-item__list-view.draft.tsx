"use client";

import { Task } from "@/types/task.type";

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

export default function TaskItemListView({ task }: { task: Task }) {
  const mockTask = {
    id: "1",
    title: "Task Title",
    description: "Task description goes here. It can be a brief summary of the task.",
    dueDate: "Today",
    recurrence: "Daily",
    reminder: "1 hour before",
    labels: ["Label 1", "Label 2"],
    project: "Work",
  };

  const setTask = useEditTaskDialogStore((state) => state.setTask);
  const setDialogIsOpen = useEditTaskDialogStore((state) => state.setDialogIsOpen);

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
            <div className="flex items-center gap-1">
              <CalendarRangeIcon />
              <span className="text-xs text-muted-foreground">{mockTask.dueDate}</span>
            </div>

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

            {mockTask.labels.length > 0 && (
              <Tooltip>
                <TooltipTrigger render={<TagIcon />} />
                <TooltipContent>
                  <ul className="flex flex-col gap-1">
                    {mockTask.labels.map((label, index) => (
                      <li key={index} className="text-xs">
                        {label}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{mockTask.project}</span>
            <HashIcon />
          </div>
        </ItemFooter>
      </ItemContent>
    </Item>
  );
}