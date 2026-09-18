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

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import { Checkbox } from "@/components/ui/checkbox";

import { AlarmClock, CalendarRange, Hash, RefreshCw, Tag } from "lucide-react";

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

  return (
    <Card className="p-0">
      <CardContent className="p-0">
        <Item>
          <ItemMedia>
            <Checkbox className="cursor-pointer size-5 rounded-full border-2 border-blue-500 data-checked:bg-blue-500 data-checked:border-blue-500" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle> {task.title} </ItemTitle>
            <ItemDescription> {task.description} </ItemDescription>
            
            <ItemFooter className="[&_svg]:size-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <CalendarRange />
                  <span className="text-xs text-muted-foreground">{mockTask.dueDate}</span>
                </div>

                {mockTask.recurrence && (
                  <div className="flex items-center gap-1">
                    <RefreshCw />
                  </div>
                )}

                {mockTask.reminder && (
                  <div className="flex items-center gap-1">
                    <AlarmClock />
                  </div>
                )}

                {mockTask.labels.length > 0 && (
                  <ul className="flex items-center gap-3">
                    {mockTask.labels.map((label, index) => (
                      <li key={index}>
                        <div className="flex items-center gap-1">
                          <Tag />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{mockTask.project}</span>
                <Hash />
              </div>
            </ItemFooter>
          </ItemContent>
        </Item>

      </CardContent>
    </Card>
  );
}