"use client";

import { ComponentProps, Fragment } from "react";
import { Badge } from "@/components/reui/badge";
import {
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
} from "@/components/reui/kanban";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GripVerticalIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import TaskItemListView from "../task-card";
import type { TaskResponseDto as Task, SectionResponseDto } from "@todo/shared";
import { AddTaskDialogTrigger } from "../add-task-dialog";
import { getColorConfig } from "@/lib/color-palette";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TaskCardProps extends Omit<
  ComponentProps<typeof KanbanItem>,
  "value" | "children"
> {
  task: Task;
  asHandle?: boolean;
  isOverlay?: boolean;
}

export function TaskCard({ task, asHandle, isOverlay, ...props }: TaskCardProps) {
  const Wrapper = asHandle && !isOverlay ? KanbanItemHandle : Fragment;

  return (
    <KanbanItem value={task.id} {...props}>
      <Wrapper>
        <TaskItemListView task={task} />
      </Wrapper>
    </KanbanItem>
  );
}

export interface TaskColumnProps extends Omit<
  ComponentProps<typeof KanbanColumn>,
  "children"
> {
  projectId: string;
  tasks: Task[];
  section?: SectionResponseDto;
  isOverlay?: boolean;
  onEdit: (section: SectionResponseDto) => void;
  onDelete: (section: SectionResponseDto) => void;
}

export function TaskColumn({
  projectId,
  value,
  section,
  tasks,
  isOverlay,
  onEdit,
  onDelete,
  ...props
}: TaskColumnProps) {
  const title = section?.name || "Untitled section";
  const colorConfig = getColorConfig(section?.colorKey);

  return (
    <KanbanColumn value={value} {...props}>
      <Card
        className={cn(
          "mb-2.5 transition-colors border-border/80",
          section?.colorKey && colorConfig?.badgeBgClass
        )}
      >
        <CardHeader className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="item-title truncate" title={title}>
              {title}
            </span>
            <Badge variant="outline" className="shrink-0">
              {tasks.length}
            </Badge>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(triggerProps) => (
                  <Button
                    {...triggerProps}
                    size="icon-xs"
                    variant="ghost"
                    className="opacity-0 group-hover/kanban-column:opacity-100 data-popup-open:opacity-100 focus-visible:opacity-100 text-muted-foreground hover:text-foreground transition-opacity rounded-md"
                    aria-label={`Section options for ${title}`}
                  />
                )}
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => section && onEdit(section)}
                    className="flex items-center gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                  >
                    <PencilIcon className="size-3.5 text-muted-foreground" />
                    <span>Edit section</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-border/50" />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => section && onDelete(section)}
                    className="flex items-center gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                  >
                    <Trash2Icon className="size-3.5" />
                    <span>Delete section</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <KanbanColumnHandle render={<Button size="icon-xs" variant="ghost" className="rounded-md" />}>
              <GripVerticalIcon className="size-4" />
            </KanbanColumnHandle>
          </div>
        </CardHeader>
        <CardContent>
          <KanbanColumnContent value={value} className="list-stack">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                asHandle={!isOverlay}
                isOverlay={isOverlay}
              />
            ))}
            <AddTaskDialogTrigger sectionId={value} projectId={projectId} />
          </KanbanColumnContent>
        </CardContent>
      </Card>
    </KanbanColumn>
  );
}
