"use client";

import { ComponentProps, Fragment, useState } from "react";
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

import { useProjectAbilityContext } from "@/features/projects/permissions";
import EditSectionDialog from "@/features/sections/components/edit-section-dialog";
import { DeleteSectionDialog } from "@/features/sections/components/delete-section-dialog";

export interface TaskCardProps extends Omit<
  ComponentProps<typeof KanbanItem>,
  "value" | "children"
> {
  task: Task;
  asHandle?: boolean;
  isOverlay?: boolean;
}

export function TaskCard({ task, asHandle, isOverlay, ...props }: TaskCardProps) {
  const ability = useProjectAbilityContext();
  const canMoveTask = ability.can("task:move");

  const Wrapper = asHandle && !isOverlay && canMoveTask ? KanbanItemHandle : Fragment;

  return (
    <KanbanItem value={task.id} disabled={!canMoveTask} {...props}>
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
}

export function TaskColumn({
  projectId,
  value,
  section,
  tasks,
  isOverlay,
  ...props
}: TaskColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const ability = useProjectAbilityContext();
  const canUpdateSection = ability.can("section:update");
  const canMoveSection = canUpdateSection;
  const canDeleteSection = ability.can("section:delete");
  const canCreateTask = ability.can("task:create");

  const title = section?.name || "Untitled section";
  const colorConfig = getColorConfig(section?.colorKey);

  const hasSectionActions = canUpdateSection || canDeleteSection;

  return (
    <KanbanColumn value={value} disabled={!canMoveSection} {...props}>
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
            {hasSectionActions && (
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
                    {canUpdateSection && (
                      <DropdownMenuItem
                        onClick={() => section && setIsEditing(true)}
                        className="flex items-center gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                      >
                        <PencilIcon className="size-3.5 text-muted-foreground" />
                        <span>Edit section</span>
                      </DropdownMenuItem>
                    )}
                    {canUpdateSection && canDeleteSection && (
                      <DropdownMenuSeparator className="my-1 bg-border/50" />
                    )}
                    {canDeleteSection && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => section && setIsDeleting(true)}
                        className="flex items-center gap-2 rounded-lg cursor-pointer text-xs px-2 py-1.5"
                      >
                        <Trash2Icon className="size-3.5" />
                        <span>Delete section</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {canMoveSection && (
              <KanbanColumnHandle render={<Button size="icon-xs" variant="ghost" className="rounded-md" />}>
                <GripVerticalIcon className="size-4" />
              </KanbanColumnHandle>
            )}
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
            {canCreateTask && (
              <AddTaskDialogTrigger sectionId={value} projectId={projectId} />
            )}
          </KanbanColumnContent>
        </CardContent>
      </Card>

      {isEditing && section && (
        <EditSectionDialog
          section={section}
          onClose={() => setIsEditing(false)}
        />
      )}

      {isDeleting && section && (
        <DeleteSectionDialog
          section={section}
          onClose={() => setIsDeleting(false)}
        />
      )}
    </KanbanColumn>
  );
}
